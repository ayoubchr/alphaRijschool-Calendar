import { prisma } from "@/lib/prisma";

export async function getActivePackages() {
  return prisma.package.findMany({ where: { active: true }, orderBy: { hours: "desc" } });
}

export async function getPackageById(id: string) {
  return prisma.package.findUnique({ where: { id } });
}

export async function getSingleLessonPackage() {
  const pkg = await prisma.package.findFirst({ where: { isSingleLesson: true, active: true } });
  if (!pkg) {
    throw new Error("Geen 'losse rijles'-pakket geconfigureerd — nodig voor de voorschotberekening.");
  }
  return pkg;
}
