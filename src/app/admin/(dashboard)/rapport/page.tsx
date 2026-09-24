import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatEuro } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function AdminReportPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") {
    redirect("/admin/agenda");
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [bookingCount, payments] = await Promise.all([
    prisma.lesson.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.payment.findMany({ where: { status: "PAID", createdAt: { gte: sevenDaysAgo } } }),
  ]);
  const revenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Rapport</h1>
      <p className="mb-6 text-sm text-[#58595b]">Cijfers van de laatste 7 dagen.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-[10px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#58595b]">Boekingen</p>
          <p className="mt-2 text-3xl font-extrabold text-[#111827]">{bookingCount}</p>
        </section>
        <section className="rounded-[10px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#58595b]">Ontvangen voorschotten</p>
          <p className="mt-2 text-3xl font-extrabold text-[#ed1c24]">{formatEuro(revenue)}</p>
        </section>
      </div>
    </div>
  );
}
