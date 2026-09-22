import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAvailableSlots } from "@/lib/availability";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const packageId = searchParams.get("packageId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const weekdayParam = searchParams.get("weekdays");
  const instructorId = searchParams.get("instructorId") ?? undefined;
  const transmissionParam = searchParams.get("transmission") ?? undefined;

  if (!packageId || !from || !to) {
    return NextResponse.json({ error: "packageId, from en to zijn verplicht." }, { status: 400 });
  }
  if (transmissionParam && transmissionParam !== "AUTOMAAT" && transmissionParam !== "MANUEEL") {
    return NextResponse.json({ error: "Ongeldige transmissie." }, { status: 400 });
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    return NextResponse.json({ error: "Pakket niet gevonden." }, { status: 404 });
  }

  const instructors = await prisma.instructor.findMany({
    where: {
      active: true,
      ...(instructorId ? { id: instructorId } : {}),
      // Only show instructors who can teach the requested transmission — an instructor whose
      // `transmission` is fixed to AUTOMAAT or MANUEEL should never be offered to a student who
      // chose the other one. Instructors marked BOTH always qualify.
      ...(transmissionParam ? { transmission: { in: ["BOTH", transmissionParam] } } : {}),
    },
    include: { availabilityRules: true, availabilityExceptions: true },
  });

  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);
  const weekdayFilter = weekdayParam ? weekdayParam.split(",").map(Number) : undefined;

  const bookedLessons = await prisma.lesson.findMany({
    where: {
      startAt: { gte: rangeStart },
      endAt: { lte: rangeEnd },
      status: { in: ["PLANNED", "CONFIRMED"] },
      ...(instructorId ? { instructorId } : {}),
    },
  });

  const result = instructors.map((instructor) => ({
    instructorId: instructor.id,
    instructorName: instructor.name,
    slots: computeAvailableSlots({
      rules: instructor.availabilityRules,
      exceptions: instructor.availabilityExceptions.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        startTime: e.startTime,
        endTime: e.endTime,
        isAvailable: e.isAvailable,
      })),
      bookedLessons: bookedLessons
        .filter((l) => l.instructorId === instructor.id)
        .map((l) => ({ startAt: l.startAt, endAt: l.endAt })),
      rangeStart,
      rangeEnd,
      lessonDurationMinutes: LESSON_BLOCK_MINUTES,
      weekdayFilter,
    }),
  }));

  return NextResponse.json(result);
}
