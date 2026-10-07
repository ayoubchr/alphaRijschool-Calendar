import { decryptField } from "@/lib/encryption";
import { lessonInstructorName } from "@/lib/lessonBlocks";
import { formatEuro } from "@/lib/money";

const TRANSMISSION: Record<string, string> = { AUTOMAAT: "Automaat", MANUEEL: "Manueel", BOTH: "Beide" };
const PAYMENT_TYPE: Record<string, string> = { DEPOSIT: "Voorschot", BALANCE: "Restbedrag" };

export interface DossierDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  nationalRegisterNumber: string | null;
  packageName: string;
  transmission: string;
  hoursRemaining: number;
  createdAt: string;
  lessons: { id: string; when: string; status: string; instructorName: string }[];
  payments: { id: string; label: string; amount: string; status: string; createdAt: string }[];
}

function formatDateOnly(date: Date) {
  return date.toLocaleDateString("nl-BE", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("nl-BE", { timeZone: "Europe/Brussels", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatMoment(startAt: Date, endAt: Date) {
  const date = startAt.toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels", weekday: "short", day: "numeric", month: "short" });
  const from = startAt.toLocaleTimeString("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });
  const to = endAt.toLocaleTimeString("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });
  return `${date} · ${from}–${to}`;
}

function formatRegister(value: string | null) {
  if (!value) return null;
  try {
    const digits = decryptField(value).replace(/\D/g, "");
    if (digits.length !== 11) return decryptField(value);
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}-${digits.slice(6, 9)}.${digits.slice(9)}`;
  } catch {
    return null;
  }
}

export function serializeDossierDetails(dossier: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
  nationalRegisterNumber: string | null;
  transmission: string;
  hoursRemaining: number;
  createdAt: Date;
  package: { name: string };
  lessons: { id: string; startAt: Date; endAt: Date; status: string; instructor: { name: string } | null }[];
  payments: { id: string; amount: number; type: string; status: string; createdAt: Date }[];
}): DossierDetails {
  return {
    id: dossier.id,
    firstName: dossier.firstName,
    lastName: dossier.lastName,
    email: dossier.email,
    phone: dossier.phone,
    address: dossier.address,
    dateOfBirth: formatDateOnly(dossier.dateOfBirth),
    nationalRegisterNumber: formatRegister(dossier.nationalRegisterNumber),
    packageName: dossier.package.name,
    transmission: TRANSMISSION[dossier.transmission] ?? dossier.transmission,
    hoursRemaining: dossier.hoursRemaining,
    createdAt: formatDateTime(dossier.createdAt),
    lessons: dossier.lessons
      .filter((lesson) => lesson.status !== "CANCELLED")
      .map((lesson) => ({
        id: lesson.id,
        when: formatMoment(lesson.startAt, lesson.endAt),
        status: lesson.status,
        instructorName: lessonInstructorName(lesson.instructor),
      })),
    payments: dossier.payments.map((payment) => ({
      id: payment.id,
      label: PAYMENT_TYPE[payment.type] ?? payment.type,
      amount: formatEuro(payment.amount),
      status: payment.status,
      createdAt: formatDateTime(payment.createdAt),
    })),
  };
}
