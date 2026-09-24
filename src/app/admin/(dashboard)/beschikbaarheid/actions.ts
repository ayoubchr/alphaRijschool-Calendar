"use server";

import { revalidatePath } from "next/cache";
import {
  clearDayExceptions,
  createAvailabilityException,
  createAvailabilityRule,
  createInstructor,
  deleteAvailabilityException,
  deleteAvailabilityRule,
  setDayLeave,
  removeInstructor,
  setDaySlots,
  setInstructorSchedule,
  setWeeklySlots,
  updateAvailabilityRule,
} from "@/lib/admin/availability";

function refresh<T extends { ok: boolean }>(result: T): T {
  if (result.ok) revalidatePath("/admin/beschikbaarheid");
  return result;
}

export async function saveWeeklySlots(input: unknown) {
  return refresh(await setWeeklySlots(input));
}

export async function deleteInstructor(id: string) {
  return refresh(await removeInstructor(id));
}

export async function saveDaySlots(input: unknown) {
  return refresh(await setDaySlots(input));
}

export async function saveInstructorSchedule(input: unknown) {
  return refresh(await setInstructorSchedule(input));
}

export async function addInstructor(input: unknown) {
  return refresh(await createInstructor(input));
}

export async function addAvailabilityRule(input: unknown) {
  return refresh(await createAvailabilityRule(input));
}

export async function editAvailabilityRule(input: unknown) {
  return refresh(await updateAvailabilityRule(input));
}

export async function removeAvailabilityRule(id: string) {
  return refresh(await deleteAvailabilityRule(id));
}

export async function addAvailabilityException(input: unknown) {
  return refresh(await createAvailabilityException(input));
}

export async function markDayLeave(input: unknown) {
  return refresh(await setDayLeave(input));
}

export async function clearDay(input: unknown) {
  return refresh(await clearDayExceptions(input));
}

export async function removeAvailabilityException(id: string) {
  return refresh(await deleteAvailabilityException(id));
}
