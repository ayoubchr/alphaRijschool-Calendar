import Image from "next/image";

const PHOTOS = [1, 2, 3, 4, 5].map((n) => ({
  src: `/geslaagden/praktijk-geslaagd-${n}.webp`,
  alt: `Geslaagde leerling ${n} van Alpha Rijschool`,
}));

export function Graduates() {
  return (
    <section className="bg-[#f9f9f9] px-6 py-16" aria-labelledby="geslaagden-titel">
      <div className="mx-auto max-w-6xl">
        <h2 id="geslaagden-titel" className="text-center text-3xl font-extrabold text-brand-navy">
          Onze geslaagden
        </h2>
        <p className="mt-2 text-center text-sm text-[#58595b]">Swipe om meer foto&apos;s te zien van onze trotse geslaagden</p>
        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {PHOTOS.map((photo) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={640}
              height={640}
              className="h-72 w-72 shrink-0 snap-center rounded-[10px] object-cover shadow-sm sm:h-80 sm:w-80"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
