import { prisma } from "@/lib/prisma";

export default async function AdminReportPage() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [bookingCount, payments] = await Promise.all([
    prisma.lesson.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.payment.findMany({ where: { status: "PAID", createdAt: { gte: sevenDaysAgo } } }),
  ]);
  const revenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Rapport (laatste 7 dagen)</h1>
      <p>Aantal boekingen: {bookingCount}</p>
      <p>Ontvangen voorschotten: &euro;{(revenue / 100).toFixed(2)}</p>
    </div>
  );
}
