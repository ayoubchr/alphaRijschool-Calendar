import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");
  const role = (session.user as any).role;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <nav className="mb-8 flex gap-6 border-b pb-4 text-sm font-semibold text-neutral-900">
        <a href="/admin/agenda">Agenda</a>
        <a href="/admin/beschikbaarheid">Beschikbaarheid</a>
        <a href="/admin/boekingen">Boekingen</a>
        <a href="/admin/dossiers">Dossiers</a>
        {role === "ADMIN" && <a href="/admin/rapport">Rapport</a>}
      </nav>
      {children}
    </div>
  );
}
