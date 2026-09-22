import Link from "next/link";

const PHONE = "+32 486 29 53 75";
const PHONE_HREF = "tel:+32486295375";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-extrabold uppercase tracking-wide">
          Alpha <span className="text-red-600">Rijschool</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-semibold md:flex">
          <Link href="/over-ons">Over ons</Link>
          <Link href="/theorie">Theorie</Link>
          <Link href="/tarieven-pakketten">Tarieven + Pakketten</Link>
          <Link href="/veelgestelde-vragen">Veelgestelde vragen</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="flex items-center gap-4">
          <a href={PHONE_HREF} className="hidden text-sm font-semibold md:inline">{PHONE}</a>
          <Link href="/boeken" className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white">
            Boek Nu &rarr;
          </Link>
        </div>
      </div>
    </header>
  );
}
