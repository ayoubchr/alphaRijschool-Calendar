"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const PHONE = "+32 486 29 53 75";
const PHONE_HREF = "tel:+32486295375";
const WHATSAPP_HREF = "https://wa.me/32486295375";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/theorie", label: "Theorie" },
  { href: "/tarieven-pakketten", label: "Tarieven + Pakketten" },
  { href: "/contact", label: "Contact" },
];

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
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <Link href="/" className="relative block h-[62px] w-[168px] shrink-0 overflow-hidden" aria-label="Alpha Rijschool">
            <Image
              src="/alpha-logo.webp"
              alt="Alpha Rijschool"
              width={591}
              height={591}
              priority
              className="absolute left-1/2 top-1/2 h-[128px] w-auto max-w-none -translate-x-1/2 -translate-y-[46%]"
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex xl:gap-10" aria-label="Hoofdmenu">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link text-[15px]"
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href={PHONE_HREF} className="nav-link hidden text-sm lg:inline">
              {PHONE}
            </a>
            <Link
              href="/boeken"
              className="rounded-[10px] bg-[#ed1c24] px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-[#111827]"
            >
              Boek nu
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#58595b] lg:hidden"
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
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
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
              <a href={PHONE_HREF} className="nav-link w-fit text-lg lg:hidden">
                {PHONE}
              </a>
            </div>
          </nav>
        )}
      </header>

      {!pathname.startsWith("/admin") && (
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noreferrer"
          aria-label="Stuur een WhatsApp-bericht"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
        >
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="36" width="36" xmlns="http://www.w3.org/2000/svg">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path>
            </svg>
        </a>
      )}
    </>
  );
}
