import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Relative imports: drizzle-kit loads this file without the `@/` path alias.
import { GENDERS, ORDER_STATUSES, SHIRT_SIZES } from "../../lib/registrations";
import { user } from "./auth";
import { events, races } from "./events";

export const orderStatus = pgEnum("order_status", ORDER_STATUSES);
export const shirtSize = pgEnum("shirt_size", SHIRT_SIZES);
export const gender = pgEnum("gender", GENDERS);

// One checkout: some number of runners in a single race, paid together.
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    raceId: uuid("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(), // whole PHP at time of checkout
    total: integer("total").notNull(), // whole PHP, 0 = free
    // Platform's cut in whole PHP, fixed at checkout from the event's rate.
    commission: integer("commission").notNull().default(0),
    status: orderStatus("status").notNull().default("pending"),
    hitpayPaymentRequestId: text("hitpay_payment_request_id").unique(),
    hitpayPaymentId: text("hitpay_payment_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_created_at_idx").on(table.status, table.createdAt),
    check(
      "orders_quantity_check",
      sql`${table.quantity} between 1 and 6`,
    ),
    check("orders_unit_price_check", sql`${table.unitPrice} >= 0`),
    check(
      "orders_total_check",
      sql`${table.total} = ${table.unitPrice} * ${table.quantity}`,
    ),
    check(
      "orders_commission_check",
      sql`${table.commission} between 0 and ${table.total}`,
    ),
  ],
);

// A runner on an order, with the details the organiser needs for race kits.
export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    position: integer("position").notNull(), // 1-based order on the form
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    birthdate: date("birthdate").notNull(),
    gender: gender("gender").notNull(),
    shirtSize: shirtSize("shirt_size").notNull(),
    emergencyName: text("emergency_name").notNull(),
    emergencyPhone: text("emergency_phone").notNull(),
  },
  (table) => [index("participants_order_id_idx").on(table.orderId)],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  event: one(events, { fields: [orders.eventId], references: [events.id] }),
  race: one(races, { fields: [orders.raceId], references: [races.id] }),
  participants: many(participants),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  order: one(orders, {
    fields: [participants.orderId],
    references: [orders.id],
  }),
}));
