import "server-only";

import { and, asc, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { events, races } from "@/db/schema";
import type { RunEvent } from "@/lib/events";

export const withRaces = {
  races: { orderBy: [asc(races.distanceKm)] },
};

export type EventRow = typeof events.$inferSelect & {
  races: (typeof races.$inferSelect)[];
};

// Drafts only appear in the organizer dashboard.
const published = eq(events.isPublished, true);

// Map a DB row to the shape the UI components expect.
export function toRunEvent(row: EventRow): RunEvent {
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
    where: published,
    with: withRaces,
    orderBy: [asc(events.startsAt)],
  });
  return rows.map(toRunEvent);
}

// Free-text search across the fields a runner would type: name, place,
// organiser or category. An empty query returns every event.
export async function searchEvents(query: string) {
  const q = query.trim();
  if (!q) return getEvents();

  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await db.query.events.findMany({
    where: and(
      published,
      or(
        ilike(events.title, pattern),
        ilike(events.venue, pattern),
        ilike(events.area, pattern),
        ilike(events.organizer, pattern),
        ilike(events.distanceLabel, pattern),
        sql`${events.category}::text ilike ${pattern}`,
      ),
    ),
    with: withRaces,
    orderBy: [asc(events.startsAt)],
  });
  return rows.map(toRunEvent);
}

export async function getEventSlugs() {
  return db.select({ slug: events.slug }).from(events).where(published);
}

// Cached per request so generateMetadata and the page share one query.
export const getEventBySlug = cache(async (slug: string) => {
  const row = await db.query.events.findFirst({
    where: and(eq(events.slug, slug), published),
    with: withRaces,
  });
  return row ? toRunEvent(row) : undefined;
});

// The event and one of its races for checkout; undefined if either is missing.
// `eventId` is the DB id, which RunEvent deliberately leaves out.
export const getCheckoutRace = cache(async (slug: string, raceId: string) => {
  const row = await db.query.events.findFirst({
    where: and(eq(events.slug, slug), published),
    with: withRaces,
  });
  const race = row?.races.find((r) => r.id === raceId);
  if (!row || !race) return undefined;
  const event = toRunEvent(row);
  return {
    eventId: row.id,
    event,
    race: event.races.find((r) => r.id === race.id)!,
  };
});

// The flagged event, falling back to the next one on the calendar.
export async function getFeaturedEvent() {
  const row = await db.query.events.findFirst({
    where: published,
    with: withRaces,
    orderBy: [desc(events.isFeatured), asc(events.startsAt)],
  });
  return row ? toRunEvent(row) : undefined;
}

// Runs to suggest at the bottom of a detail page: same category first.
export async function getRelatedEvents(event: RunEvent, count = 4) {
  const rows = await db.query.events.findMany({
    where: and(ne(events.slug, event.slug), published),
    with: withRaces,
    orderBy: [
      desc(sql`${events.category} = ${event.category}`),
      asc(events.startsAt),
    ],
    limit: count,
  });
  return rows.map(toRunEvent);
}
