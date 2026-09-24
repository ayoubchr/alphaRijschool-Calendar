import Link from "next/link";
import { Graduates } from "@/components/Graduates";
import { PageIntro } from "@/components/PageIntro";
import { formatEuro } from "@/lib/money";
import { getActivePackages } from "@/lib/packages";

export const dynamic = "force-dynamic";

const PACKAGE_COPY: Record<string, { tagline: string; text: string }> = {
  "20-Uur Pakket": {
    tagline: "Perfect voor beginnende bestuurders",
    text: "In 20 uren leer je alle basisvaardigheden van het autorijden, inclusief verkeersregels, voertuigcontrole en veilige rijtechnieken. Na voltooiing kom je in aanmerking voor een voorlopig rijbewijs (M18).",
  },
  "10-Uur Pakket": {
    tagline: "Gericht op het verbeteren van je zwakke punten",
    text: "Gericht op degene die meer hun tijd willen nemen en alles willen overlopen met betrekking tot het examen afleggen.",
  },
  "6 uur - 2x mislukt examen": {
    tagline: "Gericht op het verbeteren van je zwakke punten",
    text: "6 uren praktijkles voor wie 2 keer gezakt is. Gericht op het verbeteren van je zwakke punten voor een beter resultaat.",
  },
  "M12 Voorlopig Rijbewijs Pakket": {
    tagline: "Behaal je M12 voorlopig rijbewijs",
    text: "Met 6 uren rijles kun je het M12 voorlopig rijbewijs behalen. Dit rijbewijs geeft je de mogelijkheid om verder te oefenen, zodat je je verder kunt voorbereiden op het uiteindelijke rijexamen.",
  },
  "Losse Rijles (2 uur)": {
    tagline: "Extra oefening voor specifieke vaardigheden",
    text: "Wil je extra oefenen? Boek een losse rijles om specifieke vaardigheden te verbeteren of om meer ervaring op te doen op de weg.",
  },
  "Losse Rijles (2u) + Praktijkexamen": {
    tagline: "Overloop je kennis en leg het examen af",
    text: "Wil je voor het examen op je eigen tempo nog wat extra oefenen? Boek een losse rijles van 2 uur om je kennis op te frissen en leg daarna meteen je praktijkexamen af.",
  },
  Praktijkexamen: {
    tagline: "Leg je praktijkexamen af",
    text: "Wil je je praktijkexamen afleggen? Boek hier je praktijkexamen en zet de laatste stap naar het behalen van je rijbewijs.",
  },
  "Theorieles Pakket (12 uur)": {
    tagline: "Uitgebreide voorbereiding op je theorie-examen",
    text: "Dit pakket van 12 uur biedt uitgebreide theorielessen om je voor te bereiden op het theorie-examen, verdeeld over 3 dagen.",
  },
};

export default async function TarievenPakkettenPage() {
  const packages = await getActivePackages();

  return (
    <div>
      <PageIntro
        eyebrow="Praktijk en theorie"
        title="Tarieven + Pakketten"
        description="Kies het pakket dat bij je traject past. De prijzen voor automaat en manueel staan per pakket, en je schrijft je meteen online in."
        imageSrc="/illustraties/hero-rijles.png"
        imageAlt="Lesauto met instructeur en leerling"
      />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => {
            const copy = PACKAGE_COPY[pkg.name];
            return (
              <div key={pkg.id} className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-[0_10px_30px_rgba(20,20,26,0.06)]">
                <h2 className="text-lg font-bold">{pkg.name}</h2>
                <p className="mt-2 text-sm font-semibold text-[#ed1c24]">{copy?.tagline ?? pkg.description}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#58595b]">{copy?.text ?? pkg.description}</p>
                <div className="my-5 space-y-2 rounded-lg bg-[#f9fafb] p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Automaat</span>
                    <span className="font-bold">{formatEuro(pkg.priceAutomaat)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Manueel</span>
                    <span className="font-bold">{formatEuro(pkg.priceManueel)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/10 pt-2 text-xs text-[#58595b]">
                    <span>Inschrijvingskosten</span>
                    <span className="font-semibold">+ {formatEuro(pkg.registrationFee)}</span>
                  </div>
                </div>
                <Link href={`/boeken?package=${pkg.id}`} className="btn-primary">
                  Schrijf je nu in
                </Link>
              </div>
            );
          })}
        </div>
        <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-[#58595b]">
          Bij elk pakket worden inschrijvingskosten in rekening gebracht. Die dekken de administratieve verwerking van
          je inschrijving. Neem{" "}
          <Link href="/contact" className="font-semibold text-[#ed1c24] underline">
            contact
          </Link>{" "}
          met ons op voor meer informatie, of schrijf je direct in voor een pakket.
        </p>
      </section>
      <Graduates />
    </div>
  );
}
