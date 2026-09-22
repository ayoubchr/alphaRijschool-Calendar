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

  if (status === "paid" && payment.status !== "PAID") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID" } }),
      prisma.lesson.updateMany({ where: { dossierId: payment.dossierId, status: "PLANNED" }, data: { status: "CONFIRMED" } }),
      prisma.dossier.update({
        where: { id: payment.dossierId },
        data: { hoursRemaining: { decrement: payment.dossier.lessons.length * blockHours } },
      }),
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
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
      prisma.lesson.updateMany({ where: { dossierId: payment.dossierId, status: "PLANNED" }, data: { status: "CANCELLED" } }),
    ]);
  }

  return NextResponse.json({ received: true });
}
