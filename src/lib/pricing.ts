import { LESSON_BLOCK_MINUTES } from "@/lib/constants";
import { blockHoursForPackage } from "@/lib/lessonBlocks";

export type Transmission = "AUTOMAAT" | "MANUEEL";

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
}

/**
 * What the student pays now: the first lesson block, plus the registration fee.
 * Driving blocks are 2 hours. Theory is a 6-hour day. A practical exam has no
 * lesson hours, so that part is half the package price.
 */
export function depositBreakdown(pkg: PackageLike, transmission: Transmission): DepositBreakdown {
  const base = transmissionPrice(pkg, transmission);
  const blockHours = pkg.name ? blockHoursForPackage({ name: pkg.name }) : LESSON_BLOCK_MINUTES / 60;
  const theory = pkg.name?.toLowerCase().includes("theorie") ?? false;
  const lessonAmount =
    pkg.hours > 0
      ? Math.round((base / pkg.hours) * Math.min(blockHours, pkg.hours))
      : Math.round(base / 2);
  return {
    lessonLabel: pkg.hours === 0 ? "Praktijkexamen" : theory ? "Eerste theoriedag" : "Eerste les",
    lessonAmount,
    registrationFee: pkg.registrationFee,
    total: lessonAmount + pkg.registrationFee,
  };
}

export function depositAmount(pkg: PackageLike, transmission: Transmission): number {
  return depositBreakdown(pkg, transmission).total;
}
