import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { getManagedEvent, hasDashboardAccess } from "@/db/queries/organizers";
import { auth } from "@/lib/auth";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

// Use in pages that need a signed-in user; `next` is where to return after sign-in.
export async function requireSession(next: string) {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return session;
}

// Dashboard pages: signed in and organizing (or admin of) at least one event.
export async function requireOrganizer(next: string) {
  const session = await requireSession(next);
  if (!(await hasDashboardAccess(session.user))) notFound();
  return session;
}

// Dashboard pages and actions for one event. 404s rather than 403s so event
// slugs (including drafts) don't leak to other users.
export async function requireEventManager(slug: string, next: string) {
  const session = await requireSession(next);
  const event = await getManagedEvent(session.user, slug);
  if (!event) notFound();
  return { session, event };
}

// Only same-site paths, so `?next=` can't send people off to another origin.
export function safeRedirect(value: unknown, fallback = "/account") {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : fallback;
}
