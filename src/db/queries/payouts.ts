import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  eventOrganizers,
  events,
  orders,
  payoutAccounts,
  payouts,
} from "@/db/schema";
import {
  createTransfer,
  deleteBeneficiary,
  HitPayError,
  type Beneficiary,
  type TransferStatus,
} from "@/lib/hitpay";
import {
  parsePercent,
  payoutAccountLabel,
  type EventBalance,
  type PayoutAccount,
  type PayoutRow,
  type PayoutStatus,
} from "@/lib/payouts";

// Platform default from PLATFORM_COMMISSION_PERCENT (e.g. "5"), else 5%.
export function defaultCommissionBps() {
  const raw = process.env.PLATFORM_COMMISSION_PERCENT;
  const bps = raw ? parsePercent(raw.trim()) : undefined;
  if (raw && bps === undefined) {
    throw new Error(`PLATFORM_COMMISSION_PERCENT must be 0–50, got "${raw}"`);
  }
  return bps ?? 500;
}

function toPayoutAccount(row: typeof payoutAccounts.$inferSelect): PayoutAccount {
  return {
    id: row.id,
    holderName: row.holderName,
    bankName: row.bankName,
    accountLast4: row.accountLast4,
  };
}

export async function getPayoutAccount(userId: string) {
  const row = await db.query.payoutAccounts.findFirst({
    where: eq(payoutAccounts.userId, userId),
  });
  return row ? toPayoutAccount(row) : undefined;
}

// Payout accounts of these users, for the event form's picker.
export async function getPayoutAccounts(userIds: string[]) {
  if (!userIds.length) return [];
  const rows = await db.query.payoutAccounts.findMany({
    where: inArray(payoutAccounts.userId, userIds),
  });
  return rows.map(toPayoutAccount);
}

// Saves (or replaces) the organizer's account after HitPay has created the
// beneficiary. Events paying the old account move to the new one.
export async function savePayoutAccount(
  userId: string,
  input: { holderName: string; bankCode: string; bankName: string; accountNumber: string },
  beneficiary: Beneficiary,
) {
  const values = {
    holderName: input.holderName,
    bankCode: input.bankCode,
    bankName: input.bankName,
    accountLast4: input.accountNumber.slice(-4),
    hitpayBeneficiaryId: beneficiary.id,
  };
  const old = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.userId, userId))
      .for("update");
    if (existing) {
      // Same row, new details: events and payout history keep pointing at it.
      await tx
        .update(payoutAccounts)
        .set(values)
        .where(eq(payoutAccounts.id, existing.id));
      return existing;
    }
    await tx.insert(payoutAccounts).values({ ...values, userId });
    return undefined;
  });

  // Best effort: a stale beneficiary in HitPay is harmless.
  if (old && old.hitpayBeneficiaryId !== beneficiary.id) {
    deleteBeneficiary(old.hitpayBeneficiaryId).catch((error) => console.error(error));
  }
}

// Events this organizer is linked to that have no payout account yet start
// paying theirs.
export async function claimUnassignedEvents(userId: string) {
  await db.execute(sql`
    update ${events} e
    set payout_account_id = pa.id
    from ${payoutAccounts} pa, ${eventOrganizers} eo
    where pa.user_id = ${userId}
      and eo.user_id = ${userId}
      and eo.event_id = e.id
      and e.payout_account_id is null
  `);
}

// Payouts that count against the balance: in flight or done.
const counts = sql`${payouts.status} in ('processing', 'paid')`;

