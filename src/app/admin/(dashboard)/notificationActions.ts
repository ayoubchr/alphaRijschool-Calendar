"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationsRead(ids: string[]) {
  const session = await auth();
  if (session?.user.role !== "ADMIN" || ids.length === 0) return;
  await prisma.staffNotification.updateMany({
    where: { id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  });
}
