import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Relative imports: drizzle-kit loads this file without the `@/` path alias.
import { PAYOUT_STATUSES } from "../../lib/payouts";
import { user } from "./auth";
import { events } from "./events";

export const payoutStatus = pgEnum("payout_status", PAYOUT_STATUSES);

// An organizer's bank account, saved in HitPay as a transfer beneficiary.
// HitPay holds the full account number; we keep the last four for display.
export const payoutAccounts = pgTable("payout_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  holderName: text("holder_name").notNull(),
  bankCode: text("bank_code").notNull(),
  bankName: text("bank_name").notNull(),
  accountLast4: text("account_last4").notNull(),
  hitpayBeneficiaryId: text("hitpay_beneficiary_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// One HitPay transfer of an event's takings to its payout account. Amounts
// are whole PHP and fixed when the payout starts.
export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    // Null once the organizer replaces the account; the label keeps history.
    payoutAccountId: uuid("payout_account_id").references(
      () => payoutAccounts.id,
      { onDelete: "set null" },
    ),
    accountLabel: text("account_label").notNull(),
    gross: integer("gross").notNull(),
    commission: integer("commission").notNull(),
    amount: integer("amount").notNull(),
    status: payoutStatus("status").notNull().default("processing"),
    hitpayTransferId: text("hitpay_transfer_id").unique(),
    failureReason: text("failure_reason"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
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
    index("payouts_event_id_idx").on(table.eventId),
    check("payouts_amount_check", sql`${table.amount} >= 1`),
    check(
      "payouts_net_check",
      sql`${table.amount} = ${table.gross} - ${table.commission}`,
    ),
  ],
);

export const payoutAccountsRelations = relations(payoutAccounts, ({ one }) => ({
  user: one(user, { fields: [payoutAccounts.userId], references: [user.id] }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  event: one(events, { fields: [payouts.eventId], references: [events.id] }),
  payoutAccount: one(payoutAccounts, {
    fields: [payouts.payoutAccountId],
    references: [payoutAccounts.id],
  }),
}));
