import { prisma } from "@/lib/prisma";
import { formatLessonMoment, sendLessonsChangedEmail } from "@/lib/email";
import { EMAIL } from "@/lib/site";

export async function staffRecipients(instructorIds: (string | null)[]) {
  const ids = instructorIds.filter((id): id is string => Boolean(id));
  const [admins, instructors] = await Promise.all([
    prisma.profile.findMany({ where: { role: "ADMIN" }, select: { email: true } }),
    prisma.instructor.findMany({ where: { id: { in: ids } }, select: { email: true } }),
  ]);
  const emails = [...admins.map((admin) => admin.email), ...instructors.map((instructor) => instructor.email).filter((email): email is string => Boolean(email))];
  if (emails.length === 0) emails.push(EMAIL);
  return Array.from(new Set(emails));
}

export async function notifyStaffOfLessons(params: {
  title: string;
  intro: string;
  dossierId?: string;
  lessons: { startAt: Date; endAt: Date; instructorName: string; instructorId: string | null; studentName: string }[];
}) {
  const lines = params.lessons.map((lesson) => `${lesson.studentName}: ${formatLessonMoment(lesson.startAt, lesson.endAt)} met ${lesson.instructorName}`);
  await prisma.staffNotification.create({
    data: {
      title: params.title,
      body: [params.intro, ...lines].join("\n").slice(0, 500),
      href: params.dossierId ? `/admin/dossiers?dossier=${params.dossierId}` : "/admin/agenda",
    },
  });
  const to = await staffRecipients(params.lessons.map((lesson) => lesson.instructorId));
  try {
    await sendLessonsChangedEmail({ to, title: params.title, intro: params.intro, lessons: params.lessons });
  } catch (error) {
    console.error("Mail naar beheer mislukt:", error);
  }
}
