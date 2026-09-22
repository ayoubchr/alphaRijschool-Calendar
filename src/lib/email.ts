import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt.");
  return new Resend(apiKey);
}

export function magicLinkUrlFor(token: string) {
  return `${process.env.APP_URL}/dossier/${token}`;
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  dossierName: string;
  magicLinkToken: string;
  lessons: { startAt: Date; endAt: Date }[];
}) {
  const resend = getResendClient();
  const lessonLines = params.lessons
    .map(
      (l) =>
        `- ${l.startAt.toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })} tot ${l.endAt.toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })}`
    )
    .join("\n");

  await resend.emails.send({
    from: "Alpha Rijschool <inschrijvingen@alpha-rijschool.be>",
    to: params.to,
    subject: "Bevestiging van je inschrijving bij Alpha Rijschool",
    text: [
      `Beste ${params.dossierName},`,
      "",
      "Je voorschot is ontvangen en onderstaande les(sen) staan bevestigd:",
      lessonLines,
      "",
      `Bekijk of beheer je dossier op elk moment via: ${magicLinkUrlFor(params.magicLinkToken)}`,
      "",
      "Tot binnenkort!",
      "Alpha Rijschool",
    ].join("\n"),
  });
}
