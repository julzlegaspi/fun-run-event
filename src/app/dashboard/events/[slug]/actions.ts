"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createEvent,
  DashboardError,
  deleteEvent,
  type EventPayoutSettings,
  getEventOrder,
  updateEvent,
} from "@/db/queries/dashboard";
import {
  addOrganizerByEmail,
  listOrganizers,
  removeOrganizer,
} from "@/db/queries/organizers";
import { getPayoutAccounts } from "@/db/queries/payouts";
import { reconcileOrder } from "@/db/queries/registrations";
import { field, isEmail } from "@/lib/auth-form";
import {
  dashboardHref,
  fromManilaInput,
  isAdmin,
  isOrganizer,
  RACE_FIELDS,
  raceField,
  SLUG,
  slugify,
  type DashboardFormState,
  type EventDraft,
  type RaceDraft,
} from "@/lib/dashboard";
import {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  eventHref,
  unsplash,
} from "@/lib/events";
import { parsePercent } from "@/lib/payouts";
import { requireEventManager, requireSession } from "@/lib/session";

const EVENT_FIELDS = [
  "title",
  "slug",
  "category",
  "distance",
  "startsAt",
  "venue",
  "area",
  "address",
  "imageUrl",
  "imageAlt",
  "status",
  "organizer",
  "about",
  "included",
  "payoutAccountId",
  "commissionPercent",
] as const;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_CAPACITY = 100_000;

function oneOf<T extends string>(list: readonly T[], value: string) {
  return list.find((item) => item === value);
}

// Multi-line text field, without trimming away the line breaks.
function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

// Any images.unsplash.com photo URL, rebuilt with the query next.config.ts allows.
function unsplashImage(value: string) {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/(photo-[\w-]+)$/);
    if (url.hostname !== "images.unsplash.com" || !match) return undefined;
    return unsplash(match[1].slice("photo-".length));
  } catch {
    return undefined;
  }
}

function wholeNumber(value: string, min: number, max: number) {
  const n = Number(value);
  return value !== "" && Number.isInteger(n) && n >= min && n <= max
    ? n
    : undefined;
}

