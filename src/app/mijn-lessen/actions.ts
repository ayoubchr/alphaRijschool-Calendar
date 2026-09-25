"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bookStudentLessons, changeStudentLesson } from "@/lib/student/lessons";
import { createServerSupabase } from "@/lib/supabase/server";

export async function planLessons(input: { dossierId: string; slots: { instructorId: string; startAt: string; endAt: string }[] }) {
  const result = await bookStudentLessons(input);
  if (result.ok) revalidatePath("/mijn-lessen");
  return result;
}

export async function cancelOwnLesson(lessonId: string) {
  const result = await changeStudentLesson({ lessonId, action: "cancel" });
  if (result.ok) revalidatePath("/mijn-lessen");
  return result;
}

export async function moveOwnLesson(input: { lessonId: string; instructorId: string; startAt: string; endAt: string }) {
  const result = await changeStudentLesson({ action: "reschedule", lessonId: input.lessonId, startAt: input.startAt, endAt: input.endAt, instructorId: input.instructorId });
  if (result.ok) revalidatePath("/mijn-lessen");
  return result;
}

export async function logoutStudent() {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
