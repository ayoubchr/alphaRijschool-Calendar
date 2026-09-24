"use server";

import { revalidatePath } from "next/cache";
import { cancelLesson } from "@/lib/admin/lessons";

export async function cancelBooking(id: string) {
  const result = await cancelLesson(id);
  if (result.ok) revalidatePath("/admin/boekingen");
  return result;
}
