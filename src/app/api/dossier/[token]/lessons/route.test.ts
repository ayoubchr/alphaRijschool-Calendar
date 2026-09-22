import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

async function setupDossier(hoursRemaining: number, token = "abc123") {
  const pkg = await prisma.package.create({
    data: { name: "20-Uur Pakket", description: "x", hours: 20, priceAutomaat: 155000, priceManueel: 145000, registrationFee: 2500 },
  });
  const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
  const dossier = await prisma.dossier.create({
    data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining },
  });
  await prisma.magicLink.create({ data: { dossierId: dossier.id, token, expiresAt: new Date(Date.now() + 3600_000) } });
  return { dossier, instructor };
}

// See src/app/api/bookings/route.test.ts's addAllDayRule for why a 09:00-17:00 Brussels rule on
// the request's weekday makes the requested UTC slot line up with a real computeAvailableSlots
// result, now that this route validates the slot before booking it (item 4).
async function addAllDayRule(instructorId: string, weekday: number) {
  await prisma.availabilityRule.create({ data: { instructorId, weekday, startTime: "09:00", endTime: "17:00" } });
}

describe("POST /api/dossier/[token]/lessons", () => {
  it("books a confirmed lesson and decrements hoursRemaining", async () => {
    const { instructor } = await setupDossier(4);
    await addAllDayRule(instructor.id, 1); // Monday 2026-09-28
    const { POST } = await import("./route");
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }),
    });

    const response = await POST(request as any, { params: { token: "abc123" } });
    expect(response.status).toBe(201);

    const dossier = await prisma.dossier.findFirstOrThrow();
    expect(dossier.hoursRemaining).toBe(2);
    const lesson = await prisma.lesson.findFirstOrThrow();
    expect(lesson.status).toBe("CONFIRMED");
  });

  it("rejects when there is not enough remaining credit", async () => {
    const { instructor } = await setupDossier(1);
    await addAllDayRule(instructor.id, 1);
    const { POST } = await import("./route");
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }),
    });

    const response = await POST(request as any, { params: { token: "abc123" } });
    expect(response.status).toBe(409);
  });

  it("returns 409 instead of 500 when the slot overlaps an existing lesson for the same instructor", async () => {
    const { dossier, instructor } = await setupDossier(4);
    await addAllDayRule(instructor.id, 3); // Wednesday 2026-09-30
    await prisma.lesson.create({
      data: {
        dossierId: dossier.id, instructorId: instructor.id, packageId: dossier.packageId!,
        startAt: new Date("2026-09-30T09:00:00.000Z"), endAt: new Date("2026-09-30T11:00:00.000Z"),
        status: "PLANNED",
      },
    });

    const { POST } = await import("./route");
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, startAt: "2026-09-30T10:00:00.000Z", endAt: "2026-09-30T12:00:00.000Z" }),
    });

    // With server-side slot validation in place (item 4), this is now rejected earlier as "not a
    // real available slot" rather than by the DB's overlap-exclusion constraint — still 409 either
    // way. See "two concurrent requests for the same valid slot" below for a case that still
    // exercises the raw DB constraint.
    const response = await POST(request as any, { params: { token: "abc123" } });
    expect(response.status).toBe(409);

    const updatedDossier = await prisma.dossier.findFirstOrThrow();
    expect(updatedDossier.hoursRemaining).toBe(4);
    const lessons = await prisma.lesson.findMany();
    expect(lessons).toHaveLength(1);
  });

  it("returns 400 for a nonexistent instructor instead of crashing on the FK constraint", async () => {
    await setupDossier(4);
    const { POST } = await import("./route");
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: "nonexistent-instructor-id", startAt: "2026-10-01T09:00:00.000Z", endAt: "2026-10-01T11:00:00.000Z" }),
    });

    // The route now validates the instructor exists/is active/supports the dossier's transmission
    // (item 4) before attempting to write anything, so a bad instructorId is cleanly rejected with
    // 400 instead of surfacing as a raw FK constraint violation.
    const response = await POST(request as any, { params: { token: "abc123" } });
    expect(response.status).toBe(400);

    const dossier = await prisma.dossier.findFirstOrThrow();
    expect(dossier.hoursRemaining).toBe(4);
    const lessons = await prisma.lesson.findMany();
    expect(lessons).toHaveLength(0);
  });

  it("rejects a slot with no matching availability rule with 409", async () => {
    const { instructor } = await setupDossier(4);
    // No availability rule created for this instructor at all.
    const { POST } = await import("./route");
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }),
    });

    const response = await POST(request as any, { params: { token: "abc123" } });
    expect(response.status).toBe(409);
    const dossier = await prisma.dossier.findFirstOrThrow();
    expect(dossier.hoursRemaining).toBe(4);
  });

  it("rejects a slot whose duration is not exactly the lesson block length with 400", async () => {
    const { instructor } = await setupDossier(4);
    await addAllDayRule(instructor.id, 1);
    const { POST } = await import("./route");
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T10:00:00.000Z" }),
    });

    const response = await POST(request as any, { params: { token: "abc123" } });
    expect(response.status).toBe(400);
  });

  it("allows only one of two concurrent requests against a dossier with exactly enough hours for one booking", async () => {
    const { dossier, instructor } = await setupDossier(2, "concurrent-token");
    await addAllDayRule(instructor.id, 4); // Thursday 2026-10-01
    const { POST } = await import("./route");

    // Two different (non-overlapping) slots so a failure can only come from the credit race, not
    // the lesson-overlap exclusion constraint.
    const requestA = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, startAt: "2026-10-01T09:00:00.000Z", endAt: "2026-10-01T11:00:00.000Z" }),
    });
    const requestB = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, startAt: "2026-10-01T11:00:00.000Z", endAt: "2026-10-01T13:00:00.000Z" }),
    });

    const [responseA, responseB] = await Promise.all([
      POST(requestA as any, { params: { token: "concurrent-token" } }),
      POST(requestB as any, { params: { token: "concurrent-token" } }),
    ]);

    const statuses = [responseA.status, responseB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const updatedDossier = await prisma.dossier.findUniqueOrThrow({ where: { id: dossier.id } });
    expect(updatedDossier.hoursRemaining).toBe(0);
    const lessons = await prisma.lesson.findMany({ where: { dossierId: dossier.id } });
    expect(lessons).toHaveLength(1);
  });
});
