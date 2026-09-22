import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();
const getMock = vi.fn();

vi.mock("@mollie/api-client", () => ({
  default: () => ({ payments: { create: createMock, get: getMock } }),
  PaymentMethod: { bancontact: "bancontact" },
}));

beforeEach(() => {
  process.env.MOLLIE_API_KEY = "test_key";
  createMock.mockReset();
  getMock.mockReset();
});

describe("createDepositPayment", () => {
  it("creates a Bancontact payment with the amount formatted as euros", async () => {
    createMock.mockResolvedValue({ id: "tr_123", getCheckoutUrl: () => "https://mollie.test/pay/tr_123" });
    const { createDepositPayment } = await import("./mollie");

    const result = await createDepositPayment({
      amountCents: 16000,
      description: "Voorschot",
      redirectUrl: "https://app.test/ok",
      webhookUrl: "https://app.test/webhook",
      metadata: { dossierId: "abc" },
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: { currency: "EUR", value: "160.00" }, method: "bancontact" })
    );
    expect(result).toEqual({ id: "tr_123", checkoutUrl: "https://mollie.test/pay/tr_123" });
  });
});
