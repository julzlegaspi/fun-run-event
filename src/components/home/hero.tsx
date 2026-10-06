import Image from "next/image";

import { PinIcon, SearchIcon } from "@/components/icons";
import { categories, heroImage } from "@/lib/events";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0d0f18]">
      <Image
        src={heroImage.src}
        alt={heroImage.alt}
        fill
        preload
        sizes="100vw"
        className="-z-10 object-cover object-[center_35%]"
      />
      {/* Darken bottom-left so white type stays legible on any photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/45 to-black/10 md:bg-linear-to-r md:from-black/80 md:via-black/45 md:to-transparent"
      />

      <div className="container-page flex min-h-[34rem] flex-col justify-end pt-24 pb-10 md:min-h-[40rem] md:pb-16">
        <div className="stack max-w-2xl gap-5">
          <p className="eyebrow text-white/85">Fun runs · Race days · Community 5Ks</p>
          <h1 className="text-white">Find your next finish line.</h1>
          <p className="max-w-xl text-lg text-white/85">
            Colour runs at sunrise, trail races in the Rizal foothills and
            night runs past the river. Pick a distance, grab a bib, bring your
            crew.
          </p>
        </div>

        <form
          action="#events"
          role="search"
          className="mt-8 grid w-full max-w-3xl gap-2 rounded-xl bg-surface p-2 shadow-overlay sm:grid-cols-[1fr_auto_auto] sm:items-center"
        >
          <label className="flex items-center gap-2 px-3">
            <SearchIcon className="shrink-0 text-ink-muted" />
            <span className="sr-only">Search runs</span>
            <input
              name="q"
              type="search"
              placeholder="Search by run, distance or organiser"
              className="input min-h-11 border-0 px-0 shadow-none focus:shadow-none"
            />
          </label>
          <label className="flex items-center gap-2 border-t border-line px-3 sm:border-t-0 sm:border-l">
            <PinIcon className="shrink-0 text-ink-muted" />
            <span className="sr-only">Location</span>
            <select
              name="area"
              defaultValue="Philippines"
              className="min-h-11 bg-transparent text-base text-ink focus:outline-none"
            >
              <option>Philippines</option>
              <option>Metro Manila</option>
              <option>Luzon</option>
              <option>Visayas</option>
              <option>Mindanao</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary btn-lg">
            Search
          </button>
        </form>

        <div className="mt-5 cluster">
          <span className="text-sm font-semibold text-white/80">Popular:</span>
          {categories.slice(0, 5).map((c) => (
            <a
              key={c}
              href="#events"
              className="rounded-full border border-white/30 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              {c}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
