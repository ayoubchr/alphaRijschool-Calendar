import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canCancelWithRefund } from "@/lib/cancellation";
import { AgendaView } from "./AgendaView";

export default async function AdminAgendaPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const instructorId = (session?.user as any)?.instructorId;

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
      lessons={lessons.map((lesson) => ({
        id: lesson.id,
        startAt: lesson.startAt.toISOString(),
        endAt: lesson.endAt.toISOString(),
        status: lesson.status,
        dossier: { firstName: lesson.dossier.firstName, lastName: lesson.dossier.lastName },
        instructor: { name: lesson.instructor.name },
        instructorId: lesson.instructorId,
        packageId: lesson.packageId,
        transmission: lesson.dossier.transmission === "MANUEEL" ? "MANUEEL" : "AUTOMAAT",
        canChange: canCancelWithRefund(lesson.startAt),
      }))}
    />
  );
}
