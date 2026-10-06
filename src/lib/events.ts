// Event types, formatters and static site imagery shared by server and client
// components. Event data itself lives in Postgres (see src/db/queries/events.ts),
// so this module must never import from "@/db".
// Photos are free-licence images from Unsplash (https://unsplash.com/license).

export const EVENT_CATEGORIES = [
  "5K",
  "10K",
  "Half marathon",
  "Trail",
  "Night run",
  "Colour run",
  "Kids",
  "Dog-friendly",
] as const;

export const EVENT_STATUSES = [
  "Almost full",
  "Early bird",
  "New",
  "Selling fast",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];

// One distance option within an event, each with its own ticket.
export type Race = {
  id: string;
  name: string;
  km: number;
  price: number; // PHP, 0 = free
  startTime: string; // 24h flag-off time on event day
  cutoff: string;
  minAge: number; // 0 = all ages
  spotsLeft: number;
};

export type RunEvent = {
  slug: string;
  title: string;
  category: EventCategory;
  distance: string; // headline distance shown on cards
  startsAt: string; // ISO 8601
  venue: string;
  area: string;
  address: string;
  priceFrom: number; // derived: cheapest race
  image: { src: string; alt: string };
  status?: EventStatus;
  organizer: string;
  races: Race[];
  about: string[];
  included: string[];
};

// Query must match `images.remotePatterns` in next.config.ts.
export const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1920&q=80&fm=jpg&fit=crop`;

export const heroImage = {
  src: unsplash("1760315972424-1637530daead"),
  alt: "A pack of runners racing down a city street in golden morning light",
};

export function eventHref(event: Pick<RunEvent, "slug">) {
  return `/events/${event.slug}`;
}

// Supporting shots for the detail-page gallery, until events have their own.
const galleryPool = [
  {
    src: unsplash("1760315972424-1637530daead"),
    alt: "Runners racing down a city street at sunrise",
  },
  {
    src: unsplash("1745790289741-12a211a8325d"),
    alt: "A crowd of runners streaming through a sunny city street",
  },
  {
    src: unsplash("1667781743417-a8099056261c"),
    alt: "Runners with race bibs mid-stride",
  },
];

export function eventGallery(event: RunEvent) {
  const extras = galleryPool.filter((img) => img.src !== event.image.src);
  return [event.image, ...extras.slice(0, 2)];
}

// Race-day timeline built from each race's flag-off time.
export function raceDaySchedule(event: RunEvent) {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const fromMinutes = (n: number) =>
    `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

  const starts = event.races.map((r) => toMinutes(r.startTime));
  const first = Math.min(...starts);
  const last = Math.max(...starts);

  return [
    { time: fromMinutes(first - 60), label: "Race village opens, bag drop" },
    { time: fromMinutes(first - 15), label: "Group warm-up" },
    ...[...event.races]
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
      .map((r) => ({ time: r.startTime, label: `${r.name} flag-off` })),
    { time: fromMinutes(last + 90), label: "Finisher celebrations and prizes" },
  ];
}

export function formatKm(km: number) {
  return km < 1 ? `${km * 1000} m` : `${km} km`;
}

export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

// All prices are in Philippine pesos, e.g. "₱1,500".
const moneyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number) {
  return amount === 0 ? "Free" : moneyFormat.format(amount);
}

export const collections = [
  {
    title: "Trail & nature",
    blurb: "Swap tarmac for forest paths and mountain views.",
    category: "Trail" as EventCategory,
    image: {
      src: unsplash("1696964904681-7ae16f82ceef"),
      alt: "A trail runner's legs on a grassy mountain path",
    },
  },
  {
    title: "After dark",
    blurb: "Cooler air, city lights and post-run supper.",
    category: "Night run" as EventCategory,
    image: {
      src: unsplash("1707741099794-252b0409230e"),
      alt: "A runner heading down a lamp-lit street at night",
    },
  },
  {
    title: "Family & kids",
    blurb: "Short, joyful distances everyone can finish.",
    category: "Kids" as EventCategory,
    image: {
      src: unsplash("1451481454041-104482d8e284"),
      alt: "Three children running across an open meadow",
    },
  },
];

export const categories: EventCategory[] = [...EVENT_CATEGORIES];

// Fixed locale and time zone so server and client render identical strings.
const dateFormat = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});

const dayFormat = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  timeZone: "Asia/Manila",
});

const monthFormat = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  timeZone: "Asia/Manila",
});

export function formatEventDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function eventDay(iso: string) {
  const date = new Date(iso);
  return { day: dayFormat.format(date), month: monthFormat.format(date) };
}

export function formatPrice(priceFrom: number) {
  return priceFrom === 0 ? "Free" : `From ${formatMoney(priceFrom)}`;
}
