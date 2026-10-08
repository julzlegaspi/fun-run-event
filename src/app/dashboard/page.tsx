import type { Metadata } from "next";
import Link from "next/link";

import { CapacityMeter } from "@/components/dashboard/capacity-meter";
import { PageHeader } from "@/components/page-header";
import { getManagedEvents } from "@/db/queries/organizers";
import {
  dashboardHref,
  formatCount,
  formatRevenue,
  isAdmin,
  isOrganizer,
} from "@/lib/dashboard";
import { formatEventDate } from "@/lib/events";
import { requireOrganizer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Organizer dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const { user } = await requireOrganizer("/dashboard");
  const events = await getManagedEvents(user);
  const admin = isAdmin(user);
  const canCreate = isOrganizer(user);

  return (
    <>
      <PageHeader eyebrow="Organizer" title="Your events" crumb="Dashboard">
        <p>
          {admin
            ? "You're an admin, so you can see every event."
            : "Sales, runners and orders for the events you organize."}
        </p>
      </PageHeader>

      <div className="section container-page stack gap-6">
        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/dashboard/payouts" className="btn btn-secondary">
            Payouts
          </Link>
          {canCreate && (
            <Link href="/dashboard/events/new" className="btn btn-primary">
              New event
            </Link>
          )}
        </div>

        {events.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={dashboardHref(event.slug)}
                  className="stack h-full gap-4 rounded-xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-ink md:text-xl">
                        {event.title}
                      </h2>
                      <p className="meta">
                        {formatEventDate(event.startsAt)} · {event.venue}
                      </p>
                    </div>
                    <span
                      className={`badge ${event.isPublished ? "badge-success" : "badge-warning"}`}
                    >
                      {event.isPublished ? "Live" : "Draft"}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="meta text-xs">Runners</dt>
                      <dd className="text-xl font-semibold text-ink">
                        {formatCount(event.stats.runners)}
                      </dd>
                    </div>
                    <div>
                      <dt className="meta text-xs">Revenue</dt>
                      <dd className="text-xl font-semibold text-ink">
                        {formatRevenue(event.stats.revenue)}
                      </dd>
                    </div>
                  </dl>
                  <CapacityMeter
                    label={`${event.title} capacity`}
                    sold={event.stats.runners}
                    pending={event.stats.pending}
                    capacity={event.stats.capacity}
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">
            No events yet.{" "}
            {canCreate && (
              <Link href="/dashboard/events/new" className="link">
                Create your first one
              </Link>
            )}
          </p>
        )}
      </div>
    </>
  );
}
