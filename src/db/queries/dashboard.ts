import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import { isOrderId, toOrder, withDetails } from "@/db/queries/registrations";
import {
  eventOrganizers,
  events,
  orders,
  participants,
  races,
  user as users,
} from "@/db/schema";
import type {
  DashboardParticipant,
  EventDraft,
  EventStats,
  OrderSummary,
  RaceDraft,
  RaceStats,
} from "@/lib/dashboard";
import { ageOn, type OrderStatus } from "@/lib/registrations";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Paid and pending orders hold spots; closed ones have released theirs.
const holdsSpots = sql`${orders.status} in ('paid', 'pending')`;

function emptyStats(): EventStats {
  return {
    runners: 0,
    pending: 0,
    revenue: 0,
    commission: 0,
    spotsLeft: 0,
    capacity: 0,
    races: [],
  };
}

// Per-race sales for each event, keyed by event id. Every requested event
// gets an entry, even with no races.
export async function getRaceStats(eventIds: string[]) {
  const result = new Map<string, EventStats>(
    eventIds.map((id) => [id, emptyStats()]),
  );
  if (!eventIds.length) return result;

  const rows = await db
    .select({
      eventId: races.eventId,
      raceId: races.id,
      name: races.name,
      km: races.distanceKm,
      price: races.price,
      spotsLeft: races.spotsLeft,
      runners: sql<number>`coalesce(sum(${orders.quantity}) filter (where ${orders.status} = 'paid'), 0)::int`,
      pending: sql<number>`coalesce(sum(${orders.quantity}) filter (where ${orders.status} = 'pending'), 0)::int`,
      revenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} = 'paid'), 0)::int`,
      commission: sql<number>`coalesce(sum(${orders.commission}) filter (where ${orders.status} = 'paid'), 0)::int`,
      orderCount: count(orders.id),
    })
    .from(races)
    .leftJoin(orders, eq(orders.raceId, races.id))
    .where(inArray(races.eventId, eventIds))
    .groupBy(races.id)
    .orderBy(asc(races.distanceKm));

  for (const row of rows) {
    const race: RaceStats = {
      raceId: row.raceId,
      name: row.name,
      km: row.km,
      price: row.price,
      runners: row.runners,
      pending: row.pending,
      revenue: row.revenue,
      commission: row.commission,
      spotsLeft: row.spotsLeft,
      capacity: row.spotsLeft + row.runners + row.pending,
      hasOrders: row.orderCount > 0,
    };
    const stats = result.get(row.eventId)!;
    stats.races.push(race);
    stats.runners += race.runners;
    stats.pending += race.pending;
    stats.revenue += race.revenue;
    stats.commission += race.commission;
    stats.spotsLeft += race.spotsLeft;
    stats.capacity += race.capacity;
  }
  return result;
}

export async function getEventStats(eventId: string) {
  return (await getRaceStats([eventId])).get(eventId)!;
}

// Confirmed runners only, for race kits. `raceId` narrows to one race.
export async function getParticipants(
  event: { id: string; startsAt: Date },
  raceId?: string,
): Promise<DashboardParticipant[]> {
  const rows = await db
    .select({
      orderId: orders.id,
      paidAt: orders.paidAt,
      raceName: races.name,
      p: participants,
    })
    .from(participants)
    .innerJoin(orders, eq(orders.id, participants.orderId))
    .innerJoin(races, eq(races.id, orders.raceId))
    .where(
      and(
        eq(orders.eventId, event.id),
        eq(orders.status, "paid"),
        raceId ? eq(orders.raceId, raceId) : undefined,
      ),
    )
    .orderBy(asc(races.distanceKm), asc(participants.fullName));

  const raceDay = event.startsAt.toISOString();
  return rows.map(({ orderId, paidAt, raceName, p }) => ({
    orderId,
    raceName,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    birthdate: p.birthdate,
    age: ageOn(p.birthdate, raceDay),
    gender: p.gender,
    shirtSize: p.shirtSize,
    emergencyName: p.emergencyName,
    emergencyPhone: p.emergencyPhone,
    paidAt: paidAt?.toISOString(),
  }));
}

// Latest 50 orders matching an order id prefix, the buyer's email, or a
// runner's name or email.
export async function searchOrders(
  eventId: string,
  filters: { q?: string; status?: OrderStatus },
): Promise<OrderSummary[]> {
  const q = filters.q?.trim().replace(/[\\%_]/g, "\\$&");

  const matches = await db
    .selectDistinct({ id: orders.id, createdAt: orders.createdAt })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .innerJoin(participants, eq(participants.orderId, orders.id))
    .where(
      and(
        eq(orders.eventId, eventId),
        filters.status ? eq(orders.status, filters.status) : undefined,
        q
          ? or(
              ilike(sql`${orders.id}::text`, `${q}%`),
              ilike(users.email, `%${q}%`),
              ilike(participants.fullName, `%${q}%`),
              ilike(participants.email, `%${q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(orders.createdAt))
    .limit(50);
  if (!matches.length) return [];

  const rows = await db.query.orders.findMany({
    where: inArray(
      orders.id,
      matches.map((m) => m.id),
    ),
    with: {
      race: { columns: { name: true } },
      user: { columns: { email: true } },
      participants: {
        columns: { fullName: true },
        orderBy: [asc(participants.position)],
      },
    },
    orderBy: [desc(orders.createdAt)],
  });

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    buyerEmail: row.user.email,
    raceName: row.race.name,
    quantity: row.quantity,
    total: row.total,
    createdAt: row.createdAt.toISOString(),
    runners: row.participants.map((p) => p.fullName),
  }));
}

