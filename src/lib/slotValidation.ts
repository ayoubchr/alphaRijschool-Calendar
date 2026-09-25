import { prisma } from "@/lib/prisma";
import { computeAvailableSlots } from "@/lib/availability";
import { isTooSoonToPlan } from "@/lib/brusselsWeek";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

export interface SlotValidationError {
  status: number;
  message: string;
}

/**
 * Validates that a requested (instructorId, transmission, startAt, endAt) tuple corresponds to a
 * real, currently-open lesson slot before any lesson row is created for it. Without this, an
 * anonymous caller could book (and thus permanently block) an instructor for an arbitrary-length,
 * arbitrary-timed slot with no relation to the instructor's actual availability — the DB-level
 * overlap-exclusion constraint only prevents two bookings from overlapping each other, it says
 * nothing about whether either one was ever actually offered.
 *
 * Returns null when the slot is valid, or a { status, message } pair to return to the client
 * otherwise.
 */
export async function validateRequestedSlot(params: {
  instructorId: string;
  transmission: "AUTOMAAT" | "MANUEEL";
  startAt: Date;
  endAt: Date;
}): Promise<SlotValidationError | null> {
  const { instructorId, transmission, startAt, endAt } = params;

  if (isTooSoonToPlan(startAt)) {
    return { status: 400, message: "Een les kan ten vroegste morgen ingepland worden." };
  }

  const durationMs = endAt.getTime() - startAt.getTime();
  if (durationMs !== LESSON_BLOCK_MINUTES * 60_000) {
    return { status: 400, message: "Ongeldige lesduur." };
  }

  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    include: { availabilityRules: true, availabilityExceptions: true },
  });
  if (!instructor || !instructor.active || (instructor.transmission !== "BOTH" && instructor.transmission !== transmission)) {
    return { status: 400, message: "Instructeur niet gevonden of niet beschikbaar voor deze transmissie." };
  }

  // A one-day margin on either side is enough to cover any availability window or exception that
  // might touch the requested slot's calendar day, without pulling in the instructor's entire
  // booking history.
  const rangeStart = new Date(startAt.getTime() - 24 * 60 * 60 * 1000);
  const rangeEnd = new Date(endAt.getTime() + 24 * 60 * 60 * 1000);

  const bookedLessons = await prisma.lesson.findMany({
    where: {
      instructorId,
      status: { in: ["PLANNED", "CONFIRMED"] },
      startAt: { gte: rangeStart },
      endAt: { lte: rangeEnd },
    },
  });

  const slots = computeAvailableSlots({
    rules: instructor.availabilityRules,
    exceptions: instructor.availabilityExceptions.map((e) => ({
      date: e.date.toISOString().slice(0, 10),
      startTime: e.startTime,
      endTime: e.endTime,
      isAvailable: e.isAvailable,
    })),
    bookedLessons: bookedLessons.map((l) => ({ startAt: l.startAt, endAt: l.endAt })),
    rangeStart,
    rangeEnd,
    lessonDurationMinutes: LESSON_BLOCK_MINUTES,
  });

  const isRealSlot = slots.some((s) => s.startAt.getTime() === startAt.getTime() && s.endAt.getTime() === endAt.getTime());
  if (!isRealSlot) {
    return { status: 409, message: "Dit tijdstip is niet beschikbaar." };
  }

  return null;
}
