import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn().mockResolvedValue({});

vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    this.emails = { send: sendMock };
  }),
}));

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.APP_URL = "https://app.test";
  sendMock.mockClear();
});

describe("sendBookingConfirmationEmail", () => {
  it("sends an email containing the magic link and lesson time", async () => {
    const { sendBookingConfirmationEmail } = await import("./email");
    await sendBookingConfirmationEmail({
      to: "student@example.com",
      dossierName: "Jan Jansen",
      magicLinkToken: "abc123",
      lessons: [{ startAt: new Date("2026-09-28T09:00:00Z"), endAt: new Date("2026-09-28T11:00:00Z") }],
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("student@example.com");
    expect(call.text).toContain("https://app.test/dossier/abc123");
  });
});
