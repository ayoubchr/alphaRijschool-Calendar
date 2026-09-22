import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { hash } from "bcryptjs";
import { prisma } from "./prisma";
import { resetDatabase } from "../test/resetDatabase";
import { authorizeStaffUser } from "./auth";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("authorizeStaffUser", () => {
  it("returns the user when the password matches", async () => {
    const passwordHash = await hash("secret123", 10);
    await prisma.staffUser.create({ data: { email: "admin@example.com", passwordHash, role: "ADMIN" } });

    const result = await authorizeStaffUser("admin@example.com", "secret123");
    expect(result?.email).toBe("admin@example.com");
  });

  it("returns null when the password does not match", async () => {
    const passwordHash = await hash("secret123", 10);
    await prisma.staffUser.create({ data: { email: "admin@example.com", passwordHash, role: "ADMIN" } });

    expect(await authorizeStaffUser("admin@example.com", "wrong")).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    expect(await authorizeStaffUser("nobody@example.com", "secret123")).toBeNull();
  });
});
