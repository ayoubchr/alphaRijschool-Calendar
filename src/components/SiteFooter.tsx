import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-red-600 py-10 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-lg font-extrabold uppercase">Alpha Rijschool</p>
        <p className="mt-2 text-sm opacity-90">Turnhoutsebaan 76B, 2100 Antwerpen, Belgi&euml;</p>
        <p className="text-sm opacity-90">rijschoolalpha@gmail.com &middot; +32 486 29 53 75</p>
        <nav className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/tarieven-pakketten">Tarieven + Pakketten</Link>
          <Link href="/theorie">Theorie</Link>
          <Link href="/veelgestelde-vragen">Veelgestelde vragen</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <p className="mt-8 text-xs opacity-75">&copy; {new Date().getFullYear()} Alpha Rijschool. Alle rechten voorbehouden.</p>
      </div>
    </footer>
  );
}
