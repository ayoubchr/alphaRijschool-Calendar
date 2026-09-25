import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canCancelWithRefund } from "@/lib/cancellation";
import { prisma } from "@/lib/prisma";
import { DossiersView } from "./DossiersView";

const TRANSMISSION = { AUTOMAAT: "Automaat", MANUEEL: "Manueel", BOTH: "Beide" };

export default async function DossiersPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/admin/agenda");

  const dossiers = await prisma.dossier.findMany({
    include: {
      package: true,
      lessons: { include: { instructor: true }, orderBy: { startAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  const now = Date.now();

  return (
    <DossiersView
      dossiers={dossiers.map((dossier) => {
        const lessons = dossier.lessons
          .filter((lesson) => lesson.status !== "CANCELLED")
          .map((lesson) => ({
            id: lesson.id,
            startAt: lesson.startAt.toISOString(),
            endAt: lesson.endAt.toISOString(),
            status: lesson.status,
            instructorId: lesson.instructorId,
            instructorName: lesson.instructor.name,
            canChange: lesson.status !== "COMPLETED" && canCancelWithRefund(lesson.startAt),
          }));
        const hasUpcoming = lessons.some((lesson) => lesson.status !== "COMPLETED" && new Date(lesson.startAt).getTime() >= now);
        return {
          id: dossier.id,
          firstName: dossier.firstName,
          lastName: dossier.lastName,
          email: dossier.email,
          phone: dossier.phone,
          address: dossier.address,
          hoursRemaining: dossier.hoursRemaining,
          packageId: dossier.packageId,
          packageName: dossier.package.name,
          transmission: TRANSMISSION[dossier.transmission],
          transmissionCode: dossier.transmission === "MANUEEL" ? "MANUEEL" as const : "AUTOMAAT" as const,
          lessonCount: lessons.length,
          finished: dossier.hoursRemaining < 2 && !hasUpcoming,
          lessons,
        };
      })}
    />
  );
}
