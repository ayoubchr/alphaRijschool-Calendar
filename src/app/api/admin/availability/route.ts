import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const ruleSchema = z
  .object({
    instructorId: z.string().min(1),
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
  });

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Niet aangemeld." }, { status: 401 });
  }

  const instructors = await prisma.instructor.findMany({
    include: { availabilityRules: true, availabilityExceptions: true },
  });
  return NextResponse.json(instructors);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Niet aangemeld." }, { status: 401 });
  }

  const parsed = ruleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const rule = await prisma.availabilityRule.create({ data: parsed.data });
  return NextResponse.json(rule, { status: 201 });
}
