"use server";

import { revalidatePath } from "next/cache";
import { createAvailabilityRule } from "@/lib/admin/availability";
export async function addAvailabilityRule(input: unknown) {
  const result = await createAvailabilityRule(input);
  if (result.ok) revalidatePath("/admin/beschikbaarheid");
  return result;
}
