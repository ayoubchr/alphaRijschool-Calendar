import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resetDatabase } from "./resetDatabase";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

describe("resetDatabase", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("removes all packages", async () => {
    await prisma.package.create({
      data: {
        name: "Test", description: "x", hours: 1,
        priceAutomaat: 100, priceManueel: 100, registrationFee: 0,
      },
    });
    await resetDatabase(prisma);
    const count = await prisma.package.count();
    expect(count).toBe(0);
  });
});
