import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canCancelWithRefund } from "@/lib/cancellation";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type Failure = { ok: false; status: number; error: string };

async function requireStaff(): Promise<Failure | null> {
  const session = await auth();
  if (!session) return { ok: false, status: 401, error: "Niet aangemeld." };
  return null;
}

export async function confirmLesson(id: string) {
  const denied = await requireStaff();
  if (denied) return denied;

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) return { ok: false as const, status: 404, error: "Les niet gevonden." };

  await prisma.lesson.update({ where: { id: lesson.id }, data: { status: "CONFIRMED" } });
  return { ok: true as const, status: "CONFIRMED" as const };
}

export async function cancelLesson(id: string) {
  const denied = await requireStaff();
  if (denied) return denied;

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) return { ok: false as const, status: 404, error: "Les niet gevonden." };

  const refundEligible = canCancelWithRefund(lesson.startAt);
  const blockHours = LESSON_BLOCK_MINUTES / 60;

  await prisma.$transaction(async (tx) => {
    await tx.lesson.update({ where: { id: lesson.id }, data: { status: "CANCELLED" } });
    if (refundEligible) {
      await tx.dossier.update({
        where: { id: lesson.dossierId },
        data: { hoursRemaining: { increment: blockHours } },
      });
    }
  });

  return { ok: true as const, status: "CANCELLED" as const, refundEligible };
}

export async function rescheduleLesson(id: string, startAt: string, endAt: string) {
  const denied = await requireStaff();
  if (denied) return denied;

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) return { ok: false as const, status: 404, error: "Les niet gevonden." };

  try {
    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: { startAt: new Date(startAt), endAt: new Date(endAt) },
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
