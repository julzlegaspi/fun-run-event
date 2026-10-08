import { createHmac, timingSafeEqual } from "node:crypto";

import { applyTransferStatus } from "@/db/queries/payouts";
import {
  applyPaymentStatus,
  getOrderPayment,
} from "@/db/queries/registrations";
import {
  parseAmount,
  verifyWebhookSignature,
  type PaymentRequestStatus,
} from "@/lib/hitpay";

type PaymentEvent = {
  paymentRequestId?: string;
  paymentId?: string;
  referenceNumber?: string;
  status?: string;
  amount?: string;
  // Organizer payout status (`transfer.*` events).
  transfer?: { id: string; status: string };
};

const STATUSES: PaymentRequestStatus[] = [
  "pending",
  "completed",
  "failed",
  "expired",
  "canceled",
];

// JSON webhooks (dashboard-registered endpoints) carry a `Hitpay-Signature`
// header over the raw body.
function parseJson(raw: string, request: Request): PaymentEvent | null {
  if (!verifyWebhookSignature(raw, request.headers.get("hitpay-signature")))
    return null;
  const object = request.headers.get("hitpay-event-object");
  const body = JSON.parse(raw);
  if (object === "transfer" && typeof body.id === "string") {
    return { transfer: { id: body.id, status: String(body.status) } };
  }
  if (object && object !== "payment_request") return {};

  return {
    paymentRequestId: body.id,
    paymentId: body.payments?.find(
      (p: { status?: string }) => p.status === "succeeded",
    )?.id,
    referenceNumber: body.reference_number,
    status: body.status,
    amount: body.amount,
  };
}

// The per-request `webhook` URL gets a form post with an `hmac` field: the
// HMAC-SHA256 of every other field as key+value pairs sorted by key.
function parseForm(raw: string): PaymentEvent | null {
  const salt = process.env.HITPAY_SALT;
  const fields = new URLSearchParams(raw);
  const hmac = fields.get("hmac");
  if (!salt || !hmac) return null;
  fields.delete("hmac");

  const source = [...fields.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}${value}`)
    .join("");
  const expected = Buffer.from(
    createHmac("sha256", salt).update(source).digest("hex"),
  );
  const given = Buffer.from(hmac);
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return null;

  return {
    paymentRequestId: fields.get("payment_request_id") ?? undefined,
    paymentId: fields.get("payment_id") ?? undefined,
    referenceNumber: fields.get("reference_number") ?? undefined,
    status: fields.get("status") ?? undefined,
    amount: fields.get("amount") ?? undefined,
  };
}

export async function POST(request: Request) {
  const raw = await request.text();
  const isJson = request.headers
    .get("content-type")
    ?.includes("application/json");

  let event: PaymentEvent | null;
  try {
    event = isJson ? parseJson(raw, request) : parseForm(raw);
  } catch {
    return Response.json({ error: "Malformed payload" }, { status: 400 });
  }
  if (!event) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.transfer) {
    await applyTransferStatus(event.transfer.id, event.transfer.status);
    return Response.json({ received: true });
  }

  const status = STATUSES.find((s) => s === event.status);
  const order = event.referenceNumber
    ? await getOrderPayment(event.referenceNumber)
    : undefined;

  // Acknowledge anything we can't act on so HitPay stops retrying it.
  if (!order || !status) return Response.json({ received: true });

  if (
    order.paymentRequestId &&
    event.paymentRequestId &&
    order.paymentRequestId !== event.paymentRequestId
  ) {
    console.warn(`HitPay webhook for ${order.id} has an unknown payment request`);
    return Response.json({ received: true });
  }
  if (status === "completed" && parseAmount(event.amount) !== order.total) {
    console.error(
      `HitPay amount ${event.amount} doesn't match order ${order.id} total ${order.total}`,
    );
    return Response.json({ received: true });
  }

  await applyPaymentStatus(order.id, status, event.paymentId);
  return Response.json({ received: true });
}
