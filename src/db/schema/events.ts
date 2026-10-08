import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Relative import: drizzle-kit loads this file without the `@/` path alias.
import { EVENT_CATEGORIES, EVENT_STATUSES } from "../../lib/events";
import { eventOrganizers } from "./organizers";
import { payoutAccounts, payouts } from "./payouts";

export const eventCategory = pgEnum("event_category", EVENT_CATEGORIES);
export const eventStatus = pgEnum("event_status", EVENT_STATUSES);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    category: eventCategory("category").notNull(),
    // Headline distance shown on cards, e.g. "21.1 km".
    distanceLabel: text("distance_label").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    venue: text("venue").notNull(),
    area: text("area").notNull(),
    address: text("address").notNull(),
    imageUrl: text("image_url").notNull(),
    imageAlt: text("image_alt").notNull(),
    status: eventStatus("status"),
    organizer: text("organizer").notNull(),
    about: text("about").array().notNull().default(sql`'{}'::text[]`),
    included: text("included").array().notNull().default(sql`'{}'::text[]`),
    isFeatured: boolean("is_featured").notNull().default(false),
    // Drafts are only visible in the organizer dashboard.
    isPublished: boolean("is_published").notNull().default(false),
    // Where the organizer's share goes; unset until an organizer adds one.
    payoutAccountId: uuid("payout_account_id").references(
      () => payoutAccounts.id,
      { onDelete: "set null" },
    ),
    // Platform commission in basis points; null = PLATFORM_COMMISSION_PERCENT.
    commissionBps: integer("commission_bps"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("events_starts_at_idx").on(table.startsAt),
    check(
      "events_commission_bps_check",
      sql`${table.commissionBps} between 0 and 5000`,
    ),
  ],
);

// One distance option within an event, each with its own ticket.
export const races = pgTable(
  "races",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    distanceKm: numeric("distance_km", {
      precision: 5,
      scale: 2,
      mode: "number",
    }).notNull(),
    price: integer("price").notNull(), // whole PHP, 0 = free
    startTime: time("start_time").notNull(),
    cutoff: text("cutoff").notNull(),
    minAge: integer("min_age").notNull().default(0), // 0 = all ages
    spotsLeft: integer("spots_left").notNull(),
  },
  (table) => [
    index("races_event_id_idx").on(table.eventId),
    check("races_price_check", sql`${table.price} >= 0`),
    check("races_spots_left_check", sql`${table.spotsLeft} >= 0`),
  ],
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  races: many(races),
  organizers: many(eventOrganizers),
  payouts: many(payouts),
  payoutAccount: one(payoutAccounts, {
    fields: [events.payoutAccountId],
    references: [payoutAccounts.id],
  }),
}));

export const racesRelations = relations(races, ({ one }) => ({
  event: one(events, { fields: [races.eventId], references: [events.id] }),
}));
