import Link from "next/link";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { PageHeader } from "@/components/page-header";
import { eventHref, formatEventDate } from "@/lib/events";
import { requireEventManager } from "@/lib/session";

export default async function EventDashboardLayout({
  params,
  children,
}: LayoutProps<"/dashboard/events/[slug]">) {
  const { slug } = await params;
  const { event } = await requireEventManager(slug, `/dashboard/events/${slug}`);

  return (
    <>
      <PageHeader eyebrow="Organizer" title={event.title} crumb="Dashboard">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={`badge ${event.isPublished ? "badge-success" : "badge-warning"}`}
          >
            {event.isPublished ? "Live" : "Draft"}
          </span>
          <span>
            {formatEventDate(event.startsAt.toISOString())} · {event.venue}
          </span>
          {event.isPublished && (
            <Link href={eventHref(event)} className="link">
              View public page
            </Link>
          )}
          <Link href="/dashboard" className="link">
            All events
          </Link>
        </p>
      </PageHeader>

      <div className="section container-page stack gap-6">
        <DashboardNav slug={event.slug} />
        {children}
      </div>
    </>
  );
}
