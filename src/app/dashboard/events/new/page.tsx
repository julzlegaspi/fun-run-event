import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/dashboard/event-form";
import { PageHeader } from "@/components/page-header";
import { defaultCommissionBps, getPayoutAccounts } from "@/db/queries/payouts";
import { isAdmin, isOrganizer } from "@/lib/dashboard";
import { formatPercent } from "@/lib/payouts";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "New event",
  robots: { index: false },
};

export default async function NewEventPage() {
  const { user } = await requireSession("/dashboard/events/new");
  if (!isOrganizer(user)) notFound();
  const payoutAccounts = await getPayoutAccounts([user.id]);

  return (
    <>
      <PageHeader eyebrow="Organizer" title="New event" crumb="Dashboard">
        <p>
          You&apos;ll be its organizer. It starts as a draft: add co-organizers
          once it&apos;s saved, then publish when it&apos;s ready.
        </p>
      </PageHeader>
      <div className="section container-page">
        <EventForm
          races={[]}
          canFeature={isAdmin(user)}
          payoutAccounts={payoutAccounts}
          defaultCommission={formatPercent(defaultCommissionBps())}
        />
      </div>
    </>
  );
}
