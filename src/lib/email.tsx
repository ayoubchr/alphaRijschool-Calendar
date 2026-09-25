import type { ReactElement } from "react";
import { Resend } from "resend";
import { EmailLayout, EmailRows } from "@/components/email/EmailLayout";
import { EMAIL } from "@/lib/site";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt.");
  return new Resend(apiKey);
}

const FROM = "Alpha Rijschool <no-reply@alpha-rijschool.be>";

export function formatLessonMoment(startAt: Date, endAt: Date) {
  const date = startAt.toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels", weekday: "long", day: "numeric", month: "long" });
  const from = startAt.toLocaleTimeString("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });
  const to = endAt.toLocaleTimeString("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });
  return `${date}, ${from}–${to}`;
}

async function send(params: { to: string | string[]; subject: string; react: ReactElement }) {
  const resend = getResendClient();
  
  const { error } = await resend.emails.send({ from: FROM, to: params.to, subject: params.subject, react: params.react });
  if (error) throw new Error(error.message);
}

export async function sendContactMessage(params: {
  name: string;
  email: string;
  phone: string;
  message: string;
  subject: string;
}) {
  await send({
    to: EMAIL,
    subject: `Contactformulier: ${params.name}`,
    react: (
      <EmailLayout preview={`Nieuw bericht van ${params.name}`} title="Nieuw contactbericht" intro={`${params.name} stuurde een bericht via de website.`}>
        <EmailRows
          rows={[
            { label: "Naam", value: params.name },
            { label: "E-mail", value: params.email },
            { label: "Telefoon", value: params.phone },
            { label: "Onderwerp", value: params.subject },
            { label: "Bericht", value: params.message },
          ]}
        />
      </EmailLayout>
    ),
  });
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  dossierName: string;
  magicLinkUrl: string;
  lessons: { startAt: Date; endAt: Date; instructorName: string }[];
}) {
  const lessonLines = params.lessons.map((lesson) => `${formatLessonMoment(lesson.startAt, lesson.endAt)} met ${lesson.instructorName}`).join("\n");
  await send({
    to: params.to,
    subject: "Bevestiging van je inschrijving bij Alpha Rijschool",
    react: (
      <EmailLayout
        preview="Je inschrijving is bevestigd"
        title="Je inschrijving is bevestigd"
        intro={`Beste ${params.dossierName}, bedankt voor je inschrijving bij Alpha Rijschool. Via de knop hieronder log je in en beheer je je lessen.`}
        action={{ href: params.magicLinkUrl, label: "Naar mijn lessen" }}
        note="Annuleren of verplaatsen kan tot 2 dagen op voorhand."
      >
        <EmailRows rows={[{ label: "Ingeplande lessen", value: lessonLines || "Nog geen les ingepland." }]} />
      </EmailLayout>
    ),
  });
}

export async function sendLoginLinkEmail(params: { to: string; name: string; magicLinkUrl: string }) {
  await send({
    to: params.to,
    subject: "Je inloglink voor Alpha Rijschool",
    react: (
      <EmailLayout
        preview="Log in bij Alpha Rijschool"
        title="Inloggen"
        intro={`Beste ${params.name}, met deze link open je je account. De link is eenmalig te gebruiken.`}
        action={{ href: params.magicLinkUrl, label: "Inloggen" }}
      />
    ),
  });
}

export async function sendLessonsChangedEmail(params: {
  to: string[];
  title: string;
  intro: string;
  lessons: { startAt: Date; endAt: Date; instructorName: string; studentName: string }[];
}) {
  if (params.to.length === 0) return;
  const value = params.lessons
    .map((lesson) => `${lesson.studentName}: ${formatLessonMoment(lesson.startAt, lesson.endAt)} met ${lesson.instructorName}`)
    .join("\n");
  await send({
    to: params.to,
    subject: params.title,
    react: (
      <EmailLayout preview={params.title} title={params.title} intro={params.intro}>
        <EmailRows rows={[{ label: "Lessen", value }]} />
      </EmailLayout>
    ),
  });
}
