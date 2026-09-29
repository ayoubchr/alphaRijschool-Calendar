import { isTheoryPackage } from "@/lib/lessonBlocks";
import { prisma } from "@/lib/prisma";

export async function getActivePackages() {
  const packages = await prisma.package.findMany({ where: { active: true }, orderBy: { hours: "desc" } });
  return packages.sort((a, b) => Number(isTheoryPackage(b)) - Number(isTheoryPackage(a)));
}

export async function getPackageById(id: string) {
  return prisma.package.findUnique({ where: { id } });
}

