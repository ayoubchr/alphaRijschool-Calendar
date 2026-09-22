import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPackageById, getSingleLessonPackage } from "@/lib/packages";
import { depositAmount } from "@/lib/pricing";
import { createDepositPayment } from "@/lib/mollie";
import { encryptField } from "@/lib/encryption";

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
    nationalRegisterNumber: z.string().optional(),
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

  const singleLessonPkg = await getSingleLessonPackage();
  const amount = depositAmount(singleLessonPkg, transmission);

  let dossierId: string;
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
            ? encryptField(details.nationalRegisterNumber)
            : null,
          packageId: pkg.id,
          transmission,
          hoursRemaining: pkg.hours,
        },
      });

      for (const slot of slots) {
        await tx.lesson.create({
          data: {
            dossierId: dossier.id,
            instructorId,
            packageId: pkg.id,
            startAt: new Date(slot.startAt),
            endAt: new Date(slot.endAt),
            status: "PLANNED",
          },
        });
      }

      return dossier;
    });
    dossierId = result.id;
  } catch {
    return NextResponse.json({ error: "Dit lesmoment is ondertussen al bezet." }, { status: 409 });
  }

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
}
