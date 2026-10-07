import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

/** A theory course is always two days of six hours. Driving lessons stay two-hour blocks. */
export const THEORY_DAY_MINUTES = 360;
export const THEORY_DAY_COUNT = 2;
/** Slot id used in the calendar when a theory day has no instructor. Never stored on Lesson. */
export const THEORY_INSTRUCTOR_ID = "theorie";
export const THEORY_LABEL = "Theorie";

export function isTheoryPackage(pkg: { name: string }) {
  return pkg.name.toLowerCase().includes("theorie");
}

/** Praktijkexamen, including the package that adds a 2-hour preparation lesson. */
export function isExamPackage(pkg: { name: string }) {
  return pkg.name.toLowerCase().includes("praktijkexamen");
}

export function blockMinutesForPackage(pkg: { name: string }) {
  return isTheoryPackage(pkg) ? THEORY_DAY_MINUTES : LESSON_BLOCK_MINUTES;
}

export function blockHoursForPackage(pkg: { name: string }) {
  return blockMinutesForPackage(pkg) / 60;
}

export function hoursBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (60 * 60 * 1000);
}

export function lessonInstructorName(instructor: { name: string } | null | undefined) {
  return instructor?.name ?? THEORY_LABEL;
}

export function persistedInstructorId(pkg: { name: string }, instructorId: string) {
  return isTheoryPackage(pkg) ? null : instructorId;
}
