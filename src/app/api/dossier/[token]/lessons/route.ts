import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findDossierByMagicLinkToken } from "@/lib/dossiers";
import { validateRequestedSlot } from "@/lib/slotValidation";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

const schema = z.object({
  instructorId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

class InsufficientCreditError extends Error {}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const dossier = await findDossierByMagicLinkToken(params.token);
  if (!dossier) {
    return NextResponse.json({ error: "Link is ongeldig of verlopen." }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { transmission } = dossier;
  if (transmission === "BOTH") {
    // Dossiers are always created with AUTOMAAT or MANUEEL (see the bookings route's zod
    // schema) — BOTH is only a valid value for Instructor.transmission. This should never
    // happen in practice; guarding it here just keeps the type-checker (and any future
    // data anomaly) honest instead of silently mismatching against an instructor's slots.
    return NextResponse.json({ error: "Ongeldige transmissie voor dit dossier." }, { status: 400 });
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  const validationError = await validateRequestedSlot({
    instructorId: parsed.data.instructorId,
    transmission,
    startAt,
    endAt,
  });
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: validationError.status });
  }

  const blockHours = LESSON_BLOCK_MINUTES / 60;

  try {
    const lesson = await prisma.$transaction(async (tx) => {
      // The sufficiency check must happen as part of the same atomic conditional update that
      // performs the decrement — not as a plain read beforehand — otherwise two concurrent
      // requests against the same dossier could both pass the check before either writes,
      // driving hoursRemaining negative. Only one of two racing requests can succeed here: the
      // `gte` guard means the second request's updateMany matches zero rows once the first has
      // already decremented past the threshold, so its count is 0.
      const updateResult = await tx.dossier.updateMany({
        where: { id: dossier.id, hoursRemaining: { gte: blockHours } },
        data: { hoursRemaining: { decrement: blockHours } },
      });
      if (updateResult.count === 0) {
        throw new InsufficientCreditError();
      }

      return tx.lesson.create({
        data: {
          dossierId: dossier.id,
          instructorId: parsed.data.instructorId,
          packageId: dossier.packageId,
          startAt,
          endAt,
          status: "CONFIRMED",
        },
      });
    });
    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    if (error instanceof InsufficientCreditError) {
      return NextResponse.json({ error: "Onvoldoende tegoed over voor een nieuwe les." }, { status: 409 });
    }
    // Same narrowing as the bookings route: Prisma surfaces the Postgres EXCLUDE
    // constraint violation (lesson overlap, SQLSTATE 23P01) as a generic
    // PrismaClientKnownRequestError (P2039). Only that specific case is a real
    // double-booking conflict; anything else must not be swallowed into a false 409.
    const isOverlapConflict =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2039" &&
      error.message.includes("23P01");
    if (!isOverlapConflict) {
      throw error;
    }
    return NextResponse.json({ error: "Dit lesblok is ondertussen al bezet." }, { status: 409 });
  }
}
