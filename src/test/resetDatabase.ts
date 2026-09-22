import { PrismaClient } from "@prisma/client";

const TABLES = [
  "Payment", "Lesson", "MagicLink", "Dossier",
  "AvailabilityException", "AvailabilityRule",
  "StaffUser", "Instructor", "Package",
];

export async function resetDatabase(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`
  );
}
