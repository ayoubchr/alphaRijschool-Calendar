import Image from "next/image";
import Link from "next/link";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/theorie", label: "Theorie" },
  { href: "/tarieven-pakketten", label: "Tarieven + Pakketten" },
  { href: "/veelgestelde-vragen", label: "Veelgestelde vragen" },
  { href: "/contact", label: "Contact" },
];

const SOCIALS = [
  { href: "https://www.facebook.com/alpharijschool.be", label: "Facebook" },
  { href: "https://www.tiktok.com/@alpha.rijschool1", label: "TikTok" },
  { href: "https://www.instagram.com/rijschoolalpha/", label: "Instagram" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#111827] py-12 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/" aria-label="Alpha Rijschool" className="relative block h-28 w-56 overflow-hidden">
          <Image
            src="/alpha-logo.webp"
            alt=""
            width={591}
            height={591}
            className="absolute left-1/2 top-1/2 h-52 w-auto max-w-none -translate-x-1/2 -translate-y-[46%]"
          />
        </Link>

        <div>
          <h2 className="mb-4 text-xl font-bold text-white">Contact</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="tel:+32486295375" className="transition hover:text-[#ed1c24]">
                <span className="font-bold">Telefoon:</span> +32 486 29 53 75
              </a>
            </li>
            <li>
              <a href="mailto:rijschoolalpha@gmail.com" className="transition hover:text-[#ed1c24]">
                <span className="font-bold">E-mail:</span> rijschoolalpha@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://maps.google.com/?q=Turnhoutsebaan+76B,+2100+Antwerpen"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[#ed1c24]"
              >
                <span className="font-bold">Adres:</span> Turnhoutsebaan 76B, 2100 Antwerpen, België
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-white">Snelle links</h2>
          <ul className="space-y-2 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-[#ed1c24]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-white">Volg ons</h2>
          <ul className="space-y-2 text-sm">
            {SOCIALS.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer" className="transition hover:text-[#ed1c24]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-white/10 px-6 pt-6 text-xs text-white/80 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Alpha Rijschool. Alle rechten voorbehouden.</p>
        <div className="flex gap-4">
          <Link href="/privacybeleid" className="transition hover:text-[#ed1c24]">
            Privacybeleid
          </Link>
          <Link href="/algemene-voorwaarden" className="transition hover:text-[#ed1c24]">
            Algemene voorwaarden
          </Link>
        </div>
      </div>
    </footer>
  );
}