// Validate the event form. Race rows are posted as `race{key}_{field}`, where
// `key` is a stable per-row number from the races editor (not a position).
function parseEventForm(formData: FormData) {
  const values: Record<string, string> = {};
  const fieldErrors: Record<string, string> = {};
  const error = (name: string, message: string) => {
    fieldErrors[name] ??= message;
  };

  const raw = Object.fromEntries(
    EVENT_FIELDS.map((name) => {
      const value =
        name === "about" || name === "included"
          ? text(formData, name)
          : field(formData, name);
      values[name] = value;
      return [name, value];
    }),
  ) as Record<(typeof EVENT_FIELDS)[number], string>;
  const isPublished = formData.get("isPublished") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  values.isPublished = isPublished ? "on" : "";
  values.isFeatured = isFeatured ? "on" : "";

  if (!raw.title) error("title", "Enter the event name.");
  else if (raw.title.length > 120) error("title", "Keep the name under 120 characters.");
  const slug = raw.slug || slugify(raw.title);
  if (!SLUG.test(slug) || slug.length > 80 || slug === "new") {
    error("slug", "Use lowercase letters, numbers and dashes.");
  }
  const category = oneOf(EVENT_CATEGORIES, raw.category);
  if (!category) error("category", "Choose a category.");
  if (!raw.distance) error("distance", "Enter the headline distance, e.g. 10 km.");
  const startsAt = fromManilaInput(raw.startsAt);
  if (!startsAt) error("startsAt", "Enter the date and start time.");
  if (!raw.venue) error("venue", "Enter the venue.");
  if (!raw.area) error("area", "Enter the city or area.");
  if (!raw.address) error("address", "Enter the address.");
  const imageUrl = unsplashImage(raw.imageUrl);
  if (!imageUrl) {
    error("imageUrl", "Paste an images.unsplash.com/photo-… image address.");
  }
  if (!raw.imageAlt) error("imageAlt", "Describe the photo for screen readers.");
  const status = raw.status ? oneOf(EVENT_STATUSES, raw.status) : undefined;
  if (raw.status && !status) error("status", "Choose a label.");
  if (!raw.organizer) error("organizer", "Enter the organizer's public name.");

  const keys = [
    ...new Set(
      [...formData.keys()]
        .map((name) => name.match(/^race(\d+)_name$/)?.[1])
        .filter((key): key is string => key !== undefined),
    ),
  ]
    .map(Number)
    .sort((a, b) => a - b);
  if (!keys.length) error("races", "Add at least one race.");

  const races: RaceDraft[] = [];
  for (const key of keys) {
    const r = Object.fromEntries(
      RACE_FIELDS.map((name) => {
        const value = field(formData, raceField(key, name));
        values[raceField(key, name)] = value;
        return [name, value];
      }),
    ) as Record<(typeof RACE_FIELDS)[number], string>;
    const raceError = (name: (typeof RACE_FIELDS)[number], message: string) =>
      error(raceField(key, name), message);

    if (!r.name) raceError("name", "Enter the race name.");
    const km = Number(r.km);
    if (!r.km || !(km > 0 && km < 1000) || Math.round(km * 100) !== km * 100) {
      raceError("km", "Enter a distance in km, e.g. 21.1.");
    }
    const price = wholeNumber(r.price, 0, 1_000_000);
    if (price === undefined) raceError("price", "Enter a whole peso amount (0 = free).");
    if (!TIME.test(r.startTime)) raceError("startTime", "Enter the flag-off time.");
    if (!r.cutoff) raceError("cutoff", "Enter the cut-off, e.g. 3 hours.");
    const minAge = wholeNumber(r.minAge || "0", 0, 99);
    if (minAge === undefined) raceError("minAge", "Enter an age from 0 to 99.");
    const capacity = wholeNumber(r.capacity, 0, MAX_CAPACITY);
    if (capacity === undefined) raceError("capacity", "Enter the number of spots.");

    if (price !== undefined && minAge !== undefined && capacity !== undefined) {
      races.push({
        id: r.id || undefined,
        name: r.name,
        km,
        price,
        startTime: r.startTime,
        cutoff: r.cutoff,
        minAge,
        capacity,
      });
    }
  }

  if (Object.keys(fieldErrors).length || !category || !startsAt || !imageUrl) {
    return { ok: false, fieldErrors, values } as const;
  }

  const draft: EventDraft = {
    slug,
    title: raw.title,
    category,
    distance: raw.distance,
    startsAt: raw.startsAt,
    venue: raw.venue,
    area: raw.area,
    address: raw.address,
    imageUrl,
    imageAlt: raw.imageAlt,
    status,
    organizer: raw.organizer,
    about: raw.about.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean),
    included: raw.included.split("\n").map((line) => line.trim()).filter(Boolean),
    isPublished,
    isFeatured,
    payoutAccountId: raw.payoutAccountId || undefined,
    commissionPercent: raw.commissionPercent,
  };
  return { ok: true, draft, startsAt, races, keys, values } as const;
}

// Turn a DashboardError into form state, mapping race positions back to rows.
function failure(
  error: unknown,
  values: Record<string, string>,
  keys: number[],
): DashboardFormState {
  if (!(error instanceof DashboardError)) throw error;
  let name = error.field;
  const race = name?.match(/^races\.(\d+)\.(\w+)$/);
  if (race) name = raceField(keys[Number(race[1])], race[2] as (typeof RACE_FIELDS)[number]);
  return {
    error: error.message,
    fieldErrors: name ? { [name]: error.message } : undefined,
    values,
  };
}

function revalidateEvent(slug: string) {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(eventHref({ slug }));
  revalidatePath("/dashboard", "layout");
}

const CHECK_FIELDS = "Check the highlighted fields.";

// The payout account must belong to one of the event's organizers, and only
// admins set the commission (others keep `currentBps`).
async function payoutSettings(
  draft: EventDraft,
  organizerIds: string[],
  admin: boolean,
  currentBps: number | null,
): Promise<
  | { error: Record<string, string>; settings?: undefined }
  | { error?: undefined; settings: EventPayoutSettings }
> {
  const accounts = await getPayoutAccounts(organizerIds);
  const accountId = draft.payoutAccountId ?? null;
  if (accountId && !accounts.some((a) => a.id === accountId)) {
    return { error: { payoutAccountId: "Choose one of the organizers' payout accounts." } };
  }
  if (!admin) return { settings: { payoutAccountId: accountId, commissionBps: currentBps } };

  const percent = draft.commissionPercent?.trim() ?? "";
  const bps = percent ? parsePercent(percent) : null;
  if (bps === undefined) {
    return { error: { commissionPercent: "Enter a percentage from 0 to 50, e.g. 5 or 7.5." } };
  }
  return { settings: { payoutAccountId: accountId, commissionBps: bps } };
}

