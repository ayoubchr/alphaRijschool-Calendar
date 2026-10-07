import { isTheoryPackage } from "@/lib/lessonBlocks";
import { formatEuro } from "@/lib/money";

export type Transmission = "AUTOMAAT" | "MANUEEL";

/** First driving lesson, the same for every package. Automaat €160, schakel €150. */
const FIRST_LESSON_CENTS: Record<Transmission, number> = {
  AUTOMAAT: 16000,
  MANUEEL: 15000,
};

export interface PackageLike {
  name?: string;
  hours: number;
  priceAutomaat: number;
  priceManueel: number;
  registrationFee: number;
}

function transmissionPrice(pkg: PackageLike, transmission: Transmission): number {
  return transmission === "AUTOMAAT" ? pkg.priceAutomaat : pkg.priceManueel;
}

export function packagePrice(pkg: PackageLike, transmission: Transmission): number {
  return transmissionPrice(pkg, transmission) + pkg.registrationFee;
}

export interface DepositBreakdown {
  lessonLabel: string;
  lessonAmount: number;
  registrationFee: number;
  total: number;
  /** Theory is paid in full now. Driving pays only the first lesson. */
  paysInFull: boolean;
}

/**
 * What the student pays now, and what bookkeeping should see on the payment.
 * Every driving package: first lesson €160 (automaat) or €150 (schakel), plus
 * the registration fee. Theory is the full package price plus that fee.
 */
export function depositBreakdown(pkg: PackageLike, transmission: Transmission): DepositBreakdown {
  const base = transmissionPrice(pkg, transmission);
  const theory = pkg.name ? isTheoryPackage({ name: pkg.name }) : false;
  const lessonAmount = theory ? base : Math.min(FIRST_LESSON_CENTS[transmission], base);
  return {
    lessonLabel: theory ? "Theorielessen" : "Eerste les",
    lessonAmount,
    registrationFee: pkg.registrationFee,
    total: lessonAmount + pkg.registrationFee,
    paysInFull: theory || lessonAmount >= base,
  };
}

/** Mollie shows this text in the payments list, so the student name comes first. */
export function paymentDescription(pkg: PackageLike, transmission: Transmission, studentName?: string): string {
  const payment = depositBreakdown(pkg, transmission);
  const name = pkg.name ? ` (${pkg.name})` : "";
  const summary = `${payment.lessonLabel} ${formatEuro(payment.lessonAmount)} + inschrijving ${formatEuro(payment.registrationFee)}${name}`;
  const who = studentName?.trim();
  const description = who ? `${who} — ${summary}` : summary;
  return description.slice(0, 255);
}

export function depositAmount(pkg: PackageLike, transmission: Transmission): number {
  return depositBreakdown(pkg, transmission).total;
}
