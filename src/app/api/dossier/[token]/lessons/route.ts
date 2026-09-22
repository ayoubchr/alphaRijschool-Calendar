import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findDossierByMagicLinkToken } from "@/lib/dossiers";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

const schema = z.object({
  instructorId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const dossier = await findDossierByMagicLinkToken(params.token);
  if (!dossier) {
    return NextResponse.json({ error: "Link is ongeldig of verlopen." }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const blockHours = LESSON_BLOCK_MINUTES / 60;
  if (dossier.hoursRemaining < blockHours) {
    return NextResponse.json({ error: "Onvoldoende tegoed over voor een nieuwe les." }, { status: 409 });
  }

  try {
    const lesson = await prisma.$transaction(async (tx) => {
      const created = await tx.lesson.create({
        data: {
          dossierId: dossier.id,
          instructorId: parsed.data.instructorId,
          packageId: dossier.packageId,
          startAt: new Date(parsed.data.startAt),
          endAt: new Date(parsed.data.endAt),
          status: "CONFIRMED",
        },
      });
      await tx.dossier.update({ where: { id: dossier.id }, data: { hoursRemaining: { decrement: blockHours } } });
      return created;
    });
    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
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
