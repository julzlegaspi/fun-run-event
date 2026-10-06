import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventCard } from "@/components/event-card";
import { EventGallery } from "@/components/event/event-gallery";
import { TicketPicker } from "@/components/event/ticket-picker";
import {
  CalendarIcon,
  MedalIcon,
  PinIcon,
  RouteIcon,
} from "@/components/icons";
import {
  getEventBySlug,
  getEventSlugs,
  getRelatedEvents,
} from "@/db/queries/events";
import {
  eventDay,
  eventGallery,
  formatEventDate,
  formatKm,
  formatMoney,
  formatPrice,
  formatTime,
  raceDaySchedule,
} from "@/lib/events";

export const revalidate = 60;

export function generateStaticParams() {
  return getEventSlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  const event = await getEventBySlug((await params).slug);
  if (!event) return {};
  return {
    title: event.title,
    description: event.about[0],
    openGraph: { images: [event.image.src] },
  };
}

export default async function EventPage({
  params,
}: PageProps<"/events/[slug]">) {
  const event = await getEventBySlug((await params).slug);
  if (!event) notFound();
  const related = await getRelatedEvents(event);

  const { day, month } = eventDay(event.startsAt);
  // Preselect the race matching the event's headline distance.
  const headline =
    event.races.find((r) => r.km === parseFloat(event.distance)) ??
    event.races[0];
  const distances = event.races.map((r) => formatKm(r.km)).join(" · ");

  return (
    <>
      <div className="container-page pt-4 pb-10 md:pt-6">
        <nav aria-label="Breadcrumb" className="meta mb-4">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/#events" className="hover:text-ink">
                {event.category}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="truncate text-ink">
              {event.title}
            </li>
          </ol>
        </nav>

        <EventGallery photos={eventGallery(event)} />

        {/* One ticket panel: after the header on mobile, a sticky sidebar
            spanning both rows on desktop. */}
        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[1fr_24rem] lg:gap-x-16 lg:gap-y-12">
          <header className="stack min-w-0 gap-4">
            <div className="cluster">
              <span className="badge">{event.category}</span>
              {event.status && (
                <span className="badge badge-brand">{event.status}</span>
              )}
            </div>
            <h1>{event.title}</h1>
            <p className="text-lg text-ink-body">
              By{" "}
              <span className="font-semibold text-ink">{event.organizer}</span>
            </p>

            <dl className="mt-2 grid gap-4 sm:grid-cols-3">
              <Fact
                icon={<CalendarIcon />}
                label="Date"
                value={formatEventDate(event.startsAt)}
              />
              <Fact
                icon={<PinIcon />}
                label="Location"
                value={`${event.venue}, ${event.area}`}
              />
              <Fact icon={<RouteIcon />} label="Distances" value={distances} />
            </dl>
          </header>

          <aside
            aria-label="Tickets"
            className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <div className="stack gap-4 lg:sticky lg:top-24">
              <div className="hidden items-center gap-3 lg:flex">
                <div className="flex flex-col items-center rounded-md border border-line px-3 py-1.5 text-center">
                  <span className="text-2xs font-bold text-brand uppercase">
                    {month}
                  </span>
                  <span className="font-display text-xl leading-none font-extrabold text-ink">
                    {day}
                  </span>
                </div>
                <p className="meta">
                  {formatPrice(event.priceFrom)} · {event.races.length}{" "}
                  distances
                </p>
              </div>
              <TicketPicker races={event.races} defaultRaceId={headline.id} />
            </div>
          </aside>

          <div className="stack min-w-0 gap-12">
            <section aria-labelledby="about-heading" className="stack gap-4">
              <h2 id="about-heading">About this run</h2>
              {event.about.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="max-w-prose text-lg">
                  {paragraph}
                </p>
              ))}
            </section>

            <section aria-labelledby="races-heading" className="stack gap-5">
              <h2 id="races-heading">Distance options</h2>
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-muted text-xs text-ink-muted uppercase">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Category
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Flag-off
                      </th>
                      <th
                        scope="col"
                        className="hidden px-4 py-3 font-semibold sm:table-cell"
                      >
                        Cut-off
                      </th>
                      <th
                        scope="col"
                        className="hidden px-4 py-3 font-semibold sm:table-cell"
                      >
                        Age
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-semibold"
                      >
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {event.races.map((race) => (
                      <tr key={race.id}>
                        <th scope="row" className="px-4 py-4 font-normal">
                          <span className="block font-semibold text-ink">
                            {formatKm(race.km)}
                          </span>
                          <span className="meta">{race.name}</span>
                        </th>
                        <td className="px-4 py-4">
                          {formatTime(race.startTime)}
                        </td>
                        <td className="hidden px-4 py-4 sm:table-cell">
                          {race.cutoff}
                        </td>
                        <td className="hidden px-4 py-4 sm:table-cell">
                          {race.minAge ? `${race.minAge}+` : "All ages"}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-ink">
                          {formatMoney(race.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="included-heading" className="stack gap-5">
              <h2 id="included-heading">What&apos;s included</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {event.included.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-lg bg-surface-muted p-4 font-medium text-ink"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <MedalIcon width={18} height={18} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="schedule-heading" className="stack gap-5">
              <h2 id="schedule-heading">Race-day schedule</h2>
              <ol className="relative ml-2 border-l-2 border-line">
                {raceDaySchedule(event).map((item) => (
                  <li key={item.label} className="relative pb-6 pl-6 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-surface bg-brand"
                    />
                    <p className="font-display text-sm font-bold text-ink">
                      {formatTime(item.time)}
                    </p>
                    <p className="text-ink-body">{item.label}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="location-heading" className="stack gap-5">
              <h2 id="location-heading">Location</h2>
              <div className="flex flex-col gap-4 rounded-xl border border-line p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink">
                    <PinIcon />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{event.venue}</p>
                    <p className="meta">{event.address}</p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm shrink-0"
                >
                  Get directions
                </a>
              </div>
            </section>

            <section
              aria-labelledby="organizer-heading"
              className="flex items-center gap-4 rounded-xl bg-surface-muted p-5"
            >
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg font-extrabold text-surface"
              >
                {event.organizer
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="meta">Organised by</p>
                <h2
                  id="organizer-heading"
                  className="truncate text-lg md:text-lg"
                >
                  {event.organizer}
                </h2>
              </div>
              <button type="button" className="btn btn-secondary btn-sm">
                Follow
              </button>
            </section>
          </div>
        </div>
      </div>

      <section
        aria-labelledby="related-heading"
        className="section border-t border-line bg-surface-muted"
      >
        <div className="container-page stack gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="related-heading">More runs you might like</h2>
            <Link href="/#events" className="link text-sm">
              See all runs
            </Link>
          </div>
          <div className="grid-cards">
            {related.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="meta text-xs">{label}</dt>
        <dd className="font-semibold text-ink">{value}</dd>
      </div>
    </div>
  );
}
