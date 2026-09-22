import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentStatus } from "@/lib/mollie";
import { generateMagicLinkToken, magicLinkExpiryDate } from "@/lib/magicLink";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const paymentId = formData.get("id")?.toString();
  if (!paymentId) {
    return NextResponse.json({ error: "Geen betalings-id ontvangen." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { molliePaymentId: paymentId },
    include: { dossier: { include: { lessons: true } } },
  });
  if (!payment) {
    return NextResponse.json({ error: "Onbekende betaling." }, { status: 404 });
  }

  const { status } = await getPaymentStatus(paymentId);
  const blockHours = LESSON_BLOCK_MINUTES / 60;

  if (status === "paid") {
    // Atomically claim this payment for processing. A plain findUnique-then-check (the previous
    // approach) has a race: two concurrent or retried webhook deliveries for the same payment
    // could both read status !== "PAID" before either writes, and both would then double-process
    // it (double-decrementing hours, creating two magic links, sending two confirmation emails).
    // The conditional updateMany below can only ever flip exactly one caller's request from
    // non-PAID to PAID — Postgres serializes the two UPDATEs on the same row, and whichever loses
    // the race sees its WHERE clause fail to match (count 0) once the winner has already committed.
    const claimed = await prisma.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "PAID" },
    });
    if (claimed.count === 0) {
      // Another request already processed this payment — no-op, don't repeat the side effects.
      return NextResponse.json({ received: true });
    }

    const decrementHours = payment.dossier.lessons.length * blockHours;
    // Defensive floor: never let hoursRemaining go negative. This matters for 0-hour packages
    // (e.g. "Praktijkexamen") whose confirmed lesson still consumes a block.
    const newHoursRemaining = Math.max(0, payment.dossier.hoursRemaining - decrementHours);

    await prisma.$transaction([
      prisma.lesson.updateMany({ where: { dossierId: payment.dossierId, status: "PLANNED" }, data: { status: "CONFIRMED" } }),
      prisma.dossier.update({ where: { id: payment.dossierId }, data: { hoursRemaining: newHoursRemaining } }),
    ]);

    const magicLink = await prisma.magicLink.create({
      data: { dossierId: payment.dossierId, token: generateMagicLinkToken(), expiresAt: magicLinkExpiryDate() },
    });

    await sendBookingConfirmationEmail({
      to: payment.dossier.email,
      dossierName: `${payment.dossier.firstName} ${payment.dossier.lastName}`,
      magicLinkToken: magicLink.token,
      lessons: payment.dossier.lessons.map((l) => ({ startAt: l.startAt, endAt: l.endAt })),
    });
  } else if (["failed", "canceled", "expired"].includes(status)) {
    // Same idempotent-claim pattern as the paid branch, so a retried failure notification
    // doesn't repeatedly re-cancel lessons that a later, different event may have already
    // moved on from.
    const claimed = await prisma.payment.updateMany({
      where: { id: payment.id, status: { not: "FAILED" } },
      data: { status: "FAILED" },
    });
    if (claimed.count > 0) {
      await prisma.lesson.updateMany({ where: { dossierId: payment.dossierId, status: "PLANNED" }, data: { status: "CANCELLED" } });
    }
  }

  return NextResponse.json({ received: true });
}
