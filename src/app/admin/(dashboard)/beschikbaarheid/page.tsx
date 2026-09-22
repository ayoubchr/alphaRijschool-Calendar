import { prisma } from "@/lib/prisma";
import { AvailabilityView } from "./AvailabilityView";

export default async function AdminAvailabilityPage() {
  const instructors = await prisma.instructor.findMany({ include: { availabilityRules: true } });
  return <AvailabilityView instructors={instructors} />;
}
