import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { availabilityRuleSchema } from "@/lib/validations/availability";

export async function createAvailabilityRule(input: unknown) {
  const session = await auth();
  if (!session) return { ok: false as const, status: 401, error: "Niet aangemeld." };

  const parsed = availabilityRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, status: 400, error: "Ongeldig tijdvenster." };
  }

  const rule = await prisma.availabilityRule.create({ data: parsed.data });
  return { ok: true as const, rule };
}
