import { prisma } from "@/lib/prisma";

export async function getActivePackages() {
  return prisma.package.findMany({ where: { active: true }, orderBy: { hours: "desc" } });
}

export async function getPackageById(id: string) {
  return prisma.package.findUnique({ where: { id } });
}

