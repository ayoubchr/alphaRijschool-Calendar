import { prisma } from "@/lib/prisma";
import { sendLessonsChangedEmail } from "@/lib/email";
import { EMAIL } from "@/lib/site";

export async function staffRecipients(instructorIds: string[]) {
  const [admins, instructors] = await Promise.all([
    prisma.profile.findMany({ where: { role: "ADMIN" }, select: { email: true } }),
    prisma.instructor.findMany({ where: { id: { in: instructorIds } }, select: { email: true } }),
  ]);
  const emails = [...admins.map((admin) => admin.email), ...instructors.map((instructor) => instructor.email).filter((email): email is string => Boolean(email))];
  if (emails.length === 0) emails.push(EMAIL);
  return Array.from(new Set(emails));
}

export async function notifyStaffOfLessons(params: {
  title: string;
  intro: string;
  lessons: { startAt: Date; endAt: Date; instructorName: string; instructorId: string; studentName: string }[];
}) {
  const to = await staffRecipients(params.lessons.map((lesson) => lesson.instructorId));
  await sendLessonsChangedEmail({ to, title: params.title, intro: params.intro, lessons: params.lessons });
}
