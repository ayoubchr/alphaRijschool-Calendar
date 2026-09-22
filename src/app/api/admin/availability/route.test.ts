import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("POST /api/admin/availability", () => {
  it("creates a weekly availability rule for an instructor", async () => {
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    const { POST } = await import("./route");

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, weekday: 2, startTime: "09:00", endTime: "17:00" }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(201);

    const rules = await prisma.availabilityRule.findMany({ where: { instructorId: instructor.id } });
    expect(rules).toHaveLength(1);
    expect(rules[0].weekday).toBe(2);
  });
});

describe("GET /api/admin/availability", () => {
  it("returns instructors with their rules", async () => {
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await prisma.availabilityRule.create({ data: { instructorId: instructor.id, weekday: 1, startTime: "09:00", endTime: "12:00" } });

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(body).toHaveLength(1);
    expect(body[0].availabilityRules).toHaveLength(1);
  });
});
