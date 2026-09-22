import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

vi.mock("@/lib/mollie", () => ({
  createDepositPayment: vi.fn().mockResolvedValue({ id: "tr_test", checkoutUrl: "https://mollie.test/pay/tr_test" }),
}));

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("POST /api/bookings", () => {
  it("creates a dossier, planned lessons and an open payment, and returns a checkout URL", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "AUTOMAAT",
        instructorId: instructor.id,
        slots: [{ startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toBe("https://mollie.test/pay/tr_test");

    const dossier = await prisma.dossier.findFirstOrThrow();
    expect(dossier.email).toBe("jan@example.com");
    const lessons = await prisma.lesson.findMany();
    expect(lessons).toHaveLength(1);
    const payments = await prisma.payment.findMany();
    expect(payments[0].amount).toBe(16000);
    expect(payments[0].status).toBe("OPEN");
  });

  it("encrypts nationalRegisterNumber at rest instead of storing it as plaintext", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });

    const { POST } = await import("./route");
    const nationalRegisterNumber = "85073003328";
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "AUTOMAAT",
        instructorId: instructor.id,
        slots: [{ startAt: "2026-09-29T09:00:00.000Z", endAt: "2026-09-29T11:00:00.000Z" }],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
          nationalRegisterNumber,
        },
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);

    const dossier = await prisma.dossier.findFirstOrThrow();
    expect(dossier.nationalRegisterNumber).not.toBeNull();
    expect(dossier.nationalRegisterNumber).not.toBe(nationalRegisterNumber);
    expect(dossier.nationalRegisterNumber).not.toContain(nationalRegisterNumber);
  });

  it("returns 409 instead of 500 when a lesson slot overlaps an existing planned lesson for the same instructor", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    const existingDossier = await prisma.dossier.create({
      data: {
        email: "existing@example.com", firstName: "Existing", lastName: "Dossier",
        phone: "0470000001", address: "Straat 2", dateOfBirth: new Date("2000-01-01"),
        packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: pkg.hours,
      },
    });
    await prisma.lesson.create({
      data: {
        dossierId: existingDossier.id, instructorId: instructor.id, packageId: pkg.id,
        startAt: new Date("2026-09-30T09:00:00.000Z"), endAt: new Date("2026-09-30T11:00:00.000Z"),
        status: "PLANNED",
      },
    });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "AUTOMAAT",
        instructorId: instructor.id,
        slots: [{ startAt: "2026-09-30T10:00:00.000Z", endAt: "2026-09-30T12:00:00.000Z" }],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan2@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(409);

    const dossiers = await prisma.dossier.findMany();
    expect(dossiers).toHaveLength(1);
    const payments = await prisma.payment.findMany();
    expect(payments).toHaveLength(0);
  });
});
