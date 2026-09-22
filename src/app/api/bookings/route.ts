import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPackageById, getSingleLessonPackage } from "@/lib/packages";
import { depositAmount } from "@/lib/pricing";
import { createDepositPayment } from "@/lib/mollie";
import { encryptField } from "@/lib/encryption";
import { validateRequestedSlot } from "@/lib/slotValidation";
import { isValidRijksregisternummer, normalizeRijksregisternummer } from "@/lib/rijksregisternummer";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

const bookingSchema = z.object({
  packageId: z.string().min(1),
  transmission: z.enum(["AUTOMAAT", "MANUEEL"]),
  instructorId: z.string().min(1),
  slots: z.array(z.object({ startAt: z.string().datetime(), endAt: z.string().datetime() })).min(1),
  details: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    dateOfBirth: z.string().min(1),
    nationalRegisterNumber: z
      .string()
      .optional()
      .refine((value) => !value || isValidRijksregisternummer(value), {
        message: "Ongeldig rijksregisternummer. Verwacht formaat: 11 cijfers, eventueel met punten/streepjes.",
      }),
  }),
});

export async function POST(request: NextRequest) {
  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { packageId, transmission, instructorId, slots, details } = parsed.data;

  const pkg = await getPackageById(packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Pakket niet gevonden." }, { status: 404 });
  }

  // The total requested hours must fit within the chosen package's hours — otherwise a caller
  // could request more lesson blocks than the package they're paying for actually includes.
  const requestedHours = slots.length * (LESSON_BLOCK_MINUTES / 60);
  if (requestedHours > pkg.hours) {
    return NextResponse.json(
      { error: "Het aantal gevraagde lesuren overschrijdt het gekozen pakket." },
      { status: 400 }
    );
  }

  for (const slot of slots) {
    const validationError = await validateRequestedSlot({
      instructorId,
      transmission,
      startAt: new Date(slot.startAt),
      endAt: new Date(slot.endAt),
    });
    if (validationError) {
      return NextResponse.json({ error: validationError.message }, { status: validationError.status });
    }
  }

  const singleLessonPkg = await getSingleLessonPackage();
  const amount = depositAmount(singleLessonPkg, transmission);

  let dossierId: string;
  let createdLessonIds: string[];
  try {
    const result = await prisma.$transaction(async (tx) => {
      const dossier = await tx.dossier.create({
        data: {
          email: details.email,
          firstName: details.firstName,
          lastName: details.lastName,
          phone: details.phone,
          address: details.address,
          dateOfBirth: new Date(details.dateOfBirth),
          nationalRegisterNumber: details.nationalRegisterNumber
            ? encryptField(normalizeRijksregisternummer(details.nationalRegisterNumber) ?? details.nationalRegisterNumber)
            : null,
          packageId: pkg.id,
          transmission,
          hoursRemaining: pkg.hours,
        },
      });

      const lessonIds: string[] = [];
      for (const slot of slots) {
        const lesson = await tx.lesson.create({
          data: {
            dossierId: dossier.id,
            instructorId,
            packageId: pkg.id,
            startAt: new Date(slot.startAt),
            endAt: new Date(slot.endAt),
            status: "PLANNED",
          },
        });
        lessonIds.push(lesson.id);
      }

      return { dossier, lessonIds };
    });
    dossierId = result.dossier.id;
    createdLessonIds = result.lessonIds;
  } catch (error) {
    // Prisma has no native concept of a Postgres EXCLUDE constraint, so it surfaces the raw
    // driver error wrapped as a generic PrismaClientKnownRequestError (code P2039) whose message
    // embeds the underlying Postgres SQLSTATE. 23P01 is exclusion_violation — the lesson-overlap
    // constraint from the Lesson_no_overlap migration. Only that specific case is a real booking
    // conflict; any other transaction failure (bad FK, connection loss, etc.) must not be
    // reported to the client as "slot already booked", so it is re-thrown for normal 500 handling.
    const isOverlapConflict =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2039" &&
      error.message.includes("23P01");
    if (!isOverlapConflict) {
      throw error;
    }
    return NextResponse.json({ error: "Dit lesmoment is ondertussen al bezet." }, { status: 409 });
  }

  try {
    const payment = await createDepositPayment({
      amountCents: amount,
      description: `Voorschot ${pkg.name}`,
      redirectUrl: `${process.env.APP_URL}/boeken/bevestiging?dossier=${dossierId}`,
      webhookUrl: `${process.env.APP_URL}/api/webhooks/mollie`,
      metadata: { dossierId },
    });

    await prisma.payment.create({
      data: { dossierId, molliePaymentId: payment.id, amount, type: "DEPOSIT", status: "OPEN" },
    });

    return NextResponse.json({ checkoutUrl: payment.checkoutUrl });
  } catch (error) {
    // The dossier+lessons transaction already committed by this point. If Mollie payment
    // creation fails here, those PLANNED lessons would otherwise have no associated Payment row
    // and nothing would ever cancel them — they'd sit forever, permanently blocking that
    // instructor's slot. Cancel them immediately so the slot frees back up, then surface a
    // generic error to the client (they can retry the booking from scratch).
    await prisma.lesson.updateMany({
      where: { id: { in: createdLessonIds }, status: "PLANNED" },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(
      { error: "Er ging iets mis bij het starten van de betaling. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
