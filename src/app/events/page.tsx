import type { Metadata } from "next";
import Link from "next/link";

import { EventExplorer, type Filter } from "@/components/home/event-explorer";
import { SearchIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { searchEvents } from "@/db/queries/events";
import { categories, type EventCategory } from "@/lib/events";

export const metadata: Metadata = {
  title: "Find a run",
  description:
    "Search fun runs, colour runs, trail races and race days across the Philippines.",
};

function param(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function FindARunPage({
  searchParams,
}: PageProps<"/events">) {
  const params = await searchParams;
  const query = param(params.q);
  const category = param(params.category);
  const initialFilter: Filter =
    category === "Free" || categories.includes(category as EventCategory)
      ? (category as Filter)
      : "All";

  const events = await searchEvents(query);

  return (
    <>
      <PageHeader eyebrow="Upcoming in the Philippines" title="Find a run">
        <p>
          Every run on Fun Run, from free community 5Ks to trail half
          marathons. Search by name, place or organiser, then narrow it down
          by category.
        </p>
      </PageHeader>

      <section
        aria-labelledby="results-heading"
        className="section container-page"
      >
        <div className="stack gap-8">
          <form
            action="/events"
            role="search"
            className="grid w-full max-w-3xl gap-2 rounded-xl border border-line bg-surface p-2 shadow-card sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <label className="flex items-center gap-2 px-3">
              <SearchIcon className="shrink-0 text-ink-muted" />
              <span className="sr-only">Search runs</span>
              <input
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search by run, place or organiser"
                className="input min-h-11 border-0 px-0 shadow-none focus:shadow-none"
              />
            </label>
            {initialFilter !== "All" && (
              <input type="hidden" name="category" value={initialFilter} />
            )}
            <button type="submit" className="btn btn-primary btn-lg">
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="results-heading" className="text-xl md:text-2xl">
              {query
                ? `${events.length} ${events.length === 1 ? "run" : "runs"} for “${query}”`
                : `${events.length} upcoming ${events.length === 1 ? "run" : "runs"}`}
            </h2>
            {query && (
              <Link href="/events" className="link text-sm">
                Clear search
              </Link>
            )}
          </div>

          {events.length > 0 ? (
            <EventExplorer
              // Remount so the chip selection follows the URL.
              key={`${query}|${initialFilter}`}
              events={events}
              categories={categories}
              initialFilter={initialFilter}
            />
          ) : (
            <div className="stack items-center gap-4 rounded-lg border border-dashed border-line-strong p-10 text-center">
              <p className="meta">
                No runs match “{query}” yet. Try a city, a distance like
                “10K”, or browse everything.
              </p>
              <Link href="/events" className="btn btn-secondary btn-sm">
                See all runs
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
