import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canCancelWithRefund } from "@/lib/cancellation";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";
import { formatLessonMoment } from "@/lib/email";
import { notifyStaffOfLessons } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { validateRequestedSlot } from "@/lib/slotValidation";

type Failure = { ok: false; status: number; error: string };

const TOO_LATE = "Annuleren of verplaatsen kan tot 2 dagen op voorhand.";

async function requireStaff(): Promise<Failure | { ok: true; user: { role?: string; instructorId?: string } }> {
  const session = await auth();
  if (!session) return { ok: false, status: 401, error: "Niet aangemeld." };
  const user = session.user as { role?: string; instructorId?: string };
  if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
    return { ok: false, status: 403, error: "Geen toegang." };
  }
  return { ok: true, user };
}

function ownsLesson(user: { role?: string; instructorId?: string }, instructorId: string) {
  return user.role === "ADMIN" || user.instructorId === instructorId;
}

export async function confirmLesson(id: string) {
  const access = await requireStaff();
  if (!access.ok) return access;

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) return { ok: false as const, status: 404, error: "Les niet gevonden." };

  await prisma.lesson.update({ where: { id: lesson.id }, data: { status: "CONFIRMED" } });
  return { ok: true as const, status: "CONFIRMED" as const };
}

export async function cancelLesson(id: string) {
  const access = await requireStaff();
  if (!access.ok) return access;

  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { dossier: true, instructor: true } });
  if (!lesson) return { ok: false as const, status: 404, error: "Les niet gevonden." };
  if (!ownsLesson(access.user, lesson.instructorId)) {
    return { ok: false as const, status: 403, error: "Je kan alleen je eigen lessen aanpassen." };
  }
  if (!canCancelWithRefund(lesson.startAt)) {
    return { ok: false as const, status: 409, error: TOO_LATE };
  }

  const blockHours = LESSON_BLOCK_MINUTES / 60;
  await prisma.$transaction(async (tx) => {
    await tx.lesson.update({ where: { id: lesson.id }, data: { status: "CANCELLED" } });
    await tx.dossier.update({
      where: { id: lesson.dossierId },
      data: { hoursRemaining: { increment: blockHours } },
    });
  });

  const studentName = `${lesson.dossier.firstName} ${lesson.dossier.lastName}`;
  await notifyStaffOfLessons({
    title: "Les geannuleerd",
    intro: `${studentName}: ${formatLessonMoment(lesson.startAt, lesson.endAt)} is geannuleerd.`,
    lessons: [{ startAt: lesson.startAt, endAt: lesson.endAt, instructorName: lesson.instructor.name, instructorId: lesson.instructorId, studentName }],
  });

  return { ok: true as const, status: "CANCELLED" as const, refundEligible: true };
}

export async function rescheduleLesson(id: string, startAt: string, endAt: string, instructorId: string) {
  const access = await requireStaff();
  if (!access.ok) return access;

  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { dossier: true, instructor: true } });
  if (!lesson) return { ok: false as const, status: 404, error: "Les niet gevonden." };
  if (!ownsLesson(access.user, lesson.instructorId)) {
    return { ok: false as const, status: 403, error: "Je kan alleen je eigen lessen aanpassen." };
  }
  if (lesson.dossier.transmission === "BOTH") {
    return { ok: false as const, status: 400, error: "Ongeldige transmissie voor dit dossier." };
  }
  if (!canCancelWithRefund(lesson.startAt)) {
    return { ok: false as const, status: 409, error: TOO_LATE };
  }

  const nextStart = new Date(startAt);
  const nextEnd = new Date(endAt);
  const validationError = await validateRequestedSlot({
    instructorId,
    transmission: lesson.dossier.transmission,
    startAt: nextStart,
    endAt: nextEnd,
  });
  if (validationError) return { ok: false as const, status: validationError.status, error: validationError.message };

  try {
    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: { startAt: nextStart, endAt: nextEnd, instructorId },
      include: { instructor: true },
    });
    const studentName = `${lesson.dossier.firstName} ${lesson.dossier.lastName}`;
    await notifyStaffOfLessons({
      title: "Les verplaatst",
      intro: `${studentName} is verplaatst van ${formatLessonMoment(lesson.startAt, lesson.endAt)} naar ${formatLessonMoment(nextStart, nextEnd)}.`,
      lessons: [{ startAt: nextStart, endAt: nextEnd, instructorName: updated.instructor.name, instructorId, studentName }],
    });
    return { ok: true as const, lesson: updated };
  } catch (error) {
    const isOverlapConflict =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2039" &&
      error.message.includes("23P01");
    if (!isOverlapConflict) throw error;
    return { ok: false as const, status: 409, error: "Dit nieuwe tijdstip is al bezet." };
  }
}
