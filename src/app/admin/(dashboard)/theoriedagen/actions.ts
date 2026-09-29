"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { brusselsDateAndTime, isTooSoonToPlan } from "@/lib/brusselsWeek";
import { THEORY_DAY_MINUTES } from "@/lib/lessonBlocks";
import { prisma } from "@/lib/prisma";

const STARTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Alleen een beheerder kan theoriedagen inplannen." };
  }
  return { ok: true as const };
}

export async function createTheoryDay(input: { date: string; startTime: string }) {
  const access = await requireAdmin();
  if (!access.ok) return access;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !STARTS.includes(input.startTime)) {
    return { ok: false as const, error: "Kies een datum en een startuur." };
  }
  const startAt = brusselsDateAndTime(input.date, input.startTime);
  if (isTooSoonToPlan(startAt)) {
    return { ok: false as const, error: "Kies een datum vanaf morgen." };
  }
  const endAt = new Date(startAt.getTime() + THEORY_DAY_MINUTES * 60_000);
  const existing = await prisma.theoryDay.findUnique({ where: { startAt } });
  if (existing) return { ok: false as const, error: "Die theoriedag staat al ingepland." };
  const day = await prisma.theoryDay.create({ data: { startAt, endAt } });
  revalidatePath("/admin/theoriedagen");
  revalidatePath("/admin/agenda");
  return { ok: true as const, day: { id: day.id, startAt: day.startAt.toISOString(), endAt: day.endAt.toISOString() } };
}

export async function deleteTheoryDay(id: string) {
  const access = await requireAdmin();
  if (!access.ok) return access;
  await prisma.theoryDay.delete({ where: { id } });
  revalidatePath("/admin/theoriedagen");
  revalidatePath("/admin/agenda");
  return { ok: true as const };
}
