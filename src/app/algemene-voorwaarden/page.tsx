import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algemene voorwaarden | Alpha Rijschool",
  description: "Algemene voorwaarden van Alpha Rijschool voor lessen, pakketten, examens en betalingen.",
};

const ARTICLES: { title: string; intro?: string; items: string[] }[] = [
  {
    title: "Artikel 1: Algemeen",
    intro: "Deze algemene voorwaarden gelden voor Alpha Rijschool. Fouten of onjuistheden in de tekst kunnen niet worden beschouwd als bindend.",
    items: [
      "1.1 Deze voorwaarden zijn van toepassing op alle aanbiedingen, overeenkomsten, diensten, adviezen, opdrachten, leveringen en andere werkzaamheden van Alpha Rijschool, tenzij schriftelijk anders is overeengekomen.",
      "1.2 Als Alpha Rijschool van een bepaling in deze voorwaarden afwijkt, blijven alle overige bepalingen onverminderd van kracht.",
      "1.3 Alle aanbiedingen zijn vrijblijvend. Alpha Rijschool is pas gebonden wanneer schriftelijke bevestiging heeft plaatsgevonden.",
      "1.4 Elke inschrijving of opdracht die door Alpha Rijschool is bevestigd, wordt bindend, tenzij deze binnen 5 dagen na ontvangst schriftelijk wordt afgewezen.",
      "1.5 Algemene voorwaarden van de klant worden uitdrukkelijk niet geaccepteerd.",
    ],
  },
  {
    title: "Artikel 2: Verplichtingen van Alpha Rijschool",
    intro: "Alpha Rijschool staat garant voor:",
    items: [
      "2.1 Het geven van rijlessen door een bevoegde instructeur, die voldoet aan de eisen van de Wet Rijonderricht Motorrijtuigen (WRM) en in het bezit is van een geldig instructeurscertificaat.",
      "2.2 Een lesduur van 50 minuten die volledig wordt besteed aan rijonderricht.",
      "2.3 De cursist rijdt zoveel mogelijk in dezelfde lesauto en legt het examen doorgaans in deze auto af, tenzij overmacht anders vereist.",
      "2.4 Het tijdig indienen van een examenaanvraag, mits de cursist de kosten hiervoor heeft voldaan.",
      "2.5 Controle van de door de cursist verstrekte informatie op correctheid bij het invullen van de gezondheidsverklaring.",
      "2.6 De aanwezigheid van de benodigde verzekeringen.",
      "2.7 Het informeren van de cursist over de meldplicht bij een rijontzegging.",
      "2.8 Het tijdig informeren van de cursist bij annulering van lessen door ziekte, ongevallen of onvoorziene omstandigheden, waarbij een nieuwe afspraak wordt gemaakt of een vervangende instructeur wordt ingezet. Restitutie of schadevergoeding is in dergelijke gevallen niet van toepassing.",
    ],
  },
  {
    title: "Artikel 3: Verplichtingen van de cursist",
    intro: "De cursist dient:",
    items: [
      "3.1 Alle aanwijzingen van de instructeur op te volgen en altijd een geldig legitimatiebewijs bij zich te hebben tijdens de lessen.",
      "3.2 Tijdig op de afgesproken plaats aanwezig te zijn. Bij afwezigheid zonder tijdige afmelding is de volledige lesprijs verschuldigd.",
      "3.3 Bij te laat verschijnen tot maximaal 15 minuten, wordt de lestijd verkort met deze periode, maar dient de volledige lestijd te worden betaald.",
      "3.4 Een les ten minste 48 uur van tevoren af te zeggen. Bij een latere annulering wordt de volledige lesprijs in rekening gebracht.",
      "3.5 Alpha Rijschool te machtigen voor de aanvraag van examens of toetsen.",
      "3.6 Voorafgaand aan de rijopleiding volledige en correcte informatie te verstrekken over medische, psychische en andere relevante omstandigheden.",
      "3.7 Zorg te dragen voor de benodigde documenten bij theorie- en praktijkexamens.",
      "3.8 Een eventuele rijontzegging onmiddellijk te melden.",
    ],
  },
  {
    title: "Artikel 4: Betalingen",
    items: [
      "4.1 Betaling kan geschieden via pin, contant of een overeengekomen betalingsregeling.",
      "4.2 De kosten voor lessen, boeken en materialen dienen vooraf of bij aflevering te worden voldaan, tenzij schriftelijk anders is afgesproken.",
      "4.3 Bij lespakketten dient de helft van de kosten uiterlijk twee weken voor aanvang van de eerste les te worden betaald, en het resterende bedrag na de helft van het pakket.",
      "4.4 Alpha Rijschool kan prijzen aanpassen, maar voor reeds gekochte pakketten blijft de overeengekomen prijs gelden.",
      "4.5 Bij niet-tijdige betaling ontvangt de cursist een factuur. Bij overschrijding van de betalingstermijn wordt een rente van 1% per maand in rekening gebracht.",
      "4.6 Incassokosten worden doorberekend bij achterstallige betalingen, met een minimum van 15% van het openstaande bedrag.",
      "4.7 Alpha Rijschool heeft het recht om bij betalingsachterstanden diensten op te schorten of te beëindigen.",
      "4.8 Indien een lespakket niet volledig wordt gebruikt, vindt er geen restitutie plaats, aangezien er een korting op de pakketprijs is gegeven.",
    ],
  },
  {
    title: "Artikel 5: Examenaanvragen",
    items: [
      "5.1 Kosten voor examens dienen contant te worden voldaan bij het invullen van de benodigde documenten.",
      "5.2 Indien het examen door vakantie van de cursist niet doorgaat, zijn de kosten voor rekening van de cursist, tenzij dit tijdig is doorgegeven.",
      "5.3 Tussentijdse prijswijzigingen van examens worden door Alpha Rijschool doorberekend.",
    ],
  },
  {
    title: "Artikel 6: Praktijkexamen",
    items: [
      "6.1 Bij afwezigheid of te laat verschijnen door de cursist zijn de kosten voor een nieuwe examenaanvraag voor eigen rekening.",
      "6.2 Indien de cursist niet tijdig verhinderdata doorgeeft, draagt hij/zij de kosten van een gemiste examenafspraak.",
      "6.3 Bij annulering van een examen door weersomstandigheden kan Alpha Rijschool een lesuur in rekening brengen voor een nieuwe aanvraag.",
      "6.4 Bij onvoldoende rijvaardigheid kan Alpha Rijschool besluiten een examenaanvraag te weigeren of uit te stellen.",
    ],
  },
  {
    title: "Artikel 7: Aanvullende afspraken",
    items: [
      "7.1 Eventuele aanvullende afspraken worden schriftelijk vastgelegd.",
      "7.2 Deze algemene voorwaarden blijven altijd van kracht.",
    ],
  },
  {
    title: "Artikel 8: Lespakketten",
    items: [
      "8.1 Het aantal lessen in een pakket garandeert geen opleidingsduur. Extra lessen zijn nodig als de cursist nog niet klaar is voor het examen.",
    ],
  },
  {
    title: "Artikel 9: Beëindiging van de overeenkomst",
    items: [
      "9.1 Bij open overeenkomsten heeft de cursist geen recht op tussentijdse beëindiging of restitutie.",
      "9.2 Voor vaste overeenkomsten is beëindiging alleen mogelijk bij dringende redenen, waarbij 50% restitutie wordt verleend, exclusief administratie- en examenkosten.",
      "9.3 Alpha Rijschool kan een overeenkomst opzeggen bij zwaarwegende omstandigheden en betaalt in dat geval vooruitbetaalde bedragen terug.",
      "9.4 Overeenkomsten worden bij overlijden van de cursist automatisch ontbonden.",
    ],
  },
  {
    title: "Artikel 10: Vrijwaring",
    intro: "Alpha Rijschool vrijwaart de cursist voor schade veroorzaakt door botsingen of ongelukken tijdens de lessen, behalve in de volgende gevallen:",
    items: [
      "Wanneer de cursist zich zodanig gedraagt dat een ongeval niet te voorkomen is.",
      "Als de cursist onder invloed is van middelen die de rijvaardigheid beïnvloeden.",
      "Bij verzwegen ontzegging van rijbevoegdheid.",
      "Bij het achterhouden van relevante medische informatie.",
    ],
  },
  {
    title: "Artikel 11: Aansprakelijkheid",
    items: [
      "De aansprakelijkheid van Alpha Rijschool is beperkt tot het bedrag waarvoor zij verzekerd is. Indirecte kosten of schade worden niet vergoed.",
    ],
  },
  {
    title: "Artikel 12: Klachten",
    items: [
      "12.1 Klachten dienen ter plekke kenbaar te worden gemaakt. Als het probleem niet wordt opgelost, kan de klacht binnen 7 dagen schriftelijk worden ingediend bij de directie van Alpha Rijschool.",
      "12.2 Indien bemiddeling niet slaagt, kan het geschil aan de rechter worden voorgelegd.",
    ],
  },
  {
    title: "Artikel 13: Toepasselijk recht",
    items: [
      "13.1 Op deze voorwaarden is Belgisch recht van toepassing.",
      "13.2 Geschillen worden uitsluitend voorgelegd aan de bevoegde rechter in de vestigingsplaats van Alpha Rijschool.",
    ],
  },
];

export default function AlgemeneVoorwaardenPage() {
  return (
    <div>
      <section className="border-b border-black/5 bg-white px-6 py-14 text-center">
        <h1 className="text-4xl font-extrabold text-brand-navy md:text-5xl">Algemene voorwaarden</h1>
      </section>
      <article className="mx-auto max-w-3xl space-y-8 px-6 py-16 leading-relaxed text-[#58595b]">
        {ARTICLES.map((article) => (
          <section key={article.title}>
            <h2 className="text-xl font-extrabold text-[#111827]">{article.title}</h2>
            {article.intro && <p className="mt-3">{article.intro}</p>}
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {article.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </div>
  );
}
