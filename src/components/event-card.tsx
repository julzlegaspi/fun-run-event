"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CalendarIcon, HeartIcon, PinIcon } from "@/components/icons";
import {
  eventHref,
  formatEventDate,
  formatPrice,
  type RunEvent,
} from "@/lib/events";

const statusBadge: Record<NonNullable<RunEvent["status"]>, string> = {
  "Almost full": "badge-danger",
  "Selling fast": "badge-warning",
  "Early bird": "badge-success",
  New: "badge-brand",
};

export function EventCard({ event }: { event: RunEvent }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="card">
      <div className="card-media">
        <Image
          src={event.image.src}
          alt={event.image.alt}
          fill
          sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw"
          className="object-cover"
        />
        <span className="badge absolute top-3 left-3 bg-surface/95 text-ink shadow-card">
          {event.distance}
        </span>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          aria-label={saved ? `Unsave ${event.title}` : `Save ${event.title}`}
          className="btn btn-icon absolute top-2 right-2 z-10 bg-surface/95 text-ink shadow-card hover:bg-surface"
        >
          <HeartIcon className={saved ? "fill-brand text-brand" : undefined} />
        </button>
      </div>

      <div className="card-body">
        {event.status && (
          <span className={`badge ${statusBadge[event.status]} self-start`}>
            {event.status}
          </span>
        )}
        <h3 className="card-title">
          <Link href={eventHref(event)} className="card-link">
            {event.title}
          </Link>
        </h3>
        <p className="meta flex items-center gap-1.5">
          <CalendarIcon width={16} height={16} className="shrink-0" />
          {formatEventDate(event.startsAt)}
        </p>
        <p className="meta flex items-center gap-1.5">
          <PinIcon width={16} height={16} className="shrink-0" />
          <span className="truncate">
            {event.venue} · {event.area}
          </span>
        </p>
        <p className="mt-1 text-sm font-bold text-ink">
          {formatPrice(event.priceFrom)}
        </p>
      </div>
    </article>
  );
}
