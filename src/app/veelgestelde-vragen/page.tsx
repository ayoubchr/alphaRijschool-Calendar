"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { PageIntro } from "@/components/PageIntro";

const faqs: { q: string; a: ReactNode }[] = [
  {
    q: "Kies ik best een M12 of een stageattest na het vervallen van mijn M18 of M36?",
    a: "Dat hangt van je persoonlijke situatie af. Heb je de luxe van een begeleider te hebben waarmee je nog kan oefenen, dan kies je best voor de M12. Heb je die luxe niet, dan is er een oplossing via een stageattest. Daarmee mag je enkel via de erkende rijschool rijden en examen(s) afleggen, ook al heb je geen echt voorlopig rijbewijs meer.",
  },
  {
    q: "Wat is een M12?",
    a: "De M12 kan beschouwd worden als een soort éénmalige verlenging van je voorlopig rijbewijs, met een periode van 12 maanden. De regels zijn hetzelfde als bij de M36: je mag enkel met begeleider oefenen. Of uiteraard met een coach van de rijschool. Maar niet alleen. De M12 kan verkregen worden nadat je 6 uur rijles hebt genomen na het vervallen van de geldigheid van je M36 of M18. Met de M12 mag je dus terug op rijexamen gaan, en je hoeft geen 5 maanden meer te wachten.",
  },
  {
    q: "In welke gevallen ben ik verplicht om 6 uur rijles te nemen?",
    a: "Wanneer je 2 keer opeenvolgend niet geslaagd bent voor je praktijkexamen. Dit wil zeggen dat je 6 uur moet hebben gevolgd alvorens je de 3e, 5e, 7e, 9e, 11e, ... keer naar je praktijkexamen gaat. Ook na het vervallen van je voorlopig rijbewijs M36 of M18 moet je 6 uur rijles volgen om een M12 of stageattest aan te vragen.",
  },
  {
    q: "Tellen de 2 uur rijles vlak voor mijn rijexamen (pakket 2u + examen) mee voor het attest van 6 uur?",
    a: "Ja. Alle rijlessen tellen gedurende 3 jaar mee voor attesten.",
  },
  {
    q: "Geven jullie het terugkommoment?",
    a: "Neen.",
  },
  {
    q: "Geven jullie het vormingsmoment voor begeleiders?",
    a: "Neen.",
  },
  {
    q: "Hoeveel kost een rijles en een examenbegeleiding? Zijn er kortingen voor studenten of andere kortingen?",
    a: (
      <>
        Onze prijzen staan op de pagina{" "}
        <Link href="/tarieven-pakketten" className="font-semibold text-[#ed1c24] underline">
          Tarieven + Pakketten
        </Link>
        . We werken niet met kortingen.
      </>
    ),
  },
  {
    q: "Geven jullie momenteel theorielessen?",
    a: (
      <>
        Om te zien of we momenteel theorielessen geven, kijk je op de pagina{" "}
        <Link href="/theorie" className="font-semibold text-[#ed1c24] underline">
          Theorie
        </Link>
        . Als daar geen theorielessen zichtbaar zijn, dan geven we momenteel geen theorielessen.
      </>
    ),
  },
  {
    q: "Wat is een stageattest?",
    a: "Een stageattest wordt soms ook 'bijlage 4' of 'certificaat van opleiding' genoemd. Het wordt gebruikt door kandidaten wiens voorlopig rijbewijs niet meer geldig is, en die geen begeleider vinden om een nieuw voorlopig rijbewijs aan te vragen (M12).",
  },
  {
    q: "Hoe lang is mijn bekwaamheidsattest van 20u voor het behalen van M18 geldig?",
    a: "Alle rijschoollessen tellen mee voor rijschoolattesten, op voorwaarde dat deze maximum 3 jaar oud zijn.",
  },
  {
    q: "Mijn M18 is vervallen, kan ik een nieuwe M18 krijgen als ik terug 20 uur rijles volg?",
    a: "Ja, op voorwaarde dat er minimaal 3 jaar ligt tussen het einde van je vervallen M18 en het begin van je nieuwe M18.",
  },
  {
    q: "Mag ik direct na mijn 20u rijles al praktijkexamen afleggen?",
    a: "Indien u kan bewijzen dat u een voorlopig rijbewijs heeft én de verplichte minimum oefenperiode van 5 maanden achter de rug heeft, dan kan u deelnemen aan het praktijkexamen, na 20u rijles.",
  },
  {
    q: "Kies ik best altijd dezelfde instructeur voor mijn 20u rijles?",
    a: "Doorgaans is het een goed idee om toch zeker de eerste lessen bij dezelfde coach te volgen. Niet alleen voor u, maar ook voor de coach, die 'zijn' project graag tot het einde afwerkt. We adviseren om 70 - 80% van je lessen bij je 'basiscoach' te nemen.",
  },
  {
    q: "Is het examengeld inbegrepen bij de examenpakketten?",
    a: "Ja.",
  },
  {
    q: "Mag ik al rijles nemen als ik nog niet geslaagd ben voor de theorie?",
    a: "Ja. We raden wel aan om de theorie door te nemen alvorens je naar de rijles komt.",
  },
  {
    q: "Hoeveel lessen moet ik nemen?",
    a: "Dat hangt er van af in welke situatie u zich bevindt. U bent verplicht om 20u rijles te nemen indien u een voorlopig rijbewijs wenst te bekomen waarmee u alleen mag oefenen (M18).",
  },
  {
    q: "Kan ik examen afleggen en les nemen in mijn eigen wagen?",
    a: "Nee, alle lessen en examens die u via onze rijschool neemt, worden afgelegd in de leswagen.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div>
      <PageIntro
        eyebrow="Hulp bij je keuze"
        title="Veelgestelde vragen"
        description="Antwoorden over M12, stageattesten, verplichte uren en hoe je je inschrijft."
        imageSrc="/illustraties/hero-theorie.png"
        imageAlt="Theorieles met verkeersborden"
      />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="divide-y divide-black/10 rounded-[10px] border border-black/10 bg-white px-5">
          {faqs.map((faq, index) => {
            const open = openIndex === index;
            return (
              <div key={faq.q} className="py-4">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 text-left font-bold"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(index)}
                >
                  <span>{faq.q}</span>
                  <span className="text-[#ed1c24]" aria-hidden>
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open && <div className="mt-3 leading-relaxed text-[#58595b]">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
