import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AgendaView } from "./AgendaView";

export default async function AdminAgendaPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const instructorId = (session?.user as any)?.instructorId;

  const lessons = await prisma.lesson.findMany({
    where: {
      status: "CONFIRMED",
      ...(role === "INSTRUCTOR" ? { instructorId } : {}),
    },
    include: { dossier: true, instructor: true },
    orderBy: { startAt: "asc" },
  });

  return <AgendaView lessons={lessons} />;
}
