"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";
import { sendLessonsChangedEmail } from "@/lib/email";
import { notifyStaffOfLessons } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { validateRequestedSlot } from "@/lib/slotValidation";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { ok: false as const, error: "Alleen een beheerder kan dossiers aanpassen." };
  return { ok: true as const };
}

export async function updateDossier(input: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  hoursRemaining: number;
}) {
  const access = await requireAdmin();
  if (!access.ok) return access;
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const address = input.address.trim();
  if (!firstName || !lastName || !email.includes("@") || !phone || !address || !Number.isFinite(input.hoursRemaining) || input.hoursRemaining < 0) {
    return { ok: false as const, error: "Vul alle velden geldig in." };
  }
  await prisma.dossier.update({
    where: { id: input.id },
    data: { firstName, lastName, email, phone, address, hoursRemaining: input.hoursRemaining },
  });
  revalidatePath("/admin/dossiers");
  return { ok: true as const };
}

export async function planDossierLessons(input: { dossierId: string; slots: { instructorId: string; startAt: string; endAt: string }[] }) {
  const access = await requireAdmin();
  if (!access.ok) return access;
  const dossier = await prisma.dossier.findUnique({ where: { id: input.dossierId }, include: { package: true } });
  if (!dossier) return { ok: false as const, error: "Dossier niet gevonden." };
  if (dossier.transmission === "BOTH") return { ok: false as const, error: "Ongeldige transmissie voor dit dossier." };

  const blockHours = LESSON_BLOCK_MINUTES / 60;
  const maxSlots = Math.floor(dossier.hoursRemaining / blockHours);
  if (input.slots.length < 1 || input.slots.length > maxSlots) {
    return { ok: false as const, error: `Er kunnen nog ${maxSlots} les${maxSlots === 1 ? "" : "sen"} ingepland worden.` };
  }
  for (const slot of input.slots) {
    const validationError = await validateRequestedSlot({
      instructorId: slot.instructorId,
      transmission: dossier.transmission,
      startAt: new Date(slot.startAt),
      endAt: new Date(slot.endAt),
    });
    if (validationError) return { ok: false as const, error: validationError.message };
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
              instructorId: slot.instructorId,
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
    const moments = created.map((lesson) => ({
      startAt: lesson.startAt,
      endAt: lesson.endAt,
      instructorName: lesson.instructor.name,
      instructorId: lesson.instructorId,
      studentName,
    }));
    await notifyStaffOfLessons({ title: "Lessen ingepland door beheer", intro: `Er zijn lessen ingepland voor ${studentName}.`, lessons: moments });
    await sendLessonsChangedEmail({
      to: [dossier.email],
      title: "Nieuwe lessen ingepland",
      intro: "De rijschool heeft lessen voor je ingepland.",
      lessons: moments,
    });
    revalidatePath("/admin/dossiers");
    revalidatePath("/admin/agenda");
    return {
      ok: true as const,
      hoursRemaining: dossier.hoursRemaining - created.length * blockHours,
      lessons: created.map((lesson) => ({
        id: lesson.id,
        startAt: lesson.startAt.toISOString(),
        endAt: lesson.endAt.toISOString(),
        status: lesson.status,
        instructorName: lesson.instructor.name,
      })),
    };
  } catch (error) {
    if (error instanceof Error && error.message === "CREDIT") return { ok: false as const, error: "Onvoldoende tegoed over." };
    const isOverlap = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2039" && error.message.includes("23P01");
    if (isOverlap) return { ok: false as const, error: "Dit lesblok is ondertussen al bezet." };
    throw error;
  }
}

export async function deleteDossier(id: string) {
  const access = await requireAdmin();
  if (!access.ok) return access;
  await prisma.$transaction([
    prisma.lesson.deleteMany({ where: { dossierId: id } }),
    prisma.payment.deleteMany({ where: { dossierId: id } }),
    prisma.magicLink.deleteMany({ where: { dossierId: id } }),
    prisma.dossier.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/dossiers");
  revalidatePath("/admin/agenda");
  return { ok: true as const };
}
