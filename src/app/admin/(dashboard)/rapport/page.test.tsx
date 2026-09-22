import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("AdminReportPage", () => {
  it("redirects non-admin staff away from the revenue report", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { role: "INSTRUCTOR" } } as any);
    const AdminReportPage = (await import("./page")).default;

    await AdminReportPage();

    expect(redirect).toHaveBeenCalledWith("/admin/agenda");
  });

  it("renders the report for admin staff", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { role: "ADMIN" } } as any);
    const AdminReportPage = (await import("./page")).default;

    const result = await AdminReportPage();

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
