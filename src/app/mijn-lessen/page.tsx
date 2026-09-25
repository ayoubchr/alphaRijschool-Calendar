import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canCancelWithRefund } from "@/lib/cancellation";
import { prisma } from "@/lib/prisma";
import { MijnLessenView, type StudentDossier } from "./MijnLessenView";

export default async function MijnLessenPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/admin/agenda");

  const dossiers = await prisma.dossier.findMany({
    where: { email: session.user.email },
    include: { package: true, lessons: { include: { instructor: true }, orderBy: { startAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const data: StudentDossier[] = dossiers.map((dossier) => ({
    id: dossier.id,
    firstName: dossier.firstName,
    packageName: dossier.package.name,
    packageId: dossier.packageId,
    transmission: dossier.transmission === "MANUEEL" ? "MANUEEL" : "AUTOMAAT",
    hoursRemaining: dossier.hoursRemaining,
    lessons: dossier.lessons.map((lesson) => ({
      id: lesson.id,
      startAt: lesson.startAt.toISOString(),
      endAt: lesson.endAt.toISOString(),
      status: lesson.status,
      instructorName: lesson.instructor.name,
      canChange: lesson.status !== "CANCELLED" && lesson.status !== "COMPLETED" && canCancelWithRefund(lesson.startAt),
    })),
  }));

  return <MijnLessenView dossiers={data} />;
}
