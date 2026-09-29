import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TheoryDaysView } from "./TheoryDaysView";

export default async function TheoryDaysPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/admin/agenda");

  const days = await prisma.theoryDay.findMany({ orderBy: { startAt: "asc" } });

  return (
    <TheoryDaysView
      days={days.map((day) => ({
        id: day.id,
        startAt: day.startAt.toISOString(),
        endAt: day.endAt.toISOString(),
      }))}
    />
  );
}
