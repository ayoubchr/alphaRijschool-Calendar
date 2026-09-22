import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

async function setupDossier(hoursRemaining: number) {
  const pkg = await prisma.package.create({
    data: { name: "20-Uur Pakket", description: "x", hours: 20, priceAutomaat: 155000, priceManueel: 145000, registrationFee: 2500 },
  });
  const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
  const dossier = await prisma.dossier.create({
    data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining },
  });
  await prisma.magicLink.create({ data: { dossierId: dossier.id, token: "abc123", expiresAt: new Date(Date.now() + 3600_000) } });
  return { dossier, instructor };
}

describe("POST /api/dossier/[token]/lessons", () => {
  it("books a confirmed lesson and decrements hoursRemaining", async () => {
    const { instructor } = await setupDossier(4);
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

    const response = await POST(request as any, { params: { token: "abc123" } });
    expect(response.status).toBe(409);

    const updatedDossier = await prisma.dossier.findFirstOrThrow();
    expect(updatedDossier.hoursRemaining).toBe(4);
    const lessons = await prisma.lesson.findMany();
    expect(lessons).toHaveLength(1);
  });

  it("does not report a non-overlap transaction failure (bad instructorId FK) as a false 409", async () => {
    await setupDossier(4);
    const { POST } = await import("./route");
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: "nonexistent-instructor-id", startAt: "2026-10-01T09:00:00.000Z", endAt: "2026-10-01T11:00:00.000Z" }),
    });

    // This is a foreign-key constraint violation (Prisma code P2003), not the lesson-overlap
    // exclusion constraint (P2039 / Postgres 23P01) — the route re-throws it, and since these
    // tests call the handler function directly (not through Next's request pipeline), that
    // surfaces here as a rejected promise rather than a 409 JSON response.
    await expect(POST(request as any, { params: { token: "abc123" } })).rejects.toThrow(/Foreign key constraint/);

    const dossier = await prisma.dossier.findFirstOrThrow();
    expect(dossier.hoursRemaining).toBe(4);
    const lessons = await prisma.lesson.findMany();
    expect(lessons).toHaveLength(0);
  });
});
