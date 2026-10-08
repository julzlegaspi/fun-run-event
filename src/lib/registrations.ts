// Registration (order) types and option lists shared by server and client
// components. Like src/lib/events.ts, this module must never import "@/db".

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "failed",
  "expired",
  "canceled",
] as const;

export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const GENDERS = ["Female", "Male", "Other"] as const;

// Matches the ticket picker's cap and the `orders_quantity_check` constraint.
export const MAX_RUNNERS = 6;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type ShirtSize = (typeof SHIRT_SIZES)[number];
export type Gender = (typeof GENDERS)[number];

export type Participant = {
  fullName: string;
  email: string;
  phone: string;
  birthdate: string; // YYYY-MM-DD
  gender: Gender;
  shirtSize: ShirtSize;
  emergencyName: string;
  emergencyPhone: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  quantity: number;
  unitPrice: number; // PHP
  total: number; // PHP, 0 = free
  createdAt: string; // ISO 8601
  paidAt?: string;
  event: { slug: string; title: string; startsAt: string; venue: string };
  race: { id: string; name: string; km: number };
  participants: Participant[];
};

// Returned to `useActionState` by the checkout action. Field names are
// `r{index}_{key}`, e.g. `r0_fullName`, so `fieldErrors` and `values` use them too.
export type CheckoutFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export const PARTICIPANT_FIELDS = [
  "fullName",
  "email",
  "phone",
  "birthdate",
  "gender",
  "shirtSize",
  "emergencyName",
  "emergencyPhone",
] as const satisfies readonly (keyof Participant)[];

export function runnerField(index: number, key: keyof Participant) {
  return `r${index}_${key}`;
}

// Whole years old on `on` (both as YYYY-MM-DD or ISO strings).
export function ageOn(birthdate: string, on: string) {
  const [by, bm, bd] = birthdate.slice(0, 10).split("-").map(Number);
  const [y, m, d] = on.slice(0, 10).split("-").map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Confirmed",
  failed: "Payment failed",
  expired: "Expired",
  canceled: "Canceled",
};

export const orderStatusBadge: Record<OrderStatus, string> = {
  pending: "badge-warning",
  paid: "badge-success",
  failed: "badge-danger",
  expired: "badge",
  canceled: "badge",
};

export function orderHref(order: Pick<Order, "id">) {
  return `/orders/${order.id}`;
}

export function checkoutHref(slug: string, raceId: string, quantity: number) {
  return `/events/${slug}/checkout?race=${raceId}&qty=${quantity}`;
}
