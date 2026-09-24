"use server";

import { revalidatePath } from "next/cache";
import { cancelLesson } from "@/lib/admin/lessons";

export async function cancelAgendaLesson(id: string) {
  const result = await cancelLesson(id);
  if (result.ok) revalidatePath("/admin/agenda");
  return result;
}
