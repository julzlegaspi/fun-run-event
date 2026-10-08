// Organizer dashboard types and helpers shared by server and client
// components. Like src/lib/events.ts, this module must never import "@/db".

import { formatMoney, type EventCategory, type EventStatus } from "@/lib/events";
import type { OrderStatus } from "@/lib/registrations";

// Participants register for runs; organizers also create and manage their own
// events; admins manage every event and can feature them.
export const USER_ROLES = ["participant", "organizer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isAdmin(user: { role?: string | null }) {
  return user.role === "admin";
}

// Can create events (admins included).
export function isOrganizer(user: { role?: string | null }) {
  return user.role === "organizer" || isAdmin(user);
}

// Sales for one race. `capacity` is derived: spots left plus spots held by
// paid and pending orders.
export type RaceStats = {
  raceId: string;
  name: string;
  km: number;
  price: number;
  runners: number; // paid
  pending: number; // runners on orders awaiting payment
  revenue: number; // PHP, paid orders only
  commission: number; // platform's cut of revenue
  spotsLeft: number;
  capacity: number;
  hasOrders: boolean; // any order at all, so the race can't be deleted
};

export type EventStats = {
  runners: number;
  pending: number;
  revenue: number;
  commission: number;
  spotsLeft: number;
  capacity: number;
  races: RaceStats[];
};

export type ManagedEvent = {
  id: string;
  slug: string;
  title: string;
  startsAt: string; // ISO 8601
  venue: string;
  isPublished: boolean;
  stats: EventStats;
};

// Everything the edit form needs, including fields RunEvent leaves out.
export type EventDraft = {
  slug: string;
  title: string;
  category: EventCategory;
  distance: string;
  startsAt: string; // "YYYY-MM-DDTHH:mm" in Manila time, for <input type="datetime-local">
  venue: string;
  area: string;
  address: string;
  imageUrl: string;
  imageAlt: string;
  status?: EventStatus;
  organizer: string;
  about: string[];
  included: string[];
  isPublished: boolean;
  isFeatured: boolean;
  payoutAccountId?: string;
  commissionPercent?: string; // admins only; blank = platform default
};

export type RaceDraft = {
  id?: string;
  name: string;
  km: number;
  price: number;
  startTime: string; // "HH:mm"
  cutoff: string;
  minAge: number;
  capacity: number;
};

export type DashboardParticipant = {
  orderId: string;
  raceName: string;
  fullName: string;
  email: string;
  phone: string;
  birthdate: string;
  age: number; // on race day
  gender: string;
  shirtSize: string;
  emergencyName: string;
  emergencyPhone: string;
  paidAt?: string;
};

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  buyerEmail: string;
  raceName: string;
  quantity: number;
  total: number;
  createdAt: string;
  runners: string[]; // full names
};

// Same field-error shape as checkout. Race fields are `race{index}_{key}`.
export type DashboardFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export const RACE_FIELDS = [
  "id",
  "name",
  "km",
  "price",
  "startTime",
  "cutoff",
  "minAge",
  "capacity",
] as const;

export function raceField(index: number, key: (typeof RACE_FIELDS)[number]) {
  return `race${index}_${key}`;
}

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Event times are entered and shown in Manila time (UTC+8, no DST).
export function toManilaInput(iso: string) {
  const d = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

export function fromManilaInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}:00+08:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function dashboardHref(slug?: string, tab?: "participants" | "orders" | "edit") {
  if (!slug) return "/dashboard";
  return `/dashboard/events/${slug}${tab ? `/${tab}` : ""}`;
}

export function percent(part: number, whole: number) {
  return whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0;
}

export function formatCount(n: number) {
  return n.toLocaleString("en-PH");
}

// formatMoney shows 0 as "Free", which reads wrong for takings.
export function formatRevenue(amount: number) {
  return amount === 0 ? "₱0" : formatMoney(amount);
}
