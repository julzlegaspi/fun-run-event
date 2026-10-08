import "server-only";

import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { defaultCommissionBps } from "@/db/queries/payouts";
import { events, orders, participants, races } from "@/db/schema";
import {
  getPaymentRequest,
  parseAmount,
  type PaymentRequestStatus,
} from "@/lib/hitpay";
import { commissionFor } from "@/lib/payouts";
import type { Order, OrderStatus, Participant } from "@/lib/registrations";

// Pending orders hold their spots until paid or closed. HitPay expires the
// payment request after 30 minutes; we give the webhook a few more.
const STALE_AFTER = sql`interval '35 minutes'`;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ClosedStatus = Extract<OrderStatus, "failed" | "expired" | "canceled">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ids arrive from URLs and webhooks; a malformed uuid would make Postgres throw.
export function isOrderId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

// Expire abandoned checkouts and put their spots back on sale.
async function releaseStaleOrders(tx: Tx) {
  await tx.execute(sql`
    with expired as (
      update ${orders}
      set status = 'expired', updated_at = now()
      where status = 'pending' and created_at < now() - ${STALE_AFTER}
      returning race_id, quantity
    )
    update ${races} r
    set spots_left = r.spots_left + e.quantity
    from (select race_id, sum(quantity)::int as quantity from expired group by race_id) e
    where r.id = e.race_id
  `);
}

// Reserve spots and record the order with its runners in one transaction.
// Returns undefined when the race no longer has enough spots.
export async function createOrder(input: {
  userId: string;
  eventId: string;
  raceId: string;
  participants: Participant[];
}) {
  const quantity = input.participants.length;

  return db.transaction(async (tx) => {
    await releaseStaleOrders(tx);

    const [race] = await tx
      .update(races)
      .set({ spotsLeft: sql`${races.spotsLeft} - ${quantity}` })
      .where(
        and(
          eq(races.id, input.raceId),
          eq(races.eventId, input.eventId),
          gte(races.spotsLeft, quantity),
        ),
      )
      .returning({ price: races.price });
    if (!race) return undefined;

    // Snapshot the platform's cut so later rate changes don't touch this order.
    const [event] = await tx
      .select({ commissionBps: events.commissionBps })
      .from(events)
      .where(eq(events.id, input.eventId));
    const total = race.price * quantity;
    const commission = commissionFor(total, event.commissionBps ?? defaultCommissionBps());

    const free = race.price === 0;
    const [order] = await tx
      .insert(orders)
      .values({
        userId: input.userId,
        eventId: input.eventId,
        raceId: input.raceId,
        quantity,
        unitPrice: race.price,
        total,
        commission,
        status: free ? "paid" : "pending",
        paidAt: free ? new Date() : null,
      })
      .returning({ id: orders.id, total: orders.total });

    await tx.insert(participants).values(
      input.participants.map((p, i) => ({
        ...p,
        orderId: order.id,
        position: i + 1,
      })),
    );

    return order;
  });
}

export async function attachPaymentRequest(
  orderId: string,
  paymentRequestId: string,
) {
  await db
    .update(orders)
    .set({ hitpayPaymentRequestId: paymentRequestId })
    .where(eq(orders.id, orderId));
}

// Idempotent: webhooks are retried and the order page may also reconcile.
export async function markOrderPaid(
  orderId: string,
  paymentId?: string | null,
) {
  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");
    if (!order || order.status === "paid") return;

    // Paid after we'd expired it: take the spots back if they're still there.
    // If the race has since sold out, the payment still stands; flag it.
    if (order.status !== "pending") {
      const reserved = await tx
        .update(races)
        .set({ spotsLeft: sql`${races.spotsLeft} - ${order.quantity}` })
        .where(
          and(eq(races.id, order.raceId), gte(races.spotsLeft, order.quantity)),
        )
        .returning({ id: races.id });
      if (!reserved.length) {
        console.warn(`Order ${order.id} paid after its race sold out`);
      }
    }

    await tx
      .update(orders)
      .set({
        status: "paid",
        paidAt: new Date(),
        hitpayPaymentId: paymentId ?? order.hitpayPaymentId,
      })
      .where(eq(orders.id, order.id));
  });
}

// Close a pending order and release its spots. No-op for any other status.
export async function closeOrder(orderId: string, status: ClosedStatus) {
  await db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({ status })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning({ raceId: orders.raceId, quantity: orders.quantity });
    if (!order) return;

    await tx
      .update(races)
      .set({ spotsLeft: sql`${races.spotsLeft} + ${order.quantity}` })
      .where(eq(races.id, order.raceId));
  });
}

// Apply a HitPay payment request status to its order.
export async function applyPaymentStatus(
  orderId: string,
  status: PaymentRequestStatus,
  paymentId?: string | null,
) {
  if (status === "completed") await markOrderPaid(orderId, paymentId);
  else if (status !== "pending") await closeOrder(orderId, status);
}

// What the webhook and reconciliation need: no user check, never sent to the client.
export async function getOrderPayment(orderId: string) {
  if (!isOrderId(orderId)) return undefined;
  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      paymentRequestId: orders.hitpayPaymentRequestId,
    })
    .from(orders)
    .where(eq(orders.id, orderId));
  return order;
}

// Ask HitPay for the status of a pending order and apply it. Used while the
// webhook may not have arrived yet; safe to call repeatedly.
export async function reconcileOrder(orderId: string) {
  const order = await getOrderPayment(orderId);
  if (order?.status !== "pending" || !order.paymentRequestId) return;
  try {
    const payment = await getPaymentRequest(order.paymentRequestId);
    const paid = payment.payments?.find((p) => p.status === "succeeded");
    if (payment.status === "completed" && parseAmount(payment.amount) !== order.total) {
      console.error(`HitPay amount mismatch on order ${order.id}`);
      return;
    }
    await applyPaymentStatus(order.id, payment.status, paid?.id);
  } catch (error) {
    console.error(error);
  }
}

export const withDetails = {
  event: true,
  race: true,
  participants: { orderBy: [asc(participants.position)] },
} satisfies { event: true; race: true; participants: object };

export type OrderRow = typeof orders.$inferSelect & {
  event: typeof events.$inferSelect;
  race: typeof races.$inferSelect;
  participants: (typeof participants.$inferSelect)[];
};

export function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    status: row.status,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    total: row.total,
    createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt?.toISOString(),
    event: {
      slug: row.event.slug,
      title: row.event.title,
      startsAt: row.event.startsAt.toISOString(),
      venue: row.event.venue,
    },
    race: { id: row.race.id, name: row.race.name, km: row.race.distanceKm },
    participants: row.participants.map((p) => ({
      fullName: p.fullName,
      email: p.email,
      phone: p.phone,
      birthdate: p.birthdate,
      gender: p.gender,
      shirtSize: p.shirtSize,
      emergencyName: p.emergencyName,
      emergencyPhone: p.emergencyPhone,
    })),
  };
}

export async function getOrderForUser(orderId: string, userId: string) {
  if (!isOrderId(orderId)) return undefined;
  const row = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    with: withDetails,
  });
  return row ? toOrder(row) : undefined;
}

// Abandoned and expired checkouts are noise on the account page.
export async function getOrdersForUser(userId: string) {
  const rows = await db.query.orders.findMany({
    where: and(
      eq(orders.userId, userId),
      inArray(orders.status, ["paid", "pending"]),
    ),
    with: withDetails,
    orderBy: [desc(orders.createdAt)],
  });
  return rows.map(toOrder);
}
