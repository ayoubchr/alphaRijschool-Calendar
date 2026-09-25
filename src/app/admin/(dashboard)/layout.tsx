import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");
  if (session.user.role === "STUDENT") redirect("/mijn-lessen");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#f4f4f5] md:flex-row">
      <AdminSidebar isAdmin={session.user.role === "ADMIN"} />
      <div className="min-w-0 flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
