import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

vi.mock("@/lib/mollie", () => ({
  createDepositPayment: vi.fn().mockResolvedValue({ id: "tr_test", checkoutUrl: "https://mollie.test/pay/tr_test" }),
}));

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

// Weekday helper: the tests below book Monday-Thursday dates (2026-09-28 .. 2026-10-01). A wide
// 09:00-17:00 Brussels rule on those weekdays makes each requested UTC slot line up exactly with
// one of computeAvailableSlots' generated 2-hour blocks (see src/lib/availability.test.ts for the
// underlying Brussels-offset math), now that the route validates the slot is real before booking it.
async function addAllDayRule(instructorId: string, weekday: number) {
  await prisma.availabilityRule.create({ data: { instructorId, weekday, startTime: "09:00", endTime: "17:00" } });
}

describe("POST /api/bookings", () => {
  it("creates a dossier, planned lessons and an open payment, and returns a checkout URL", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await addAllDayRule(instructor.id, 1); // Monday 2026-09-28

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
    await addAllDayRule(instructor.id, 2); // Tuesday 2026-09-29

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

  it("rejects an invalid rijksregisternummer format", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await addAllDayRule(instructor.id, 2); // Tuesday 2026-09-29

    const { POST } = await import("./route");
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
          nationalRegisterNumber: "not-a-valid-number",
        },
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const dossiers = await prisma.dossier.findMany();
    expect(dossiers).toHaveLength(0);
  });

  it("returns 409 instead of 500 when a lesson slot overlaps an existing planned lesson for the same instructor", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await addAllDayRule(instructor.id, 3); // Wednesday 2026-09-30
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

    // With server-side slot validation in place (item 4), this specific overlapping/misaligned
    // request is now rejected earlier — by "not a real available slot" — rather than by the DB's
    // overlap-exclusion constraint. It is kept at 409 either way (see the concurrent-booking test
    // below for a case that still exercises the raw DB constraint).
    const response = await POST(request as any);
    expect(response.status).toBe(409);

    const dossiers = await prisma.dossier.findMany();
    expect(dossiers).toHaveLength(1);
    const payments = await prisma.payment.findMany();
    expect(payments).toHaveLength(0);
  });

  it("returns 400 for a nonexistent instructor instead of crashing on the FK constraint", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "AUTOMAAT",
        instructorId: "nonexistent-instructor-id",
        slots: [{ startAt: "2026-10-01T09:00:00.000Z", endAt: "2026-10-01T11:00:00.000Z" }],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan3@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    // The route now validates the instructor exists/is active/supports the transmission (item 4)
    // *before* attempting to write anything, so a bad instructorId is now cleanly rejected with
    // 400 instead of surfacing as a raw FK constraint violation.
    const response = await POST(request as any);
    expect(response.status).toBe(400);

    const dossiers = await prisma.dossier.findMany();
    expect(dossiers).toHaveLength(0);
    const payments = await prisma.payment.findMany();
    expect(payments).toHaveLength(0);
  });

  it("rejects a slot with no matching availability rule with 409", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    // An instructor with NO availability rules at all — every slot should be rejected.
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
          firstName: "Jan", lastName: "Jansen", email: "jan4@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(409);
    const dossiers = await prisma.dossier.findMany();
    expect(dossiers).toHaveLength(0);
  });

  it("rejects a slot whose duration is not exactly the lesson block length with 400", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await addAllDayRule(instructor.id, 1);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "AUTOMAAT",
        instructorId: instructor.id,
        // 3 hours instead of the required 2-hour block, and reversed would crash the DB range
        // constraint with a raw 500 if not caught here first.
        slots: [{ startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T12:00:00.000Z" }],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan5@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const dossiers = await prisma.dossier.findMany();
    expect(dossiers).toHaveLength(0);
  });

  it("rejects a reversed-time slot (endAt before startAt) with 400 instead of crashing", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await addAllDayRule(instructor.id, 1);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "AUTOMAAT",
        instructorId: instructor.id,
        slots: [{ startAt: "2026-09-28T11:00:00.000Z", endAt: "2026-09-28T09:00:00.000Z" }],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan6@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it("rejects an instructor who does not support the requested transmission", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Automaat Jan", transmission: "AUTOMAAT" } });
    await addAllDayRule(instructor.id, 1);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "MANUEEL",
        instructorId: instructor.id,
        slots: [{ startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan7@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it("rejects when the requested hours exceed the chosen package's hours", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await addAllDayRule(instructor.id, 1);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "AUTOMAAT",
        instructorId: instructor.id,
        // 2 slots of 2 hours = 4 hours requested against a 2-hour package.
        slots: [
          { startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" },
          { startAt: "2026-09-28T11:00:00.000Z", endAt: "2026-09-28T13:00:00.000Z" },
        ],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan8@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const dossiers = await prisma.dossier.findMany();
    expect(dossiers).toHaveLength(0);
  });

  it("cancels the newly-created lessons instead of leaving them PLANNED forever when Mollie payment creation fails", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const { createDepositPayment } = await import("@/lib/mollie");
    vi.mocked(createDepositPayment).mockRejectedValueOnce(new Error("Mollie is down"));

    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await addAllDayRule(instructor.id, 4); // Thursday 2026-10-01

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "AUTOMAAT",
        instructorId: instructor.id,
        slots: [{ startAt: "2026-10-01T09:00:00.000Z", endAt: "2026-10-01T11:00:00.000Z" }],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan9@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500);

    const lessons = await prisma.lesson.findMany();
    expect(lessons).toHaveLength(1);
    expect(lessons[0].status).toBe("CANCELLED");
    const payments = await prisma.payment.findMany();
    expect(payments).toHaveLength(0);
  });
});
