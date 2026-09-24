"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";

const LINKS = [
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/beschikbaarheid", label: "Beschikbaarheid" },
  { href: "/admin/boekingen", label: "Boekingen" },
  { href: "/admin/dossiers", label: "Dossiers" },
];

export function AdminSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, { href: "/admin/rapport", label: "Rapport" }] : LINKS;

  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#111827] text-white md:min-h-screen md:w-60">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-wide text-white/50">Alpha Rijschool</p>
        <p className="text-lg font-extrabold">Beheer</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Beheer">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-[10px] px-3 py-2 text-sm font-semibold transition ${
                active ? "bg-[#ed1c24] text-white" : "text-white/80 hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action={logout} className="p-3">
        <button
          type="submit"
          className="w-full rounded-[10px] border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Uitloggen
        </button>
      </form>
    </aside>
  );
}
