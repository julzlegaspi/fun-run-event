import Image from "next/image";

import { ArrowRightIcon } from "@/components/icons";
import { collections } from "@/lib/events";

export function Collections() {
  return (
    <section
      id="collections"
      aria-labelledby="collections-heading"
      className="section scroll-mt-16 bg-surface-muted"
    >
      <div className="container-page stack gap-8">
        <div className="stack max-w-2xl gap-3">
          <p className="eyebrow">Collections</p>
          <h2 id="collections-heading">Run it your way</h2>
          <p className="text-ink-body">
            Every run has a mood. Start with the one that sounds like your
            weekend.
          </p>
        </div>

        <div className="rail -mx-4 scroll-px-4 px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
          {collections.map((c) => (
            <a
              key={c.title}
              href="#events"
              className="group relative isolate flex aspect-[4/5] w-[78%] flex-col justify-end overflow-hidden rounded-xl p-6 text-white xs:w-[60%] md:w-auto"
            >
              <Image
                src={c.image.src}
                alt={c.image.alt}
                fill
                sizes="(min-width: 768px) 33vw, 80vw"
                className="-z-10 object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-linear-to-t from-black/80 via-black/25 to-transparent"
              />
              <h3 className="text-white">{c.title}</h3>
              <p className="mt-1 text-sm text-white/85">{c.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                Browse runs
                <ArrowRightIcon
                  width={16}
                  height={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
