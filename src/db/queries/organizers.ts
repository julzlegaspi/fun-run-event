import "server-only";

import { and, asc, count, eq, inArray } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { getRaceStats } from "@/db/queries/dashboard";
import { withRaces } from "@/db/queries/events";
import { eventOrganizers, events, user as users } from "@/db/schema";
import { isAdmin, isOrganizer, type ManagedEvent } from "@/lib/dashboard";

export type DashboardUser = { id: string; role?: string | null };

// Ids of the events this user may manage; undefined means every event (admin).
async function managedEventIds(user: DashboardUser) {
  if (isAdmin(user)) return undefined;
  const rows = await db
    .select({ eventId: eventOrganizers.eventId })
    .from(eventOrganizers)
    .where(eq(eventOrganizers.userId, user.id));
  return rows.map((r) => r.eventId);
}

// Organizers and admins, plus anyone added to an event as a co-organizer.
export const hasDashboardAccess = cache(async (user: DashboardUser) => {
  if (isOrganizer(user)) return true;
  const [row] = await db
    .select({ eventId: eventOrganizers.eventId })
    .from(eventOrganizers)
    .where(eq(eventOrganizers.userId, user.id))
    .limit(1);
  return Boolean(row);
});

// Events on the dashboard home, soonest first, with their sales.
export async function getManagedEvents(
  user: DashboardUser,
): Promise<ManagedEvent[]> {
  const ids = await managedEventIds(user);
  if (ids?.length === 0) return [];

  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      startsAt: events.startsAt,
      venue: events.venue,
      isPublished: events.isPublished,
    })
    .from(events)
    .where(ids ? inArray(events.id, ids) : undefined)
    .orderBy(asc(events.startsAt));

  const stats = await getRaceStats(rows.map((r) => r.id));
  return rows.map((row) => ({
    ...row,
    startsAt: row.startsAt.toISOString(),
    stats: stats.get(row.id)!,
  }));
}

// The full event row (drafts included) if this user may manage it. Cached per
// request so layouts, pages and actions share one lookup.
export const getManagedEvent = cache(
  async (user: DashboardUser, slug: string) => {
    const row = await db.query.events.findFirst({
      where: eq(events.slug, slug),
      with: withRaces,
    });
    if (!row) return undefined;
    if (isAdmin(user)) return row;

    const [link] = await db
      .select({ eventId: eventOrganizers.eventId })
      .from(eventOrganizers)
      .where(
        and(
          eq(eventOrganizers.eventId, row.id),
          eq(eventOrganizers.userId, user.id),
        ),
      );
    return link ? row : undefined;
  },
);

export async function listOrganizers(eventId: string) {
  return db
    .select({ userId: users.id, name: users.name, email: users.email })
    .from(eventOrganizers)
    .innerJoin(users, eq(users.id, eventOrganizers.userId))
    .where(eq(eventOrganizers.eventId, eventId))
    .orderBy(asc(eventOrganizers.createdAt));
}

// "not-found" when nobody has signed up with that email yet.
export async function addOrganizerByEmail(eventId: string, email: string) {
  const [found] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()));
  if (!found) return "not-found" as const;

  await db
    .insert(eventOrganizers)
    .values({ eventId, userId: found.id })
    .onConflictDoNothing();
  await promoteToOrganizer(found.id);
  return "added" as const;
}

// Participant to organizer; admins and existing organizers are left alone.
export async function promoteToOrganizer(userId: string) {
  await db
    .update(users)
    .set({ role: "organizer" })
    .where(and(eq(users.id, userId), eq(users.role, "participant")));
}

// Refuses to remove the last organizer, so the event never ends up unowned.
export async function removeOrganizer(eventId: string, userId: string) {
  return db.transaction(async (tx) => {
    // Lock the event's organizer rows so two removals can't both pass the check.
    await tx
      .select({ userId: eventOrganizers.userId })
      .from(eventOrganizers)
      .where(eq(eventOrganizers.eventId, eventId))
      .for("update");
    const [{ total }] = await tx
      .select({ total: count() })
      .from(eventOrganizers)
      .where(eq(eventOrganizers.eventId, eventId));
    if (total <= 1) return false;

    await tx
      .delete(eventOrganizers)
      .where(
        and(
          eq(eventOrganizers.eventId, eventId),
          eq(eventOrganizers.userId, userId),
        ),
      );
    return true;
  });
}
