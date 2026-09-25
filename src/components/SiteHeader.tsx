"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import { SocialIcons } from "@/components/SocialIcons";
import { ADDRESS, EMAIL, MAP_HREF, NAV_LINKS, PHONE, PHONE_HREF, WHATSAPP_HREF } from "@/lib/site";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="bg-brand-red text-sm text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <li>
              <a href={PHONE_HREF} className="inline-flex items-center gap-1.5 hover:underline">
                <FiPhone aria-hidden />
                {PHONE}
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-1.5 hover:underline">
                <FiMail aria-hidden />
                {EMAIL}
              </a>
            </li>
            <li className="hidden md:block">
              <a href={MAP_HREF} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                <FiMapPin aria-hidden />
                {ADDRESS}
              </a>
            </li>
          </ul>
          <SocialIcons />
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-black/5 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Link href="/" className="relative block h-14 w-36 shrink-0 overflow-hidden" aria-label="Alpha Rijschool">
            <Image
              src="/alpha-logo.webp"
              alt="Alpha Rijschool"
              width={591}
              height={591}
              priority
              className="absolute left-1/2 top-1/2 h-[118px] w-auto max-w-none -translate-x-1/2 -translate-y-[46%]"
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex xl:gap-10" aria-label="Hoofdmenu">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link text-sm"
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-[#111827] sm:inline">Mijn lessen</Link>
            <Link href="/boeken" className="btn-primary px-5">
              Boek nu
              <span aria-hidden>→</span>
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-gray lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Menu sluiten" : "Menu openen"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-menu" className="border-t border-black/5 bg-white px-6 py-4 lg:hidden" aria-label="Mobiel menu">
            <div className="mx-auto flex max-w-6xl flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link w-fit text-lg"
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/login" className="nav-link w-fit text-lg">Mijn lessen</Link>
              <a href={PHONE_HREF} className="nav-link w-fit text-lg">
                {PHONE}
              </a>
            </div>
          </nav>
        )}
      </header>

      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noreferrer"
        aria-label="Stuur een WhatsApp-bericht"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
      >
        <FaWhatsapp className="h-8 w-8" aria-hidden />
      </a>
    </>
  );
}
