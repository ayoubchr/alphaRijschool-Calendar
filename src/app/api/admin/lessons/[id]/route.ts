import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canCancelWithRefund } from "@/lib/cancellation";
import { auth } from "@/lib/auth";

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
    await prisma.lesson.update({ where: { id: lesson.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ status: "CANCELLED", refundEligible });
  }

  try {
    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: { startAt: new Date(parsed.data.startAt), endAt: new Date(parsed.data.endAt) },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Dit nieuwe tijdstip is al bezet." }, { status: 409 });
  }
}
