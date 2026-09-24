import Image from "next/image";
import Link from "next/link";
import { getGoogleReviews } from "@/lib/googleReviews";
import { PiMedalLight } from "react-icons/pi";
import { IoCarSportOutline, IoCalendarOutline } from "react-icons/io5";
import { SlPhone } from "react-icons/sl";

const FEATURES = [
  {
    title: "Moderne lesvoertuigen",
    text: "Leren rijden in veilige, comfortabele lesauto's van de nieuwste generatie.",
    icon: "car",
  },
  {
    title: "Gecertificeerde instructeurs",
    text: "Professionele begeleiding van ervaren en gediplomeerde rijinstructeurs.",
    icon: "badge",
  },
  {
    title: "Flexibele planning",
    text: "Rijlessen volledig afgestemd op jouw agenda, ook 's avonds en in het weekend.",
    icon: "calendar",
  },
  {
    title: "Altijd bereikbaar",
    text: "Ondersteuning wanneer jij het nodig hebt, zeven dagen per week.",
    icon: "phone",
  },
] as const;

const REASONS = [
  "Betaalbare en flexibele rijlessen in Antwerpen en omliggende regio's",
  "Hoog slagingspercentage, dankzij onze gestructureerde aanpak",
  "Rijopleiding op maat, afgestemd op jouw tempo en behoeften",
  "Mogelijkheid voor automaatlessen, spoedcursussen en extra oefensessies",
  "Professionele en geduldige rijinstructeurs, inclusief keuze voor een vaste of vrouwelijke instructeur",
  "Leren rijden in een moderne, milieuvriendelijke lesauto",
  "Rijlessen op flexibele tijden, ook in de avonduren en het weekend",
  "Gespreid betalen zonder extra kosten",
  "Complete ondersteuning voor zowel praktijk als theorie-examen",
];

function FeatureIcon({ name }: { name: (typeof FEATURES)[number]["icon"] }) {
  const className = "h-7 w-7";
  if (name === "car") return <IoCarSportOutline className={className} />;
  if (name === "badge") return <PiMedalLight className={className} />;
  if (name === "calendar") return <IoCalendarOutline className={className} />;
  return <SlPhone className={className} />;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-brand-red" aria-label={`${rating} van 5 sterren`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} viewBox="0 0 20 20" className={`h-4 w-4 fill-current ${index < rating ? "" : "opacity-30"}`} aria-hidden>
          <path d="M10 1.6l2.2 4.6 5 .7-3.6 3.5.9 5.1L10 13.2 5.5 15.5l.9-5.1L2.8 6.9l5-.7L10 1.6z" />
        </svg>
      ))}
    </div>
  );
}

export default async function Home() {
  const googleReviews = await getGoogleReviews();
  return (
    <div>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-red">Alpha Rijschool</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] text-brand-navy md:text-5xl">
              Welkom bij Alpha Rijschool
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-gray">
              Kies voor kwaliteit, kies voor zekerheid. Begin vandaag nog aan je rijavontuur met Rijschool Alpha.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/boeken" className="btn-primary">
                Boek een les
              </Link>
              <Link href="/over-ons" className="btn-outline">
                Meer informatie
              </Link>
            </div>
          </div>
          <Image
            src="/illustraties/hero-theorie.png"
            alt="Instructeur legt verkeersborden uit aan leerlingen"
            width={1280}
            height={720}
            priority
            className="h-auto w-full"
          />
        </div>
      </section>

      <section className="bg-brand-mist px-4 py-16 sm:px-6" aria-label="Voordelen">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red text-white">
                <FeatureIcon name={feature.icon} />
              </span>
              <h2 className="mt-4 text-lg font-extrabold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-gray">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <Image
            src="/illustraties/hero-rijles.png"
            alt="Rijles met instructeur en leerling in een lesauto"
            width={1280}
            height={720}
            className="h-auto w-full"
          />
          <div>
            <h2 className="text-3xl font-extrabold leading-tight text-brand-navy md:text-4xl">
              De snelste weg naar je rijbewijs in Antwerpen
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-gray">
              Ben je op zoek naar een betrouwbare en kwalitatieve rijschool in Antwerpen? Wij helpen je om op een
              effectieve, betaalbare en plezierige manier je rijbewijs te behalen.
            </p>
            <ul className="mt-6 space-y-3">
              {REASONS.map((reason) => (
                <li key={reason} className="flex gap-3 text-brand-gray">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs text-white" aria-hidden>
                    ✓
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            <Link href="/boeken" className="btn-primary mt-8">
              Schrijf je in
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-brand-mist px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold text-brand-navy">Leren in een echte lesauto</h2>
            <p className="mt-4 leading-relaxed text-brand-gray">
              Je oefent in moderne, goed onderhouden lesvoertuigen. Zo wen je meteen aan het verkeer in en rond
              Antwerpen, met een instructeur naast je.
            </p>
            <Link href="/tarieven-pakketten" className="btn-outline mt-6">
              Bekijk de pakketten
            </Link>
          </div>
          <Image
            src="/sfeerbeeld-home.webp"
            alt="Lesauto's van Alpha Rijschool"
            width={706}
            height={706}
            className="h-auto w-full rounded-2xl object-cover shadow-sm lg:h-[420px]"
          />
        </div>
      </section>

      {googleReviews && (
        <section className="bg-white px-4 py-16 sm:px-6" aria-labelledby="ervaringen-titel">
          <div className="mx-auto max-w-6xl">
            <h2 id="ervaringen-titel" className="text-center text-3xl font-extrabold text-brand-navy">
              Ervaringen
            </h2>
            <p className="mb-10 mt-3 text-center text-sm text-brand-gray">
              {googleReviews.rating ? `${googleReviews.rating.toLocaleString("nl-BE")} / 5` : "Google-reviews"}
              {googleReviews.reviewCount ? ` · ${googleReviews.reviewCount} beoordelingen` : ""}
              {" · "}
              <a href={googleReviews.mapsUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-red underline">
                Bekijk op Google
              </a>
            </p>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {googleReviews.reviews.map((review) => (
                <article key={review.id} className="flex flex-col rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(20,20,26,0.08)]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white">
                      {review.author
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div>
                      {review.authorUrl ? (
                        <a href={review.authorUrl} target="_blank" rel="noreferrer" className="font-bold hover:text-brand-red">
                          {review.author}
                        </a>
                      ) : (
                        <h3 className="font-bold">{review.author}</h3>
                      )}
                      {review.relativeTime && <p className="text-xs text-neutral-500">{review.relativeTime}</p>}
                    </div>
                  </div>
                  <div className="mt-3">
                    <Stars rating={review.rating} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-brand-gray">{review.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-brand-navy px-4 py-16 text-center text-white sm:px-6">
        <h2 className="text-3xl font-extrabold text-white">Klaar om te beginnen?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/75">
          Plan je les online en betaal het voorschot meteen. Zo staat je plek vast.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/boeken" className="btn-primary">
            Boek een les
          </Link>
          <Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-full border-2 border-white px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-brand-navy">
            Contact
          </Link>
        </div>
      </section>
    </div>
  );
}
