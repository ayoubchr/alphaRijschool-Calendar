import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

vi.mock("@/lib/mollie", () => ({ getPaymentStatus: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendBookingConfirmationEmail: vi.fn().mockResolvedValue(undefined) }));

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("POST /api/webhooks/mollie", () => {
  it("confirms lessons, decrements hoursRemaining and creates a magic link when paid", async () => {
    const { getPaymentStatus } = await import("@/lib/mollie");
    vi.mocked(getPaymentStatus).mockResolvedValue({ status: "paid", metadata: {} });

    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    const dossier = await prisma.dossier.create({
      data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "0470000000", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 2 },
    });
    await prisma.lesson.create({ data: { dossierId: dossier.id, instructorId: instructor.id, packageId: pkg.id, startAt: new Date("2026-09-28T09:00:00Z"), endAt: new Date("2026-09-28T11:00:00Z"), status: "PLANNED" } });
    await prisma.payment.create({ data: { dossierId: dossier.id, molliePaymentId: "tr_test", amount: 16000, type: "DEPOSIT", status: "OPEN" } });

    const { POST } = await import("./route");
    const form = new URLSearchParams({ id: "tr_test" });
    const request = new Request("http://localhost/api/webhooks/mollie", { method: "POST", body: form });
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    const updatedPayment = await prisma.payment.findUniqueOrThrow({ where: { molliePaymentId: "tr_test" } });
    expect(updatedPayment.status).toBe("PAID");
    const lesson = await prisma.lesson.findFirstOrThrow();
    expect(lesson.status).toBe("CONFIRMED");
    const updatedDossier = await prisma.dossier.findUniqueOrThrow({ where: { id: dossier.id } });
    expect(updatedDossier.hoursRemaining).toBe(0);
    const magicLink = await prisma.magicLink.findFirstOrThrow();
    expect(magicLink.dossierId).toBe(dossier.id);
  });

  it("processes only one of two simultaneous webhook deliveries for the same payment (idempotent)", async () => {
    const { getPaymentStatus } = await import("@/lib/mollie");
    vi.mocked(getPaymentStatus).mockResolvedValue({ status: "paid", metadata: {} });

    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    const dossier = await prisma.dossier.create({
      data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "0470000000", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 2 },
    });
    await prisma.lesson.create({ data: { dossierId: dossier.id, instructorId: instructor.id, packageId: pkg.id, startAt: new Date("2026-09-28T09:00:00Z"), endAt: new Date("2026-09-28T11:00:00Z"), status: "PLANNED" } });
    await prisma.payment.create({ data: { dossierId: dossier.id, molliePaymentId: "tr_concurrent", amount: 16000, type: "DEPOSIT", status: "OPEN" } });

    const { POST } = await import("./route");
    function makeRequest() {
      const form = new URLSearchParams({ id: "tr_concurrent" });
      return new Request("http://localhost/api/webhooks/mollie", { method: "POST", body: form });
    }

    // Call the handler twice "simultaneously" (without awaiting the first) to simulate two
    // concurrent or retried webhook deliveries racing each other.
    const [responseA, responseB] = await Promise.all([POST(makeRequest() as any), POST(makeRequest() as any)]);
    expect(responseA.status).toBe(200);
    expect(responseB.status).toBe(200);

    const updatedDossier = await prisma.dossier.findUniqueOrThrow({ where: { id: dossier.id } });
    // Would be -2 if both deliveries decremented; must have been decremented exactly once.
    expect(updatedDossier.hoursRemaining).toBe(0);

    const magicLinks = await prisma.magicLink.findMany({ where: { dossierId: dossier.id } });
    expect(magicLinks).toHaveLength(1);

    const { sendBookingConfirmationEmail } = await import("@/lib/email");
    expect(sendBookingConfirmationEmail).toHaveBeenCalledTimes(1);
  });

  it("clamps hoursRemaining at 0 instead of going negative for a 0-hour package (e.g. Praktijkexamen)", async () => {
    const { getPaymentStatus } = await import("@/lib/mollie");
    vi.mocked(getPaymentStatus).mockResolvedValue({ status: "paid", metadata: {} });

    const pkg = await prisma.package.create({
      data: { name: "Praktijkexamen", description: "x", hours: 0, priceAutomaat: 21500, priceManueel: 20000, registrationFee: 2500 },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    const dossier = await prisma.dossier.create({
      data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "0470000000", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 0 },
    });
    await prisma.lesson.create({ data: { dossierId: dossier.id, instructorId: instructor.id, packageId: pkg.id, startAt: new Date("2026-09-28T09:00:00Z"), endAt: new Date("2026-09-28T11:00:00Z"), status: "PLANNED" } });
    await prisma.payment.create({ data: { dossierId: dossier.id, molliePaymentId: "tr_zero_hours", amount: 21500, type: "DEPOSIT", status: "OPEN" } });

    const { POST } = await import("./route");
    const form = new URLSearchParams({ id: "tr_zero_hours" });
    const response = await POST(new Request("http://localhost/api/webhooks/mollie", { method: "POST", body: form }) as any);

    expect(response.status).toBe(200);
    const updatedDossier = await prisma.dossier.findUniqueOrThrow({ where: { id: dossier.id } });
    expect(updatedDossier.hoursRemaining).toBe(0);
  });

  it("marks the payment FAILED and cancels planned lessons when the payment failed", async () => {
    const { getPaymentStatus } = await import("@/lib/mollie");
    vi.mocked(getPaymentStatus).mockResolvedValue({ status: "failed", metadata: {} });
    const { sendBookingConfirmationEmail } = await import("@/lib/email");

    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    const dossier = await prisma.dossier.create({
      data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "0470000000", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 2 },
    });
    await prisma.lesson.create({ data: { dossierId: dossier.id, instructorId: instructor.id, packageId: pkg.id, startAt: new Date("2026-09-28T09:00:00Z"), endAt: new Date("2026-09-28T11:00:00Z"), status: "PLANNED" } });
    await prisma.payment.create({ data: { dossierId: dossier.id, molliePaymentId: "tr_test", amount: 16000, type: "DEPOSIT", status: "OPEN" } });

    const { POST } = await import("./route");
    const form = new URLSearchParams({ id: "tr_test" });
    const request = new Request("http://localhost/api/webhooks/mollie", { method: "POST", body: form });
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    const updatedPayment = await prisma.payment.findUniqueOrThrow({ where: { molliePaymentId: "tr_test" } });
    expect(updatedPayment.status).toBe("FAILED");
    const lesson = await prisma.lesson.findFirstOrThrow();
    expect(lesson.status).toBe("CANCELLED");
    expect(sendBookingConfirmationEmail).not.toHaveBeenCalled();
  });
});
