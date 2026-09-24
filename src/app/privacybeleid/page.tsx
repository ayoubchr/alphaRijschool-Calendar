import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacybeleid | Alpha Rijschool",
  description: "Privacyverklaring van Alpha Rijschool over de gegevens die we verzamelen, gebruiken en beveiligen.",
};

export default function PrivacybeleidPage() {
  return (
    <div>
      <section className="bg-[#111827] px-6 py-20 text-center text-white md:py-28">
        <h1 className="text-4xl font-bold uppercase text-white md:text-5xl">Privacybeleid</h1>
      </section>
      <article className="mx-auto max-w-3xl space-y-8 px-6 py-16 leading-relaxed text-[#58595b]">
        <p>
          Alpha Rijschool doet zijn uiterste best om je privacy te beschermen en te waarborgen. Om je nog meer
          informatie te geven over de gegevens die wij verzamelen, gebruiken en bewaken, informeren wij je hierover in
          de onderstaande privacyverklaring.
        </p>

        <section>
          <h2 className="text-xl font-extrabold text-[#111827]">Persoonsgegevens</h2>
          <p className="mt-3">
            Alpha Rijschool vindt het belangrijk dat je gegevens bij ons veilig zijn. En dat wij zorgvuldig en
            vertrouwelijk met je gegevens omgaan. Daarom hebben we afspraken gemaakt over hoe we je gegevens verwerken.
          </p>
          <h3 className="mt-4 font-bold text-[#111827]">Doel van verwerking persoonsgegevens</h3>
          <p className="mt-2">Alpha Rijschool verwerkt je persoonsgegevens voor de volgende doelen:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Het uitvoeren van onze diensten</li>
            <li>Het informeren over wijzigingen van onze diensten</li>
            <li>
              Het analyseren van je gedrag op de website om daarmee de website te verbeteren en het aanbod van diensten
              en producten af te stemmen op je wensen
            </li>
            <li>
              Het verwerken van persoonsgegevens als wij hier wettelijk toe verplicht zijn, zoals gegevens die wij nodig
              hebben voor onze belastingaangifte
            </li>
          </ul>
          <h3 className="mt-4 font-bold text-[#111827]">Welke persoonsgegevens verwerken wij?</h3>
          <p className="mt-2">
            Wanneer je de website van Alpha Rijschool bezoekt, verzamelen wij automatisch bepaalde niet-identificeerbare
            informatie. Deze technische informatie wordt gebruikt om de website en dienstverlening van Alpha Rijschool te
            optimaliseren. De gegevens die wij verzamelen en verwerken zijn onder andere de gegevens over de datum en
            het tijdstip dat je onze website en pagina’s bezoekt, het type browser dat je gebruikt, de website(s) of
            kanalen vanwaar je op onze website bent gekomen, de pagina’s en onderdelen die je bekijkt op onze website en
            de duur van een bezoek of sessie aan onze website.
          </p>
          <h3 className="mt-4 font-bold text-[#111827]">Hoe lang bewaren we je gegevens?</h3>
          <p className="mt-2">
            Alpha Rijschool bewaart je persoonsgegevens nooit langer dan strikt noodzakelijk is om de doelen te
            realiseren waarvoor je gegevens worden verzameld. Wij hanteren de wettelijke bewaartermijnen voor
            persoonsgegevens.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-[#111827]">Gegevens aan derden</h2>
          <p className="mt-3">
            Wij verstrekken je persoonsgegevens niet aan andere partijen zonder jouw voorafgaande toestemming.
            Uitzonderingen hierop zijn als de gegevensverstrekking noodzakelijk is in het kader van de uitvoering van
            onze diensten of wij op basis van de wet hiertoe verplicht zijn.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-[#111827]">Statistieken</h2>
          <p className="mt-3">
            Wij maken gebruik van Google Analytics om bij te houden hoe gebruikers onze website gebruiken en te
            analyseren hoe onze Google Adwords-advertenties presteren. De informatie die Google verzamelt wordt zo veel
            mogelijk geanonimiseerd. Het IP-adres wordt nadrukkelijk niet meegegeven. De informatie wordt overgebracht
            naar en door Google opgeslagen op servers in de Verenigde Staten. Google stelt zich te houden aan de Safe
            Harbor-principes en is aangesloten bij het Safe Harbor-programma van het Amerikaanse Ministerie van Handel.
            Dit houdt in dat er sprake is van een passend beschermingsniveau voor de verwerking van eventuele
            persoonsgegevens.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-[#111827]">Social media</h2>
          <p className="mt-3">
            Op de website van Alpha Rijschool zijn social media-knoppen opgenomen die je in staat stellen pagina’s van
            onze website te promoten op je eigen social media-account. Hierbij worden geen persoonsgegevens van je
            persoonlijke account gehaald. Lees de privacyverklaring van onze social media-kanalen (welke regelmatig kan
            wijzigen) om te zien wat zij met je persoonsgegevens doen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-[#111827]">Privacy</h2>
          <p className="mt-3">
            Deze privacyverklaring heeft alleen betrekking op gegevens die via deze website worden verzameld. Wij zijn
            niet verantwoordelijk voor je privacy met betrekking tot informatie die je plaatst op andere websites en
            overige kanalen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-[#111827]">Rechten</h2>
          <p className="mt-3">
            Als wij persoonsgegevens van je verwerken, heb je het recht deze gegevens in te zien (recht op inzage) en
            over te dragen (recht op dataportabiliteit). In bepaalde situaties kun je ook gebruik maken van de volgende
            rechten: het recht op correctie, het recht op verwijdering en het recht op beperking van de verwerking.
          </p>
          <p className="mt-3">
            Een verzoek voor het gebruik maken van een recht kun je indienen via het{" "}
            <Link href="/contact" className="font-semibold text-[#ed1c24] underline">
              contactformulier
            </Link>{" "}
            of door een e-mail te sturen naar{" "}
            <a href="mailto:rijschoolalpha@gmail.com" className="font-semibold text-[#ed1c24] underline">
              rijschoolalpha@gmail.com
            </a>{" "}
            of info@alpharijschool.be. Om misbruik te voorkomen kunnen wij je vragen om jezelf adequaat te identificeren.
            Om er zeker van te zijn dat het verzoek tot inzage door jou is gedaan, vragen wij je een kopie van je
            identiteitsbewijs met het verzoek mee te sturen. Maak in deze kopie je pasfoto, MRZ (machine readable zone,
            de strook met nummers onderaan het paspoort), paspoortnummer en rijksregisternummer zwart. Dit ter
            bescherming van je privacy. We reageren zo snel mogelijk, maar binnen vier weken, op je verzoek.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-[#111827]">Beveiliging</h2>
          <p className="mt-3">
            Je gegevens worden door ons beveiligd tegen diefstal, verlies of onrechtmatig gebruik. Wij hebben de nodige
            maatregelen getroffen om te voorkomen dat je persoonsgegevens verloren raken, gestolen worden of door
            personen buiten Alpha Rijschool worden bekeken. Denk aan een beveiligde SSL-verbinding.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-[#111827]">Wijzigingen</h2>
          <p className="mt-3">
            Alpha Rijschool behoudt zich het recht voor om wijzigingen aan te brengen in de privacyverklaring. Deze
            verklaring is voor het laatst opgemaakt op 25 mei 2018.
          </p>
        </section>
      </article>
    </div>
  );
}
