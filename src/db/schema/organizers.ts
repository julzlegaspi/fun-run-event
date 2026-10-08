import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Relative imports: drizzle-kit loads this file without the `@/` path alias.
import { user } from "./auth";
import { events } from "./events";

// Users who can manage an event in the dashboard. Admins can manage any event
// without a row here.
export const eventOrganizers = pgTable(
  "event_organizers",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.userId] }),
    index("event_organizers_user_id_idx").on(table.userId),
  ],
);

export const eventOrganizersRelations = relations(
  eventOrganizers,
  ({ one }) => ({
    event: one(events, {
      fields: [eventOrganizers.eventId],
      references: [events.id],
    }),
    user: one(user, {
      fields: [eventOrganizers.userId],
      references: [user.id],
    }),
  }),
);