// Takings and the unpaid balance for each event, soonest first.
export async function getEventBalances(eventIds?: string[]): Promise<EventBalance[]> {
  if (eventIds?.length === 0) return [];

  const sales = db
    .select({
      eventId: orders.eventId,
      gross: sql<number>`sum(${orders.total})::int`.as("gross"),
      commission: sql<number>`sum(${orders.commission})::int`.as("commission"),
    })
    .from(orders)
    .where(eq(orders.status, "paid"))
    .groupBy(orders.eventId)
    .as("sales");
  const sent = db
    .select({
      eventId: payouts.eventId,
      paidOut: sql<number>`coalesce(sum(${payouts.amount}) filter (where ${counts}), 0)::int`.as("paid_out"),
      processing: sql<boolean>`bool_or(${payouts.status} = 'processing')`.as("processing"),
    })
    .from(payouts)
    .groupBy(payouts.eventId)
    .as("sent");

  const rows = await db
    .select({
      eventId: events.id,
      slug: events.slug,
      title: events.title,
      startsAt: events.startsAt,
      gross: sql<number>`coalesce(${sales.gross}, 0)`,
      commission: sql<number>`coalesce(${sales.commission}, 0)`,
      paidOut: sql<number>`coalesce(${sent.paidOut}, 0)`,
      processing: sql<boolean>`coalesce(${sent.processing}, false)`,
      account: payoutAccounts,
    })
    .from(events)
    .leftJoin(sales, eq(sales.eventId, events.id))
    .leftJoin(sent, eq(sent.eventId, events.id))
    .leftJoin(payoutAccounts, eq(payoutAccounts.id, events.payoutAccountId))
    .where(eventIds ? inArray(events.id, eventIds) : undefined)
    .orderBy(events.startsAt);

  const now = Date.now();
  return rows.map((row) => {
    const net = row.gross - row.commission;
    const balance = net - row.paidOut;
    const ended = row.startsAt.getTime() < now;
    return {
      eventId: row.eventId,
      slug: row.slug,
      title: row.title,
      startsAt: row.startsAt.toISOString(),
      gross: row.gross,
      commission: row.commission,
      net,
      paidOut: row.paidOut,
      balance,
      processing: row.processing,
      payoutAccount: row.account ? toPayoutAccount(row.account) : undefined,
      ended,
      available: ended && Boolean(row.account) && balance >= 1 && !row.processing,
    };
  });
}

export async function getPayoutHistory(eventIds?: string[]): Promise<PayoutRow[]> {
  if (eventIds?.length === 0) return [];
  const rows = await db.query.payouts.findMany({
    where: eventIds ? inArray(payouts.eventId, eventIds) : undefined,
    with: { event: { columns: { title: true } } },
    orderBy: [desc(payouts.createdAt)],
    limit: 100,
  });
  return rows.map((row) => ({
    id: row.id,
    eventTitle: row.event.title,
    amount: row.amount,
    status: row.status,
    account: row.accountLabel,
    failureReason: row.failureReason ?? undefined,
    unconfirmed: row.status === "processing" && !row.hitpayTransferId,
    createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt?.toISOString(),
  }));
}

export class PayoutError extends Error {}

