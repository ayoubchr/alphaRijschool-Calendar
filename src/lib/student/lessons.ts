import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canCancelWithRefund } from "@/lib/cancellation";
import { blockHoursForPackage, blockMinutesForPackage, hoursBetween, isExamPackage, isTheoryPackage, lessonInstructorName, persistedInstructorId } from "@/lib/lessonBlocks";
import { formatLessonMoment, sendLessonsChangedEmail } from "@/lib/email";
import { notifyStaffOfLessons } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { validateRequestedSlot } from "@/lib/slotValidation";

const TOO_LATE = "Annuleren of verplaatsen kan tot 2 dagen op voorhand.";

async function requireStudentDossier(dossierId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    return { ok: false as const, status: 401, error: "Niet aangemeld." };
  }
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, email: session.user.email },
    include: { lessons: { include: { instructor: true } }, package: true },
  });
  if (!dossier) return { ok: false as const, status: 404, error: "Dossier niet gevonden." };
  return { ok: true as const, dossier, email: session.user.email };
}

export async function bookStudentLessons(input: {
  dossierId: string;
  slots: { instructorId: string; startAt: string; endAt: string }[];
}) {
  const access = await requireStudentDossier(input.dossierId);
  if (!access.ok) return access;
  const { dossier } = access;
  if (dossier.transmission === "BOTH") {
    return { ok: false as const, status: 400, error: "Ongeldige transmissie voor dit dossier." };
  }

  const blockHours = blockHoursForPackage(dossier.package);
  const durationMinutes = blockMinutesForPackage(dossier.package);
  const maxSlots = Math.floor(dossier.hoursRemaining / blockHours);
  if (input.slots.length < 1 || input.slots.length > maxSlots) {
    return { ok: false as const, status: 400, error: `Je kan nog ${maxSlots} les${maxSlots === 1 ? "" : "sen"} inplannen.` };
  }

  for (const slot of input.slots) {
    const validationError = await validateRequestedSlot({
      instructorId: slot.instructorId,
      transmission: dossier.transmission,
      startAt: new Date(slot.startAt),
      endAt: new Date(slot.endAt),
      durationMinutes,
      theory: isTheoryPackage(dossier.package),
      exam: isExamPackage(dossier.package),
    });
    if (validationError) return { ok: false as const, status: validationError.status, error: validationError.message };
  }

  const studentName = `${dossier.firstName} ${dossier.lastName}`;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.dossier.updateMany({
        where: { id: dossier.id, hoursRemaining: { gte: input.slots.length * blockHours } },
        data: { hoursRemaining: { decrement: input.slots.length * blockHours } },
      });
      if (updateResult.count === 0) throw new Error("CREDIT");
      return Promise.all(
        input.slots.map((slot) =>
          tx.lesson.create({
            data: {
              dossierId: dossier.id,
              instructorId: persistedInstructorId(dossier.package, slot.instructorId),
              packageId: dossier.packageId,
              startAt: new Date(slot.startAt),
              endAt: new Date(slot.endAt),
              status: "CONFIRMED",
            },
            include: { instructor: true },
          })
        )
      );
    });

    await notifyStaffOfLessons({
      title: "Nieuwe lessen ingepland",
      intro: `${studentName} plande extra lessen in.`,
      dossierId: dossier.id,
      lessons: created.map((lesson) => ({
        startAt: lesson.startAt,
        endAt: lesson.endAt,
        instructorName: lessonInstructorName(lesson.instructor),
        instructorId: lesson.instructorId,
        studentName,
      })),
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Error && error.message === "CREDIT") {
      return { ok: false as const, status: 409, error: "Onvoldoende tegoed over." };
    }
    const isOverlap =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2039" && error.message.includes("23P01");
    if (isOverlap) return { ok: false as const, status: 409, error: "Dit lesblok is ondertussen al bezet." };
    throw error;
  }
}

