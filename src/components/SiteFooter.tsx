import Image from "next/image";
import Link from "next/link";
import { SocialIcons } from "@/components/SocialIcons";
import { ADDRESS, EMAIL, MAP_HREF, NAV_LINKS, PHONE, PHONE_HREF } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" aria-label="Alpha Rijschool" className="relative block h-20 w-40 overflow-hidden">
            <Image
              src="/alpha-logo.webp"
              alt=""
              width={591}
              height={591}
              className="absolute left-1/2 top-1/2 h-40 w-auto max-w-none -translate-x-1/2 -translate-y-[46%]"
            />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
            Rijlessen in Antwerpen. Kies voor kwaliteit, kies voor zekerheid.
          </p>
          <div className="mt-4">
            <SocialIcons tone="on-dark" />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Contact</h2>
          <ul className="space-y-2 text-sm text-white/85">
            <li>
              <a href={PHONE_HREF} className="transition hover:text-brand-red">
                {PHONE}
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className="transition hover:text-brand-red">
                {EMAIL}
              </a>
            </li>
            <li>
              <a href={MAP_HREF} target="_blank" rel="noreferrer" className="transition hover:text-brand-red">
                {ADDRESS}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Snelle links</h2>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-white/85 transition hover:text-brand-red">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/boeken" className="text-white/85 transition hover:text-brand-red">
                Boek een les
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Inschrijven</h2>
          <p className="text-sm leading-relaxed text-white/75">
            Kies een pakket, plan een moment en betaal je voorschot online.
          </p>
          <Link href="/boeken" className="btn-primary mt-4">
            Boek nu
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>&copy; {new Date().getFullYear()} Alpha Rijschool. Alle rechten voorbehouden.</p>
          <div className="flex gap-4">
            <Link href="/privacybeleid" className="transition hover:text-white">
              Privacybeleid
            </Link>
            <Link href="/algemene-voorwaarden" className="transition hover:text-white">
              Algemene voorwaarden
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