// One order on this event, with the buyer and HitPay references.
export async function getEventOrder(eventId: string, orderId: string) {
  if (!isOrderId(orderId)) return undefined;
  const row = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.eventId, eventId)),
    with: {
      ...withDetails,
      user: { columns: { name: true, email: true } },
    },
  });
  if (!row) return undefined;
  return {
    ...toOrder(row),
    buyer: row.user,
    paymentRequestId: row.hitpayPaymentRequestId ?? undefined,
    paymentId: row.hitpayPaymentId ?? undefined,
  };
}

export async function countOrders(eventId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(orders)
    .where(eq(orders.eventId, eventId));
  return total;
}

// Expected failures surfaced to the form. Thrown inside a transaction so
// every earlier write rolls back. `field` is an event field name, or
// `races.{index}.{key}` for the race at that position in the drafts.
export class DashboardError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

// Postgres unique violation on events.slug.
function isSlugTaken(error: unknown) {
  const cause = (error as { cause?: { code?: string } })?.cause ?? error;
  return (cause as { code?: string })?.code === "23505";
}

// Who gets paid and the platform's cut; validated by the action.
export type EventPayoutSettings = {
  payoutAccountId: string | null;
  commissionBps: number | null;
};

function eventValues(draft: EventDraft, startsAt: Date, payout: EventPayoutSettings) {
  return {
    ...payout,
    slug: draft.slug,
    title: draft.title,
    category: draft.category,
    distanceLabel: draft.distance,
    startsAt,
    venue: draft.venue,
    area: draft.area,
    address: draft.address,
    imageUrl: draft.imageUrl,
    imageAlt: draft.imageAlt,
    status: draft.status ?? null,
    organizer: draft.organizer,
    about: draft.about,
    included: draft.included,
    isPublished: draft.isPublished,
    isFeatured: draft.isFeatured,
  };
}

function raceValues(race: RaceDraft) {
  return {
    name: race.name,
    distanceKm: race.km,
    price: race.price,
    startTime: race.startTime,
    cutoff: race.cutoff,
    minAge: race.minAge,
  };
}

// Upsert the event's races. Capacity isn't stored: spots left becomes
// capacity minus the spots held by paid and pending orders. Races locked
// first so a checkout can't reserve spots between the read and the write.
async function writeRaces(tx: Tx, eventId: string, drafts: RaceDraft[]) {
  const existing = await tx
    .select({ id: races.id })
    .from(races)
    .where(eq(races.eventId, eventId))
    .for("update");
  const held = await tx
    .select({
      raceId: orders.raceId,
      reserved: sql<number>`coalesce(sum(${orders.quantity}) filter (where ${holdsSpots}), 0)::int`,
      orderCount: count(),
    })
    .from(orders)
    .where(eq(orders.eventId, eventId))
    .groupBy(orders.raceId);
  const heldBy = new Map(held.map((h) => [h.raceId, h]));
  const existingIds = new Set(existing.map((r) => r.id));

  for (const [i, draft] of drafts.entries()) {
    if (!draft.id) {
      await tx.insert(races).values({
        ...raceValues(draft),
        eventId,
        spotsLeft: draft.capacity,
      });
      continue;
    }
    if (!existingIds.has(draft.id)) {
      throw new DashboardError("This race no longer exists. Reload the page.");
    }
    const reserved = heldBy.get(draft.id)?.reserved ?? 0;
    if (draft.capacity < reserved) {
      throw new DashboardError(
        `${reserved} spots are already taken in ${draft.name}.`,
        `races.${i}.capacity`,
      );
    }
    await tx
      .update(races)
      .set({ ...raceValues(draft), spotsLeft: draft.capacity - reserved })
      .where(eq(races.id, draft.id));
  }

  const kept = new Set(drafts.map((d) => d.id));
  const removed = existing.filter((r) => !kept.has(r.id)).map((r) => r.id);
  // Deleting a race cascades to its orders, so never remove one that has any.
  if (removed.some((id) => heldBy.has(id))) {
    throw new DashboardError(
      "A race with registrations can't be removed. Set its capacity to the number sold instead.",
    );
  }
  if (removed.length) await tx.delete(races).where(inArray(races.id, removed));
}

// New events start with their creator as organizer.
export async function createEvent(
  userId: string,
  draft: EventDraft,
  startsAt: Date,
  raceDrafts: RaceDraft[],
  payout: EventPayoutSettings,
) {
  try {
    return await db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(events)
        .values(eventValues(draft, startsAt, payout))
        .returning({ id: events.id });
      await writeRaces(tx, id, raceDrafts);
      await tx.insert(eventOrganizers).values({ eventId: id, userId });
      return id;
    });
  } catch (error) {
    if (isSlugTaken(error)) {
      throw new DashboardError("Another event already uses this URL.", "slug");
    }
    throw error;
  }
}

export async function updateEvent(
  eventId: string,
  draft: EventDraft,
  startsAt: Date,
  raceDrafts: RaceDraft[],
  payout: EventPayoutSettings,
) {
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(events)
        .set(eventValues(draft, startsAt, payout))
        .where(eq(events.id, eventId));
      await writeRaces(tx, eventId, raceDrafts);
    });
  } catch (error) {
    if (isSlugTaken(error)) {
      throw new DashboardError("Another event already uses this URL.", "slug");
    }
    throw error;
  }
}

// Only events nobody has registered for; deleting cascades to orders.
export async function deleteEvent(eventId: string) {
  return db.transaction(async (tx) => {
    await tx
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, eventId))
      .for("update");
    const [{ total }] = await tx
      .select({ total: count() })
      .from(orders)
      .where(eq(orders.eventId, eventId));
    if (total > 0) return false;
    await tx.delete(events).where(eq(events.id, eventId));
    return true;
  });
}
