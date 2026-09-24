import Image from "next/image";
import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  children,
  priority = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  imageSrc: string;
  imageAlt: string;
  children?: ReactNode;
  priority?: boolean;
}) {
  return (
    <section className="border-b border-black/5 bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 sm:px-6 md:grid-cols-2 md:gap-10 md:py-14">
        <div>
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-red">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-4xl font-extrabold leading-[1.1] text-brand-navy md:text-5xl">{title}</h1>
          {description ? <p className="mt-4 max-w-xl text-lg leading-relaxed text-brand-gray">{description}</p> : null}
          {children ? <div className="mt-6 flex flex-wrap gap-3">{children}</div> : null}
        </div>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1280}
          height={720}
          priority={priority}
          className="h-auto w-full"
        />
      </div>
    </section>
  );
}
