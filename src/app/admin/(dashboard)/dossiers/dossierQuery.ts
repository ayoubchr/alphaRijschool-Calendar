import { prisma } from "@/lib/prisma";

export async function getDossierOverview() {
  return prisma.dossier.findMany({
    where: { payments: { some: { type: "DEPOSIT", status: "PAID" } } },
    include: { package: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
}
