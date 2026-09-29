import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canCancelWithRefund } from "@/lib/cancellation";
import { lessonInstructorName, THEORY_INSTRUCTOR_ID } from "@/lib/lessonBlocks";
import { AgendaView } from "./AgendaView";

export default async function AdminAgendaPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const instructorId = (session?.user as any)?.instructorId;

  const instructors = role === "ADMIN"
    ? await prisma.instructor.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];

  const theoryDays = role === "ADMIN"
    ? await prisma.theoryDay.findMany({ orderBy: { startAt: "asc" } })
    : [];

  const lessons = await prisma.lesson.findMany({
    where: {
      status: { in: ["PLANNED", "CONFIRMED"] },
      ...(role === "INSTRUCTOR" ? { instructorId } : {}),
    },
    include: { dossier: true, instructor: true },
    orderBy: { startAt: "asc" },
  });

  return (
    <AgendaView
      isAdmin={role === "ADMIN"}
      instructors={instructors}
      theoryDays={theoryDays.map((day) => ({
        id: day.id,
        startAt: day.startAt.toISOString(),
        endAt: day.endAt.toISOString(),
      }))}
      lessons={lessons.map((lesson) => ({
        id: lesson.id,
        startAt: lesson.startAt.toISOString(),
        endAt: lesson.endAt.toISOString(),
        status: lesson.status,
        dossierId: lesson.dossierId,
        dossier: { firstName: lesson.dossier.firstName, lastName: lesson.dossier.lastName },
        instructor: { name: lessonInstructorName(lesson.instructor) },
        instructorId: lesson.instructorId ?? THEORY_INSTRUCTOR_ID,
        packageId: lesson.packageId,
        transmission: lesson.dossier.transmission === "MANUEEL" ? "MANUEEL" : "AUTOMAAT",
        canChange: canCancelWithRefund(lesson.startAt),
      }))}
    />
  );
}
