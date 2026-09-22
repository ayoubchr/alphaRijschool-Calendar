import { prisma } from "@/lib/prisma";
import { BookingsView } from "./BookingsView";

export default async function AdminBookingsPage() {
  const lessons = await prisma.lesson.findMany({
    where: { status: { in: ["PLANNED", "CONFIRMED"] } },
    include: { dossier: true, instructor: true },
    orderBy: { startAt: "asc" },
  });
  return <BookingsView lessons={lessons} />;
}
