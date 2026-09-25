"use server";

import { revalidatePath } from "next/cache";
import { cancelLesson, rescheduleLesson } from "@/lib/admin/lessons";

export async function cancelAgendaLesson(id: string) {
  const result = await cancelLesson(id);
  if (result.ok) revalidatePath("/admin/agenda");
  return result;
}

export async function moveAgendaLesson(input: { id: string; instructorId: string; startAt: string; endAt: string }) {
  const result = await rescheduleLesson(input.id, input.startAt, input.endAt, input.instructorId);
  if (result.ok) revalidatePath("/admin/agenda");
  return result.ok ? { ok: true as const } : result;
}
