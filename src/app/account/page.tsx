import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import {
  ChangePasswordForm,
  UpdateNameForm,
} from "@/components/auth/account-forms";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageHeader } from "@/components/page-header";
import { becomeOrganizerAction } from "@/app/account/actions";
import { hasDashboardAccess } from "@/db/queries/organizers";
import { getOrdersForUser } from "@/db/queries/registrations";
import { auth } from "@/lib/auth";
import { isOrganizer } from "@/lib/dashboard";
import { formatEventDate, formatKm } from "@/lib/events";
import {
  orderHref,
  orderStatusBadge,
  orderStatusLabel,
} from "@/lib/registrations";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

const joinedFormat = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
});

export default async function AccountPage() {
  const { user } = await requireSession("/account");
  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });
  // Google-only users have no password to change.
  const hasPassword = accounts.some((a) => a.providerId === "credential");
  const hasGoogle = accounts.some((a) => a.providerId === "google");
  const [orders, organizer] = await Promise.all([
    getOrdersForUser(user.id),
    hasDashboardAccess(user),
  ]);

  return (
    <>
      <PageHeader eyebrow="Account" title="My account" crumb="Account">
        <p>Signed in as {user.email}</p>
      </PageHeader>

      <div className="section container-content stack gap-6">
        {organizer && (
          <Link
            href="/dashboard"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong sm:p-6"
          >
            <span className="min-w-0">
              <span className="block text-xl font-semibold text-ink md:text-2xl">
                Organizer dashboard
              </span>
              <span className="meta block">
                Sales, runners and orders for your events.
              </span>
            </span>
            <span className="btn btn-secondary btn-sm">Open</span>
          </Link>
        )}

        {!isOrganizer(user) && (
          <section
            id="organizer"
            aria-labelledby="organizer-heading"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
          >
            <div className="min-w-0">
              <h2 id="organizer-heading" className="text-xl md:text-2xl">
                Host your own run
              </h2>
              <p className="meta">
                Become an organizer to list events, take registrations and
                track sales.
              </p>
            </div>
            <form action={becomeOrganizerAction}>
              <button type="submit" className="btn btn-primary btn-sm">
                Become an organizer
              </button>
            </form>
          </section>
        )}

        <section
          aria-labelledby="registrations-heading"
          className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
        >
          <h2 id="registrations-heading" className="mb-5 text-xl md:text-2xl">
            My registrations
          </h2>
          {orders.length ? (
            <ul className="stack gap-3">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={orderHref(order)}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4 transition-colors hover:border-line-strong"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">
                        {order.event.title}
                      </span>
                      <span className="meta block">
                        {order.race.name} · {formatKm(order.race.km)} ×{" "}
                        {order.quantity} · {formatEventDate(order.event.startsAt)}
                      </span>
                    </span>
                    <span className={`badge ${orderStatusBadge[order.status]}`}>
                      {orderStatusLabel[order.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="meta">
              No registrations yet.{" "}
              <Link href="/events" className="link">
                Find a run
              </Link>
            </p>
          )}
        </section>

        <section
          aria-labelledby="profile-heading"
          className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
        >
          <div className="stack mb-5 gap-1">
            <h2 id="profile-heading" className="text-xl md:text-2xl">
              Profile
            </h2>
            <p className="meta">
              Member since {joinedFormat.format(user.createdAt)}
            </p>
          </div>
          <dl className="mb-5 grid gap-1">
            <dt className="label mb-0">Email</dt>
            <dd className="text-ink">
              {user.email}
              {hasGoogle && (
                <span className="badge ml-2 align-middle">Google</span>
              )}
            </dd>
          </dl>
          <UpdateNameForm name={user.name} />
        </section>

        {hasPassword && (
          <section
            aria-labelledby="password-heading"
            className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
          >
            <div className="stack mb-5 gap-1">
              <h2 id="password-heading" className="text-xl md:text-2xl">
                Password
              </h2>
              <p className="meta">
                Changing it signs you out on your other devices.
              </p>
            </div>
            <ChangePasswordForm />
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line p-5 sm:p-6">
          <p className="meta">Done for now?</p>
          <SignOutButton />
        </div>
      </div>
    </>
  );
}
