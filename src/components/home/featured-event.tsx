import Image from "next/image";
import Link from "next/link";

import {
  ArrowRightIcon,
  CalendarIcon,
  PinIcon,
  RouteIcon,
} from "@/components/icons";
import {
  eventDay,
  eventHref,
  formatEventDate,
  formatPrice,
  type RunEvent,
} from "@/lib/events";

export function FeaturedEvent({ event }: { event: RunEvent }) {
  const { day, month } = eventDay(event.startsAt);

  return (
    <section
      aria-labelledby="featured-heading"
      className="section container-page"
    >
      <div className="grid overflow-hidden rounded-xl border border-line bg-surface md:grid-cols-[1.25fr_1fr]">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[26rem]">
          <Image
            src={event.image.src}
            alt={event.image.alt}
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover"
          />
          <div className="absolute top-4 left-4 flex flex-col items-center rounded-md bg-surface px-3 py-2 text-center shadow-card">
            <span className="text-2xs font-bold uppercase text-brand">
              {month}
            </span>
            <span className="font-display text-2xl font-extrabold leading-none text-ink">
              {day}
            </span>
          </div>
        </div>

        <div className="stack justify-center gap-5 p-6 sm:p-8 lg:p-12">
          <p className="eyebrow">Featured this month</p>
          <h2 id="featured-heading">
            <Link href={eventHref(event)} className="hover:text-brand">
              {event.title}
            </Link>
          </h2>
          <p className="text-ink-body">{event.about[0]}</p>
          <ul className="stack gap-2">
            <li className="meta flex items-center gap-2">
              <CalendarIcon className="shrink-0" />
              {formatEventDate(event.startsAt)}
            </li>
            <li className="meta flex items-center gap-2">
              <PinIcon className="shrink-0" />
              {event.venue}, {event.area}
            </li>
            <li className="meta flex items-center gap-2">
              <RouteIcon className="shrink-0" />
              {event.distance} · {event.organizer}
            </li>
          </ul>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Link
              href={`${eventHref(event)}#tickets`}
              className="btn btn-primary btn-lg"
            >
              Get tickets
              <ArrowRightIcon />
            </Link>
            <span className="text-base font-bold text-ink">
              {formatPrice(event.priceFrom)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
