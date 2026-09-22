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
});
