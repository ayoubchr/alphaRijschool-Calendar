import { prisma } from "@/lib/prisma";

export async function getDossierOverview() {
  return prisma.dossier.findMany({
    include: { package: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
}
