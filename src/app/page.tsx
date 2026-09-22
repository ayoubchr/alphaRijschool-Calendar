import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="bg-gray-100 px-6 py-24 text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-red-600">Alpha Rijschool</p>
        <h1 className="mb-4 text-4xl font-extrabold">Welkom bij Alpha Rijschool</h1>
        <p className="mx-auto mb-8 max-w-xl text-gray-600">
          Kies voor kwaliteit, kies voor zekerheid. Begin vandaag nog aan je rijavontuur.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/boeken" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Boek een les</Link>
          <Link href="/over-ons" className="rounded-full border-2 border-red-600 px-6 py-3 font-semibold text-red-600">
            Meer informatie
          </Link>
        </div>
      </section>
    </div>
  );
}
