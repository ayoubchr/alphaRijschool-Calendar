import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPackageById } from "@/lib/packages";
import { depositAmount } from "@/lib/pricing";
import { createDepositPayment } from "@/lib/mollie";
import { encryptField } from "@/lib/encryption";
import { validateRequestedSlot } from "@/lib/slotValidation";
import { normalizeRijksregisternummer } from "@/lib/rijksregisternummer";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";
import { bookingRequestSchema } from "@/lib/validations/booking";

export async function POST(request: NextRequest) {
  const parsed = bookingRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { packageId, transmission, slots, details } = parsed.data;

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

  const seen = new Set<string>();
  for (const slot of slots) {
    const key = `${slot.instructorId}:${slot.startAt}`;
    if (seen.has(key)) {
      return NextResponse.json({ error: "Je koos hetzelfde lesmoment twee keer." }, { status: 400 });
    }
    seen.add(key);
    const validationError = await validateRequestedSlot({
      instructorId: slot.instructorId,
      transmission,
      startAt: new Date(slot.startAt),
      endAt: new Date(slot.endAt),
    });
    if (validationError) {
      return NextResponse.json({ error: validationError.message }, { status: validationError.status });
    }
  }

  const amount = depositAmount(pkg, transmission);

  let dossierId: string;
  let createdLessonIds: string[];
  try {
    const result = await prisma.$transaction(async (tx) => {
      const dossier = await tx.dossier.create({
        data: {
          email: details.email.toLowerCase(),
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
            instructorId: slot.instructorId,
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
      description: `Eerste les + inschrijving ${pkg.name}`,
      redirectUrl: `${process.env.APP_URL}/boeken/bevestiging?dossier=${dossierId}`,
      webhookUrl: `${process.env.APP_URL}/api/webhooks/mollie`,
      metadata: { dossierId },
    });

    await prisma.payment.create({
      data: { dossierId, molliePaymentId: payment.id, amount, type: "DEPOSIT", status: "OPEN" },
    });

    return NextResponse.json({ checkoutUrl: payment.checkoutUrl });
  } catch (error) {
    console.error("Mollie-betaling starten mislukt:", error);
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
