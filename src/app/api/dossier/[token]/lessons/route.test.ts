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
});
