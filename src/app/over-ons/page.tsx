import Link from "next/link";

const PILLARS = [
  {
    title: "Gecertificeerde Expertise",
    text: "Onze instructeurs zijn volledig gecertificeerd en hebben jarenlange ervaring in het verkeer en het lesgeven.",
  },
  {
    title: "Flexibele Planning",
    text: "Lessen worden ingepland op momenten die jou het beste uitkomen, ook in de avonduren en weekenden.",
  },
  {
    title: "Persoonlijke Aanpak",
    text: "Iedere leerling is anders. Wij passen onze lesmethode aan op jouw tempo en leerstijl.",
  },
  {
    title: "Hoog Slagingspercentage",
    text: "Dankzij onze gedegen voorbereiding hebben onze leerlingen een bovengemiddeld slagingspercentage.",
  },
];

const REASONS = [
  {
    title: "Moderne Lesvoertuigen",
    text: "Je leert rijden in goed onderhouden, moderne auto's voorzien van alle veiligheidsvoorzieningen.",
  },
  {
    title: "Doelgerichte Aanpak",
    text: "We werken systematisch aan je rijvaardigheid met een duidelijk stappenplan.",
  },
  {
    title: "Uitgebreid Lesmateriaal",
    text: "We bieden moderne leermiddelen en duidelijke theoriematerialen voor optimale voorbereiding.",
  },
  {
    title: "Klanttevredenheid",
    text: "Onze leerlingen waarderen onze persoonlijke benadering en professionele begeleiding.",
  },
];

export default function OverOnsPage() {
  return (
    <div>
      <section className="bg-[#111827] px-6 py-20 text-center text-white md:py-28">
        <h1 className="text-4xl font-bold uppercase text-white md:text-5xl">Over ons</h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg font-light md:text-xl">
          Wij bieden méér dan alleen rijlessen. Met aandacht en passie begeleiden we je om uit te groeien tot een
          zelfverzekerde en verantwoordelijke bestuurder.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-lg leading-relaxed text-[#58595b]">
          Met flexibele lesuren, ervaren instructeurs en een aanpak die aansluit op jouw leerstijl, helpen we je stap
          voor stap naar succes. Onze ervaren instructeurs zorgen ervoor dat je je op je gemak voelt en met plezier
          leert autorijden.
        </p>
        <blockquote className="mt-8 border-l-4 border-[#ed1c24] px-6 text-left text-lg font-medium text-neutral-900">
          &ldquo;Wij zijn pas tevreden als u de bestemming bereikt&rdquo; – en dat betekent niet alleen je rijexamen
          halen, maar ook het bereiken van een veilige en zelfverzekerde rijstijl.
        </blockquote>
      </section>

      <section className="bg-[#f9f9f9] px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2">
          {PILLARS.map((item) => (
            <article key={item.title} className="home-card bg-white">
              <h2 className="text-xl font-extrabold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#58595b]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-extrabold">Waarom kiezen voor Alpha Rijschool?</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {REASONS.map((item) => (
              <article key={item.title} className="rounded-[10px] border border-black/10 p-6">
                <h3 className="text-xl font-extrabold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#58595b]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#111827] px-6 py-16 text-center text-white">
        <h2 className="text-3xl font-bold text-white md:text-4xl">Klaar om te beginnen?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-light">
          Neem vandaag nog contact met ons op en start je reis naar het behalen van je rijbewijs.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex h-11 w-44 items-center justify-center rounded-[10px] bg-[#ed1c24] font-medium text-white transition hover:bg-white hover:text-[#111827]"
          >
            Contact opnemen
          </Link>
          <Link
            href="/tarieven-pakketten"
            className="inline-flex h-11 w-44 items-center justify-center rounded-[10px] bg-white font-medium text-[#ed1c24] transition hover:bg-[#111827] hover:text-white"
          >
            Meer informatie
          </Link>
        </div>
      </section>
    </div>
  );
}