export async function changeStudentLesson(input: {
  lessonId: string;
  action: "cancel" | "reschedule";
  startAt?: string;
  endAt?: string;
  instructorId?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    return { ok: false as const, status: 401, error: "Niet aangemeld." };
  }
  const lesson = await prisma.lesson.findFirst({
    where: { id: input.lessonId, dossier: { email: session.user.email }, status: { in: ["PLANNED", "CONFIRMED"] } },
    include: { dossier: { include: { package: true } }, instructor: true, package: true },
  });
  if (!lesson) return { ok: false as const, status: 404, error: "Les niet gevonden." };
  if (!canCancelWithRefund(lesson.startAt)) {
    return { ok: false as const, status: 409, error: TOO_LATE };
  }

  const studentName = `${lesson.dossier.firstName} ${lesson.dossier.lastName}`;
  if (input.action === "cancel") {
    await prisma.$transaction([
      prisma.lesson.update({ where: { id: lesson.id }, data: { status: "CANCELLED" } }),
      prisma.dossier.update({ where: { id: lesson.dossierId }, data: { hoursRemaining: { increment: hoursBetween(lesson.startAt, lesson.endAt) } } }),
    ]);
    await notifyStaffOfLessons({
      title: "Les geannuleerd",
      intro: `${studentName} annuleerde ${formatLessonMoment(lesson.startAt, lesson.endAt)}.`,
      dossierId: lesson.dossierId,
      lessons: [{ startAt: lesson.startAt, endAt: lesson.endAt, instructorName: lessonInstructorName(lesson.instructor), instructorId: lesson.instructorId, studentName }],
    });
    await sendLessonsChangedEmail({
      to: [session.user.email],
      title: "Les geannuleerd",
      intro: "Je les is geannuleerd. Het tegoed staat weer op je dossier.",
      lessons: [{ startAt: lesson.startAt, endAt: lesson.endAt, instructorName: lessonInstructorName(lesson.instructor), studentName }],
    });
    return { ok: true as const };
  }

  if (!input.startAt || !input.endAt || !input.instructorId || lesson.dossier.transmission === "BOTH") {
    return { ok: false as const, status: 400, error: "Kies een nieuw lesmoment." };
  }
  const nextStart = new Date(input.startAt);
  const nextEnd = new Date(input.endAt);
  const theory = isTheoryPackage(lesson.package);
  const validationError = await validateRequestedSlot({
    instructorId: input.instructorId,
    transmission: lesson.dossier.transmission,
    startAt: nextStart,
    endAt: nextEnd,
    durationMinutes: (lesson.endAt.getTime() - lesson.startAt.getTime()) / 60_000,
    theory,
    exam: isExamPackage(lesson.package),
    ignoreLessonId: lesson.id,
  });
  if (validationError) return { ok: false as const, status: validationError.status, error: validationError.message };

  try {
    const updated = await prisma.lesson.update({
    where: { id: lesson.id },
    data: { startAt: nextStart, endAt: nextEnd, instructorId: persistedInstructorId(lesson.package, input.instructorId) },
    include: { instructor: true },
  });
  const moved = [{ startAt: nextStart, endAt: nextEnd, instructorName: lessonInstructorName(updated.instructor), instructorId: updated.instructorId, studentName }];
  await notifyStaffOfLessons({
    title: "Les verplaatst",
    intro: `${studentName} verplaatste een les naar ${formatLessonMoment(nextStart, nextEnd)}.`,
    dossierId: lesson.dossierId,
    lessons: moved,
  });
  await sendLessonsChangedEmail({
    to: [session.user.email],
    title: "Les verplaatst",
    intro: `Je les is verplaatst naar ${formatLessonMoment(nextStart, nextEnd)}.`,
    lessons: moved,
  });
    return { ok: true as const };
  } catch (error) {
    const isOverlap =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2039" && error.message.includes("23P01");
    if (isOverlap) return { ok: false as const, status: 409, error: "Dit lesblok is ondertussen al bezet." };
    throw error;
  }
}