export async function createEventAction(
  _prev: DashboardFormState,
  formData: FormData,
): Promise<DashboardFormState> {
  const { user } = await requireSession("/dashboard/events/new");
  if (!isOrganizer(user)) return { error: "Only organizers can create events." };

  const parsed = parseEventForm(formData);
  if (!parsed.ok) {
    return { error: CHECK_FIELDS, fieldErrors: parsed.fieldErrors, values: parsed.values };
  }
  const { draft, startsAt, races, keys, values } = parsed;
  // Featuring changes the homepage, so only admins can set it.
  if (!isAdmin(user)) draft.isFeatured = false;
  const payout = await payoutSettings(draft, [user.id], isAdmin(user), null);
  if (payout.error) return { error: CHECK_FIELDS, fieldErrors: payout.error, values };

  try {
    await createEvent(user.id, draft, startsAt, races, payout.settings);
  } catch (error) {
    return failure(error, values, keys);
  }
  revalidateEvent(draft.slug);
  redirect(dashboardHref(draft.slug));
}

export async function updateEventAction(
  _prev: DashboardFormState,
  formData: FormData,
): Promise<DashboardFormState> {
  const currentSlug = field(formData, "currentSlug");
  const { session, event } = await requireEventManager(
    currentSlug,
    dashboardHref(currentSlug, "edit"),
  );

  const parsed = parseEventForm(formData);
  if (!parsed.ok) {
    return { error: CHECK_FIELDS, fieldErrors: parsed.fieldErrors, values: parsed.values };
  }
  const { draft, startsAt, races, keys, values } = parsed;

  // A live event's URL is shared and indexed, so it stays put.
  if (event.isPublished && draft.slug !== event.slug) {
    return {
      error: "Unpublish the event before changing its URL.",
      fieldErrors: { slug: "Fixed while the event is live." },
      values,
    };
  }
  // Featuring changes the homepage, so only admins can toggle it.
  if (!isAdmin(session.user)) draft.isFeatured = event.isFeatured;
  const organizers = await listOrganizers(event.id);
  const payout = await payoutSettings(
    draft,
    organizers.map((o) => o.userId),
    isAdmin(session.user),
    event.commissionBps,
  );
  if (payout.error) return { error: CHECK_FIELDS, fieldErrors: payout.error, values };

  try {
    await updateEvent(event.id, draft, startsAt, races, payout.settings);
  } catch (error) {
    return failure(error, values, keys);
  }
  revalidateEvent(event.slug);
  if (draft.slug !== event.slug) {
    revalidateEvent(draft.slug);
    redirect(dashboardHref(draft.slug, "edit"));
  }
  return { success: "Saved." };
}

export async function deleteEventAction(
  _prev: DashboardFormState,
  formData: FormData,
): Promise<DashboardFormState> {
  const slug = field(formData, "slug");
  const { event } = await requireEventManager(slug, dashboardHref(slug, "edit"));
  if (!(await deleteEvent(event.id))) {
    return { error: "This event has orders, so it can't be deleted. Unpublish it instead." };
  }
  revalidateEvent(slug);
  redirect("/dashboard");
}

export async function addOrganizerAction(
  _prev: DashboardFormState,
  formData: FormData,
): Promise<DashboardFormState> {
  const slug = field(formData, "slug");
  const email = field(formData, "email");
  const { event } = await requireEventManager(slug, dashboardHref(slug, "edit"));
  if (!isEmail(email)) {
    return { error: "Enter a valid email address.", values: { email } };
  }
  if ((await addOrganizerByEmail(event.id, email)) === "not-found") {
    return {
      error: "No account uses that email. Ask them to sign up first.",
      values: { email },
    };
  }
  revalidatePath(dashboardHref(slug, "edit"));
  return { success: `${email} can now manage this event.` };
}

export async function removeOrganizerAction(formData: FormData) {
  const slug = field(formData, "slug");
  const userId = field(formData, "userId");
  const { event } = await requireEventManager(slug, dashboardHref(slug, "edit"));
  // The last organizer stays; the button is hidden in that case anyway.
  await removeOrganizer(event.id, userId);
  revalidatePath("/dashboard", "layout");
}

export async function recheckPaymentAction(formData: FormData) {
  const slug = field(formData, "slug");
  const orderId = field(formData, "orderId");
  const { event } = await requireEventManager(slug, dashboardHref(slug, "orders"));
  // Only orders on this event; reconcileOrder itself has no access check.
  if (!(await getEventOrder(event.id, orderId))) return;
  await reconcileOrder(orderId);
  revalidatePath("/dashboard", "layout");
}
