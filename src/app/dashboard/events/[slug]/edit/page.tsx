import type { Metadata } from "next";

import { removeOrganizerAction } from "@/app/dashboard/events/[slug]/actions";
import {
  AddOrganizerForm,
  DeleteEventForm,
} from "@/components/dashboard/event-admin";
import { EventForm } from "@/components/dashboard/event-form";
import type { EditableRace } from "@/components/dashboard/races-editor";
import { countOrders, getEventStats } from "@/db/queries/dashboard";
import { listOrganizers } from "@/db/queries/organizers";
import { defaultCommissionBps, getPayoutAccounts } from "@/db/queries/payouts";
import {
  dashboardHref,
  isAdmin,
  toManilaInput,
  type EventDraft,
} from "@/lib/dashboard";
import { formatPercent } from "@/lib/payouts";
import { requireEventManager } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit event",
  robots: { index: false },
};

const card = "rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6";

export default async function EditEventPage({
  params,
}: PageProps<"/dashboard/events/[slug]/edit">) {
  const { slug } = await params;
  const { session, event } = await requireEventManager(
    slug,
    dashboardHref(slug, "edit"),
  );
  const [stats, organizers, orderCount] = await Promise.all([
    getEventStats(event.id),
    listOrganizers(event.id),
    countOrders(event.id),
  ]);
  const payoutAccounts = await getPayoutAccounts(organizers.map((o) => o.userId));

  const draft: EventDraft = {
    slug: event.slug,
    title: event.title,
    category: event.category,
    distance: event.distanceLabel,
    startsAt: toManilaInput(event.startsAt.toISOString()),
    venue: event.venue,
    area: event.area,
    address: event.address,
    imageUrl: event.imageUrl,
    imageAlt: event.imageAlt,
    status: event.status ?? undefined,
    organizer: event.organizer,
    about: event.about,
    included: event.included,
    isPublished: event.isPublished,
    isFeatured: event.isFeatured,
    payoutAccountId: event.payoutAccountId ?? undefined,
    commissionPercent:
      event.commissionBps === null ? "" : String(event.commissionBps / 100),
  };
  const races: EditableRace[] = event.races.map((race) => {
    const s = stats.races.find((r) => r.raceId === race.id);
    const reserved = (s?.runners ?? 0) + (s?.pending ?? 0);
    return {
      id: race.id,
      name: race.name,
      km: race.distanceKm,
      price: race.price,
      startTime: race.startTime.slice(0, 5),
      cutoff: race.cutoff,
      minAge: race.minAge,
      capacity: race.spotsLeft + reserved,
      reserved,
      hasOrders: s?.hasOrders ?? false,
    };
  });

  return (
    <>
      <EventForm
        event={draft}
        races={races}
        currentSlug={event.slug}
        canFeature={isAdmin(session.user)}
        payoutAccounts={payoutAccounts}
        defaultCommission={formatPercent(defaultCommissionBps())}
      />

      <section className={card} aria-labelledby="organizers-heading">
        <h2 id="organizers-heading" className="mb-1 text-xl md:text-2xl">
          Organizers
        </h2>
        <p className="meta mb-5">
          People who can see sales and runners and edit this event.
        </p>
        {organizers.length ? (
          <ul className="stack mb-5 gap-2">
            {organizers.map((o) => (
              <li
                key={o.userId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{o.name}</span>
                  <span className="meta block">{o.email}</span>
                </span>
                {organizers.length > 1 && (
                  <form action={removeOrganizerAction}>
                    <input type="hidden" name="slug" value={event.slug} />
                    <input type="hidden" name="userId" value={o.userId} />
                    <button type="submit" className="btn btn-ghost btn-sm">
                      {o.userId === session.user.id ? "Leave" : "Remove"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta mb-5">No organizers yet. Only admins can see it.</p>
        )}
        <AddOrganizerForm slug={event.slug} />
      </section>

      {orderCount === 0 && (
        <section className={card} aria-labelledby="danger-heading">
          <h2 id="danger-heading" className="mb-1 text-xl md:text-2xl">
            Delete event
          </h2>
          <p className="meta mb-5">
            Possible until someone registers. After that, unpublish it instead.
          </p>
          <DeleteEventForm slug={event.slug} />
        </section>
      )}
    </>
  );
}
