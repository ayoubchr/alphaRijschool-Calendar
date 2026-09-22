export const CANCELLATION_WINDOW_HOURS = 48;

export function canCancelWithRefund(lessonStartAt: Date, now: Date = new Date()): boolean {
  const hoursUntilLesson = (lessonStartAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilLesson >= CANCELLATION_WINDOW_HOURS;
}
