import "server-only";

import { asc, desc, eq, ne, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { events, races } from "@/db/schema";
import type { RunEvent } from "@/lib/events";

const withRaces = {
  races: { orderBy: [asc(races.distanceKm)] },
};

type EventRow = typeof events.$inferSelect & {
  races: (typeof races.$inferSelect)[];
};

// Map a DB row to the shape the UI components expect.
function toRunEvent(row: EventRow): RunEvent {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    distance: row.distanceLabel,
    startsAt: row.startsAt.toISOString(),
    venue: row.venue,
    area: row.area,
    address: row.address,
    image: { src: row.imageUrl, alt: row.imageAlt },
    status: row.status ?? undefined,
    organizer: row.organizer,
    about: row.about,
    included: row.included,
    priceFrom: row.races.length
      ? Math.min(...row.races.map((r) => r.price))
      : 0,
    races: row.races.map((r) => ({
      id: r.id,
      name: r.name,
      km: r.distanceKm,
      price: r.price,
      startTime: r.startTime.slice(0, 5), // "06:30:00" -> "06:30"
      cutoff: r.cutoff,
      minAge: r.minAge,
      spotsLeft: r.spotsLeft,
    })),
  };
}

export async function getEvents() {
  const rows = await db.query.events.findMany({
    with: withRaces,
    orderBy: [asc(events.startsAt)],
  });
  return rows.map(toRunEvent);
}

export async function getEventSlugs() {
  return db.select({ slug: events.slug }).from(events);
}

// Cached per request so generateMetadata and the page share one query.
export const getEventBySlug = cache(async (slug: string) => {
  const row = await db.query.events.findFirst({
    where: eq(events.slug, slug),
    with: withRaces,
  });
  return row ? toRunEvent(row) : undefined;
});

// The flagged event, falling back to the next one on the calendar.
export async function getFeaturedEvent() {
  const row = await db.query.events.findFirst({
    with: withRaces,
    orderBy: [desc(events.isFeatured), asc(events.startsAt)],
  });
  return row ? toRunEvent(row) : undefined;
}

// Runs to suggest at the bottom of a detail page: same category first.
export async function getRelatedEvents(event: RunEvent, count = 4) {
  const rows = await db.query.events.findMany({
    where: ne(events.slug, event.slug),
    with: withRaces,
    orderBy: [
      desc(sql`${events.category} = ${event.category}`),
      asc(events.startsAt),
    ],
    limit: count,
  });
  return rows.map(toRunEvent);
}
