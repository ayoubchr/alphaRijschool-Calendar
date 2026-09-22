import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canCancelWithRefund } from "@/lib/cancellation";
import { auth } from "@/lib/auth";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("reschedule"), startAt: z.string().datetime(), endAt: z.string().datetime() }),
]);

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Niet aangemeld." }, { status: 401 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: "Les niet gevonden." }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.action === "confirm") {
    await prisma.lesson.update({ where: { id: lesson.id }, data: { status: "CONFIRMED" } });
    return NextResponse.json({ status: "CONFIRMED" });
  }

  if (parsed.data.action === "cancel") {
    const refundEligible = canCancelWithRefund(lesson.startAt);
    const blockHours = LESSON_BLOCK_MINUTES / 60;

    await prisma.$transaction(async (tx) => {
      await tx.lesson.update({ where: { id: lesson.id }, data: { status: "CANCELLED" } });
      if (refundEligible) {
        // Cancelling with enough notice (>= CANCELLATION_WINDOW_HOURS) restores the block hours
        // to the dossier's balance so the student can rebook without losing that credit — the
        // "deposit stays valid" promise from the spec. Without this, the hours were silently
        // lost on every eligible cancellation.
        await tx.dossier.update({ where: { id: lesson.dossierId }, data: { hoursRemaining: { increment: blockHours } } });
      }
    });

    return NextResponse.json({ status: "CANCELLED", refundEligible });
  }

  try {
    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: { startAt: new Date(parsed.data.startAt), endAt: new Date(parsed.data.endAt) },
    });
    return NextResponse.json(updated);
  } catch (error) {
    // Same narrowing as the bookings/dossier-lessons routes: Prisma surfaces the Postgres
    // EXCLUDE constraint violation (lesson overlap, SQLSTATE 23P01) as a generic
    // PrismaClientKnownRequestError (P2039). Only that specific case is a real double-booking
    // conflict; a reversed-time or otherwise-malformed reschedule request must not be swallowed
    // into a false "slot taken" 409.
    const isOverlapConflict =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2039" &&
      error.message.includes("23P01");
    if (!isOverlapConflict) {
      throw error;
    }
    return NextResponse.json({ error: "Dit nieuwe tijdstip is al bezet." }, { status: 409 });
  }
}
