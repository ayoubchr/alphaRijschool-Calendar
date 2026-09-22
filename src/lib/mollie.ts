import createMollieClient, { PaymentMethod } from "@mollie/api-client";

let client: ReturnType<typeof createMollieClient> | null = null;

export function getMollieClient() {
  if (!client) {
    const apiKey = process.env.MOLLIE_API_KEY;
    if (!apiKey) throw new Error("MOLLIE_API_KEY ontbreekt.");
    client = createMollieClient({ apiKey });
  }
  return client;
}

export async function createDepositPayment(params: {
  amountCents: number;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata: Record<string, string>;
}) {
  const mollie = getMollieClient();
  const payment = await mollie.payments.create({
    amount: { currency: "EUR", value: (params.amountCents / 100).toFixed(2) },
    description: params.description,
    redirectUrl: params.redirectUrl,
    webhookUrl: params.webhookUrl,
    method: PaymentMethod.bancontact,
    metadata: params.metadata,
  });
  return { id: payment.id, checkoutUrl: payment.getCheckoutUrl() ?? "" };
}

export async function getPaymentStatus(paymentId: string) {
  const mollie = getMollieClient();
  const payment = await mollie.payments.get(paymentId);
  return { status: payment.status, metadata: (payment.metadata ?? {}) as Record<string, string> };
}
