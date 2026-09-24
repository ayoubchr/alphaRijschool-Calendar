import type { ReactNode } from "react";
import Link from "next/link";
import { ContactForm } from "./ContactForm";

const MAP_URL =
  "https://www.google.com/maps/place/Alpha+Rijschool/@51.2202801,4.4592743,17z/data=!3m1!4b1!4m6!3m5!1s0x47c3f78275834721:0x9e464b0a101b01a4!8m2!3d51.2202801!4d4.4592743";

function InfoCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <article className="flex items-start gap-4 rounded-[10px] border border-black/10 bg-white p-4">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ed1c24] text-white" aria-hidden>
        {icon}
      </span>
      <div>
        <h2 className="font-extrabold text-[#111827]">{title}</h2>
        <div className="mt-1 text-sm leading-relaxed text-[#58595b]">{children}</div>
      </div>
    </article>
  );
}

export default function ContactPage() {
  return (
    <div className="bg-[#f9f9f9]">
      <section className="bg-[#111827] px-6 py-20 text-center text-white md:py-28">
        <h1 className="text-4xl font-bold uppercase text-white md:text-5xl">Contacteer ons</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-light md:text-xl">
          Vragen? We horen graag van je! Stuur ons een bericht en we reageren zo snel mogelijk.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl items-start gap-10 px-6 py-16 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold text-[#111827]">We helpen je graag verder</h2>
          <p className="leading-relaxed text-[#58595b]">
            Bel, mail of stuur een bericht. Je kan ook meteen een les inplannen via{" "}
            <Link href="/boeken" className="font-semibold text-[#ed1c24] underline">
              de boekingspagina
            </Link>
            .
          </p>
          <InfoCard
            title="Locatie"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
              </svg>
            }
          >
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="hover:text-[#ed1c24]">
              Turnhoutsebaan 76B, 2100 Antwerpen, België
            </a>
          </InfoCard>
          <InfoCard
            title="Telefoon"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M7 3h3l1.5 4-2 1.2a12 12 0 0 0 6.3 6.3L17 12.5 21 14v3a2 2 0 0 1-2.2 2A17 17 0 0 1 5 5.2 2 2 0 0 1 7 3z" />
              </svg>
            }
          >
            <a href="tel:+32486295375" className="hover:text-[#ed1c24]">
              +32 486 29 53 75
            </a>
          </InfoCard>
          <InfoCard
            title="E-mail"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11zm2.2.5 6.8 4.6L18.8 7H5.2z" />
              </svg>
            }
          >
            <a href="mailto:rijschoolalpha@gmail.com" className="hover:text-[#ed1c24]">
              rijschoolalpha@gmail.com
            </a>
          </InfoCard>
          <InfoCard
            title="Openingsuren"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.2l3.4 2-1 1.6L11 13V7h2z" />
              </svg>
            }
          >
            <p>Maandag - vrijdag: 10:00 - 18:00</p>
            <p>Zaterdag: 10:00 - 17:00</p>
            <p>Zondag: gesloten</p>
          </InfoCard>
        </div>

        <div className="rounded-[10px] border border-black/10 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <h2 className="mb-4 text-2xl font-extrabold text-[#111827]">Stuur ons een bericht</h2>
          <ContactForm />
        </div>
      </section>

      <iframe
        title="Alpha Rijschool op Google Maps"
        src="https://maps.google.com/maps?q=Turnhoutsebaan%2076B%202100%20Antwerpen&z=16&output=embed"
        className="h-80 w-full border-0"
        loading="lazy"
      />
    </div>
  );
}
