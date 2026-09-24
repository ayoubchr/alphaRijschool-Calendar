import { NextRequest, NextResponse } from "next/server";
import { createAvailabilityRule } from "@/lib/admin/availability";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
  const result = await createAvailabilityRule(await request.json());
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.rule, { status: 201 });
}
