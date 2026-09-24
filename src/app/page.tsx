import Image from "next/image";
import Link from "next/link";
import { getGoogleReviews } from "@/lib/googleReviews";
import { PiMedalLight } from "react-icons/pi";
import { IoCarSportOutline } from "react-icons/io5";
import { IoCalendarOutline } from "react-icons/io5";
import { SlPhone } from "react-icons/sl";

const FEATURES = [
  {
    title: "Moderne Lesvoertuigen",
    text: "Leren rijden in veilige, comfortabele lesauto's van de nieuwste generatie.",
    icon: "car",
  },
  {
    title: "Gecertificeerde Instructeurs",
    text: "Professionele begeleiding van ervaren en gediplomeerde rijinstructeurs.",
    icon: "badge",
  },
  {
    title: "Flexibele Planningen",
    text: "Rijlessen volledig afgestemd op jouw agenda.",
    icon: "calendar",
  },
  {
    title: "Altijd Bereikbaar",
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
  const className = name === "car" || name === "calendar" ? "h-10 w-10 text-[#ed1c24]" : "h-10 w-10 text-[#111827]";

  if (name === "car") {
    return (
      <IoCarSportOutline className={className} />
    );
  }

  if (name === "badge") {
    return (
      <PiMedalLight className={className} />
    );
  }

  if (name === "calendar") {
    return (
      <IoCalendarOutline className={className} />
    );
  }

  return (
    <SlPhone className={className} />
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[#FFD700]" aria-label={`${rating} van 5 sterren`}>
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
      <section className="bg-[#111827] px-6 py-24 text-center text-white md:py-32 lg:py-40">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold uppercase leading-tight text-white md:text-5xl">
          Welkom bij Alpha Rijschool
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-xl font-light text-white md:text-2xl">
          Kies voor kwaliteit, kies voor zekerheid. Begin vandaag nog aan je rijavontuur met Rijschool Alpha
        </p>
        <div className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/boeken"
            className="inline-flex h-11 w-44 items-center justify-center rounded-[10px] border border-transparent bg-[#ed1c24] font-medium text-white transition duration-300 hover:border-white hover:bg-[#111827]"
          >
            Boek een les
          </Link>
          <Link
            href="/over-ons"
            className="inline-flex h-11 w-44 items-center justify-center rounded-[10px] border border-transparent bg-white font-medium text-[#ed1c24] transition duration-300 hover:border-white hover:bg-[#111827] hover:text-white"
          >
            Meer informatie
          </Link>
        </div>
      </section>

      <section className="bg-[#f9f9f9] px-6 py-20" aria-label="Voordelen">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="home-card">
              <FeatureIcon name={feature.icon} />
              <h2 className="mt-4 text-lg font-extrabold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#58595b]">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <Image
            src="/sfeerbeeld-home.webp"
            alt="Lesauto's van Alpha Rijschool"
            width={706}
            height={706}
            className="h-auto w-full rounded-[10px] object-cover lg:h-[420px]"
          />
          <div>
            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
              De snelste weg naar je rijbewijs in Antwerpen
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-800">
              Ben je op zoek naar een betrouwbare en kwalitatieve rijschool in Antwerpen? Wij helpen je om op een
              effectieve, betaalbare en plezierige manier je rijbewijs te behalen!
            </p>
            <h3 className="mt-8 text-2xl font-extrabold">Waarom kiezen voor ons?</h3>
            <ul className="mt-4 space-y-3">
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
            <Link
              href="/boeken"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-[10px] bg-[#ed1c24] px-6 font-medium text-white transition duration-300 hover:bg-[#111827]"
            >
              Schrijf je in
            </Link>
          </div>
        </div>
      </section>

      {googleReviews && (
        <section className="bg-[#f9f9f9] px-6 py-20" aria-labelledby="ervaringen-titel">
          <div className="mx-auto max-w-6xl">
            <h2 id="ervaringen-titel" className="text-center text-2xl font-bold uppercase tracking-wide text-neutral-800">
              Ervaringen
            </h2>
            <p className="mb-10 mt-3 text-center text-sm text-[#58595b]">
              {googleReviews.rating ? `${googleReviews.rating.toLocaleString("nl-BE")} / 5` : "Google-reviews"}
              {googleReviews.reviewCount ? ` · ${googleReviews.reviewCount} beoordelingen` : ""}
              {" · "}
              <a href={googleReviews.mapsUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#ed1c24] underline">
                Bekijk op Google
              </a>
            </p>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {googleReviews.reviews.map((review) => (
                <article key={review.id} className="flex flex-col rounded-[10px] border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] text-sm font-bold text-white">
                      {review.author
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div>
                      {review.authorUrl ? (
                        <a href={review.authorUrl} target="_blank" rel="noreferrer" className="font-bold hover:text-[#ed1c24]">
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
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{review.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
