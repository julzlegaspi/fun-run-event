// Organizer payout types and helpers shared by server and client components.
// Like src/lib/events.ts, this module must never import "@/db".
//
// Registrations are paid into the platform's HitPay account. After an event,
// an admin releases the organizer's share (paid orders minus the commission
// snapshotted on each order) as one HitPay transfer to their bank.

export const PAYOUT_STATUSES = [
  "processing",
  "paid",
  "failed",
  "canceled",
] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

// Commission rates are basis points: 500 = 5%. Capped by a check constraint.
export const MAX_COMMISSION_BPS = 5000;

// Whole pesos, like every other amount. Free orders pay no commission.
export function commissionFor(total: number, bps: number) {
  return Math.round((total * bps) / 10_000);
}

export function formatPercent(bps: number) {
  return `${(bps / 100).toLocaleString("en-PH", { maximumFractionDigits: 2 })}%`;
}

// "5" or "2.5" (percent) to basis points; undefined if out of range.
export function parsePercent(value: string) {
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(value)) return undefined;
  const bps = Math.round(Number(value) * 100);
  return bps <= MAX_COMMISSION_BPS ? bps : undefined;
}

export type PayoutAccount = {
  id: string;
  holderName: string;
  bankName: string;
  accountLast4: string;
};

export function payoutAccountLabel(account: PayoutAccount) {
  return `${account.holderName} · ${account.bankName} ••${account.accountLast4}`;
}

export type Bank = { value: string; label: string };

// One event's takings and what's still owed to its organizer.
export type EventBalance = {
  eventId: string;
  slug: string;
  title: string;
  startsAt: string; // ISO 8601
  gross: number; // paid orders
  commission: number;
  net: number; // gross - commission
  paidOut: number; // payouts processing or paid
  balance: number; // net - paidOut
  processing: boolean;
  payoutAccount?: PayoutAccount;
  ended: boolean;
  available: boolean; // admins can release it now
};

export type PayoutRow = {
  id: string;
  eventTitle: string;
  amount: number;
  status: PayoutStatus;
  account: string; // payoutAccountLabel at the time of the payout
  failureReason?: string;
  unconfirmed: boolean; // processing with no HitPay transfer id
  createdAt: string;
  paidAt?: string;
};

export const payoutStatusLabel: Record<PayoutStatus, string> = {
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  canceled: "Canceled",
};

export const payoutStatusBadge: Record<PayoutStatus, string> = {
  processing: "badge-warning",
  paid: "badge-success",
  failed: "badge-danger",
  canceled: "",
};
