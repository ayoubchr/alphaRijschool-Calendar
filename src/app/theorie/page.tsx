import Link from "next/link";
import { Graduates } from "@/components/Graduates";
import { PageIntro } from "@/components/PageIntro";

const REASONS = [
  "Examencentrum-getrouw toetsingssysteem voor optimale voorbereiding",
  "Persoonlijke aanpak en lessen op maat",
  "Leuke en gemakkelijk te begrijpen leermethode",
  "Handige adviezen en tips van ervaren instructeurs",
  "Hoogste slaagkans voor je theorie-examen",
];

export default function TheoriePage() {
  return (
    <div>
      <PageIntro
        eyebrow="12 uur · 3 dagen"
        title="Theorie"
        description="Uitgebreide voorbereiding op je theorie-examen, in het Nederlands en met veel oefenvragen."
        imageSrc="/illustraties/hero-theorie.png"
        imageAlt="Theorieles met verkeersborden en leerlingen"
        priority
      >
        <Link href="/boeken" className="btn-primary">
          Schrijf je in
        </Link>
      </PageIntro>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-navy">Theorieles</h2>
          <p className="mt-4 text-lg leading-relaxed text-[#58595b]">
            Dit pakket van 12 uur biedt uitgebreide theorielessen om je voor te bereiden op het theorie-examen.
            De lessen zijn in het Nederlands en verdeeld over 3 dagen.
          </p>
          <p className="mt-4 text-[#58595b]">
            De inschrijvingskosten van €25 zijn verplicht bij elk pakket en dekken de administratieve kosten.
          </p>
          <Link href="/boeken" className="btn-primary mt-8">
            Aanmelden
          </Link>
        </div>
        <div className="rounded-[10px] border border-black/10 bg-[#f9f9f9] p-6">
          <dl className="space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
              <dt>Theorielessen (in het Nederlands)</dt>
              <dd className="text-xl font-extrabold">€150</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
              <dt>Inschrijvingskosten</dt>
              <dd className="text-xl font-extrabold">€25</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-bold">Totaal</dt>
              <dd className="text-2xl font-extrabold text-[#ed1c24]">€175</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="bg-[#f9f9f9] px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-extrabold text-brand-navy">Waarom theorie bij Rijschool Alpha?</h2>
          <ul className="mt-6 space-y-3">
            {REASONS.map((reason) => (
              <li key={reason} className="flex gap-3 text-[#58595b]">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ed1c24] text-white" aria-hidden>
                  <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current">
                    <path d="M7.6 13.2L4.4 10l-1.2 1.2 4.4 4.4L17 6.2 15.8 5z" />
                  </svg>
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-3xl font-extrabold text-brand-navy">Theorie-attest</h2>
        <p className="mt-4 leading-relaxed text-[#58595b]">
          Ben je 2 keer niet geslaagd voor het theorie-examen? Dan moet je de verplichte 12 uur theorielessen volgen.
          Bij Rijschool Alpha ben je op het juiste adres om te slagen voor je theorie-examen.
        </p>
        <p className="mt-4 leading-relaxed text-[#58595b]">
          Tijdens onze 12 uur theorieles (verdeeld over 3 dagen) leer je op een leuke, gemakkelijk te begrijpen manier
          alle theoriestof die nodig is om te kunnen slagen.
        </p>
        <Link href="/boeken" className="btn-primary mt-8">
          Schrijf je in voor theorie
        </Link>
      </section>
      <Graduates />
    </div>
  );
}
