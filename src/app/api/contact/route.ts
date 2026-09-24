import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/contactSchema";
import { sendContactMessage } from "@/lib/email";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Vul alle verplichte velden correct in." }, { status: 400 });
  }

  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendContactMessage(parsed.data);
  } catch {
    return NextResponse.json(
      { error: "Het bericht kon niet worden verstuurd. Mail ons op rijschoolalpha@gmail.com." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