// Pay out an ended event's balance as one HitPay transfer. The event row lock
// makes concurrent clicks queue up; the second sees the processing payout.
export async function startPayout(eventId: string, adminId: string) {
  const payout = await db.transaction(async (tx) => {
    const [event] = await tx
      .select({ id: events.id, title: events.title, startsAt: events.startsAt })
      .from(events)
      .where(eq(events.id, eventId))
      .for("update");
    if (!event) throw new PayoutError("Event not found.");

    const balance = await getEventBalanceTx(tx, eventId);
    if (!balance.ended) throw new PayoutError("Payouts open after the event.");
    if (balance.processing) throw new PayoutError("A payout is already processing.");
    if (balance.balance < 1) throw new PayoutError("Nothing left to pay out.");

    const [account] = await tx
      .select()
      .from(payoutAccounts)
      .innerJoin(events, eq(events.payoutAccountId, payoutAccounts.id))
      .where(eq(events.id, eventId));
    if (!account) throw new PayoutError("The organizer hasn't added a payout account.");

    // Commission not yet covered by earlier payouts (late paid orders can
    // add to an event after its first payout).
    const commission = balance.commission - balance.commissionOut;
    const [row] = await tx
      .insert(payouts)
      .values({
        eventId,
        payoutAccountId: account.payout_accounts.id,
        accountLabel: payoutAccountLabel(toPayoutAccount(account.payout_accounts)),
        gross: balance.balance + commission,
        commission,
        amount: balance.balance,
        createdBy: adminId,
      })
      .returning();
    return {
      ...row,
      title: event.title,
      beneficiaryId: account.payout_accounts.hitpayBeneficiaryId,
    };
  });

  try {
    const transfer = await createTransfer({
      beneficiaryId: payout.beneficiaryId,
      amount: payout.amount,
      reference: payout.id,
      remark: `Fun Run payout: ${payout.title}`,
    });
    await db
      .update(payouts)
      .set({ hitpayTransferId: transfer.id })
      .where(eq(payouts.id, payout.id));
    await applyTransferStatus(transfer.id, transfer.status);
  } catch (error) {
    console.error(error);
    // Only a 4xx means HitPay refused it. Anything else (timeout, 5xx) may
    // have gone through, so the payout stays processing (blocking a second
    // one) until an admin checks HitPay and resolves it.
    const rejected = error instanceof HitPayError && error.status < 500;
    const reason = rejected
      ? error.message
      : "Unconfirmed: check HitPay's Transfers page before resolving.";
    await db
      .update(payouts)
      .set(rejected ? { status: "failed", failureReason: reason } : { failureReason: reason })
      .where(eq(payouts.id, payout.id));
    throw new PayoutError(reason);
  }
}

// For an unconfirmed payout (no HitPay transfer id): once an admin has
// checked HitPay, record whether the money went out.
export async function resolveUnconfirmedPayout(payoutId: string, sent: boolean) {
  await db
    .update(payouts)
    .set(
      sent
        ? { status: "paid", paidAt: new Date(), failureReason: "Confirmed manually in HitPay." }
        : { status: "failed", failureReason: "Not found in HitPay; marked failed." },
    )
    .where(
      and(
        eq(payouts.id, payoutId),
        eq(payouts.status, "processing"),
        sql`${payouts.hitpayTransferId} is null`,
      ),
    );
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Balance for one event inside a transaction (after its row is locked).
async function getEventBalanceTx(tx: Tx, eventId: string) {
  const [sales] = await tx
    .select({
      gross: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      commission: sql<number>`coalesce(sum(${orders.commission}), 0)::int`,
    })
    .from(orders)
    .where(and(eq(orders.eventId, eventId), eq(orders.status, "paid")));
  const [sent] = await tx
    .select({
      paidOut: sql<number>`coalesce(sum(${payouts.amount}) filter (where ${counts}), 0)::int`,
      commissionOut: sql<number>`coalesce(sum(${payouts.commission}) filter (where ${counts}), 0)::int`,
      processing: sql<boolean>`coalesce(bool_or(${payouts.status} = 'processing'), false)`,
    })
    .from(payouts)
    .where(eq(payouts.eventId, eventId));
  const [event] = await tx
    .select({ startsAt: events.startsAt })
    .from(events)
    .where(eq(events.id, eventId));
  return {
    commission: sales.commission,
    commissionOut: sent.commissionOut,
    balance: sales.gross - sales.commission - sent.paidOut,
    processing: sent.processing,
    ended: event.startsAt.getTime() < Date.now(),
  };
}

const TRANSFER_STATUS: Record<TransferStatus, PayoutStatus> = {
  scheduled: "processing",
  processing: "processing",
  paid: "paid",
  failed: "failed",
  canceled: "canceled",
};

// Idempotent: webhooks retry, and a paid or closed payout never reopens.
export async function applyTransferStatus(transferId: string, status: string) {
  const next = TRANSFER_STATUS[status as TransferStatus];
  if (!next || next === "processing") return;
  await db
    .update(payouts)
    .set({
      status: next,
      paidAt: next === "paid" ? new Date() : undefined,
      failureReason: next === "failed" ? "HitPay reported the transfer failed." : undefined,
    })
    .where(and(eq(payouts.hitpayTransferId, transferId), eq(payouts.status, "processing")));
}
