import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminBell } from "./AdminBell";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");
  if (session.user.role === "STUDENT") redirect("/mijn-lessen");
  const isAdmin = session.user.role === "ADMIN";
  const notices = isAdmin
    ? await prisma.staffNotification.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
    : [];

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#f4f4f5] md:flex-row">
      <AdminSidebar isAdmin={isAdmin} />
      <div className="min-w-0 flex-1">
        {isAdmin && (
          <div className="flex justify-end px-6 pt-6">
            <AdminBell
              notices={notices.map((notice) => ({
                id: notice.id,
                title: notice.title,
                body: notice.body,
                href: notice.href,
                createdAt: notice.createdAt.toISOString(),
                readAt: notice.readAt?.toISOString() ?? null,
              }))}
            />
          </div>
        )}
        <div className={isAdmin ? "px-6 pb-8 pt-2" : "px-6 py-8"}>{children}</div>
      </div>
    </div>
  );
}
