import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityView, type AvailabilityInstructor } from "./AvailabilityView";

export default async function AdminAvailabilityPage() {
  const session = await auth();
  const user = session?.user as { role?: string; instructorId?: string } | undefined;
  const isAdmin = user?.role === "ADMIN";

  const instructors = await prisma.instructor.findMany({
    where: isAdmin ? {} : { id: user?.instructorId ?? "__none__" },
    include: {
      availabilityRules: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
      availabilityExceptions: { orderBy: { date: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const serialized: AvailabilityInstructor[] = instructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.name,
    transmission: instructor.transmission,
    active: instructor.active,
    availabilityRules: instructor.availabilityRules.map((rule) => ({
      id: rule.id,
      weekday: rule.weekday,
      startTime: rule.startTime.slice(0, 5),
      endTime: rule.endTime.slice(0, 5),
      kind: rule.kind,
    })),
    availabilityExceptions: instructor.availabilityExceptions.map((exception) => ({
      id: exception.id,
      date: exception.date.toISOString().slice(0, 10),
      startTime: exception.startTime.slice(0, 5),
      endTime: exception.endTime.slice(0, 5),
      isAvailable: exception.isAvailable,
      kind: exception.kind,
    })),
  }));

  return <AvailabilityView isAdmin={isAdmin} instructors={serialized} />;
}
