"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  IoBarChartOutline,
  IoCalendarOutline,
  IoClipboardOutline,
  IoFolderOpenOutline,
  IoLogOutOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { logout } from "./actions";

const LINKS: { href: string; label: string; icon: IconType }[] = [
  { href: "/admin/agenda", label: "Agenda", icon: IoCalendarOutline },
  { href: "/admin/beschikbaarheid", label: "Beschikbaarheid", icon: IoTimeOutline },
  { href: "/admin/boekingen", label: "Boekingen", icon: IoClipboardOutline },
  { href: "/admin/dossiers", label: "Dossiers", icon: IoFolderOpenOutline },
];

const RAPPORT_LINK = { href: "/admin/rapport", label: "Rapport", icon: IoBarChartOutline };

export function AdminSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, RAPPORT_LINK] : LINKS;

  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#111827] text-white md:min-h-screen md:w-64">
      <div className="px-6 pb-2 pt-7">
        <Link
          href="/"
          className="relative mx-auto block h-[72px] w-[188px] overflow-hidden"
          aria-label="Alpha Rijschool"
        >
          <Image
            src="/alpha-logo.webp"
            alt=""
            width={591}
            height={591}
            priority
            className="absolute left-1/2 top-1/2 h-[148px] w-auto max-w-none -translate-x-1/2 -translate-y-[46%]"
          />
        </Link>
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Beheer</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-5" aria-label="Beheer">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-[#ed1c24] font-semibold text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <form action={logout} className="p-4">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ed1c24]/60 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c4161d]/50"
        >
          <IoLogOutOutline className="h-[18px] w-[18px]" aria-hidden />
          Uitloggen
        </button>
      </form>
    </aside>
  );
}
