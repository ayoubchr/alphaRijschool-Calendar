import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ruleSchema = z.object({
  instructorId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function GET() {
  const instructors = await prisma.instructor.findMany({
    include: { availabilityRules: true, availabilityExceptions: true },
  });
  return NextResponse.json(instructors);
}

export async function POST(request: NextRequest) {
  const parsed = ruleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const rule = await prisma.availabilityRule.create({ data: parsed.data });
  return NextResponse.json(rule, { status: 201 });
}
