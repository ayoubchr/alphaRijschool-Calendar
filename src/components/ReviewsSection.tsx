"use client";

import { useRef, useState } from "react";
import type { GoogleReviewSummary } from "@/lib/googleReviews";

const PAGE_SIZE = 6;

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

export function ReviewsSection({ summary }: { summary: GoogleReviewSummary }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(summary.reviews.length / PAGE_SIZE);
  const current = Math.min(page, Math.max(pageCount - 1, 0));
  const visible = summary.reviews.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function goTo(next: number) {
    setPage(next);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section ref={sectionRef} className="scroll-mt-24 bg-white px-4 py-16 sm:px-6" aria-labelledby="ervaringen-titel">
      <div className="mx-auto max-w-6xl">
        <h2 id="ervaringen-titel" className="text-center text-3xl font-extrabold text-brand-navy">
          Ervaringen
        </h2>
        <p className="mb-10 mt-3 text-center text-sm text-brand-gray">
          {summary.reviewCount ? ` ${summary.reviewCount} beoordelingen` : ""}
          {" · "}
          <a href={summary.mapsUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-red underline">
            Bekijk op Google
          </a>
        </p>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((review) => (
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
        {pageCount > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagina's met reviews">
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-brand-navy transition hover:bg-brand-mist disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
            >
              Vorige
            </button>
            {Array.from({ length: pageCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                  index === current ? "bg-brand-red text-white" : "text-brand-navy hover:bg-brand-mist"
                }`}
                aria-current={index === current ? "page" : undefined}
                onClick={() => goTo(index)}
              >
                {index + 1}
              </button>
            ))}
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-brand-navy transition hover:bg-brand-mist disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => goTo(current + 1)}
              disabled={current === pageCount - 1}
            >
              Volgende
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
