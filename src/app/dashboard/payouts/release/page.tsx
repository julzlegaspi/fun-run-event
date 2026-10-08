import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReleasePayoutForm } from "@/components/dashboard/payout-forms";
import { BalancesTable, PayoutHistory } from "@/components/dashboard/payout-tables";
import { PageHeader } from "@/components/page-header";
import { getEventBalances, getPayoutHistory } from "@/db/queries/payouts";
import { isAdmin } from "@/lib/dashboard";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Release payouts",
  robots: { index: false },
};

const card = "rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6";

// Admins only: every event that still owes its organizer money.
export default async function ReleasePayoutsPage() {
  const { user } = await requireSession("/dashboard/payouts/release");
  if (!isAdmin(user)) notFound();

  const [balances, history] = await Promise.all([
    getEventBalances(),
    getPayoutHistory(),
  ]);
  const owing = balances.filter((b) => b.balance >= 1 || b.processing);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Release payouts" crumb="Payouts">
        <p>
          Each payout is a HitPay transfer from the platform&apos;s PHP balance.
          Make sure it covers the total before releasing.
        </p>
      </PageHeader>

      <div className="section container-page stack gap-6">
        <section className={card} aria-labelledby="owing-heading">
          <h2 id="owing-heading" className="mb-5 text-xl md:text-2xl">
            Owed to organizers
          </h2>
          <BalancesTable
            balances={owing}
            action={(b) =>
              b.available ? <ReleasePayoutForm eventId={b.eventId} amount={b.balance} /> : null
            }
          />
        </section>

        <section className={card} aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-5 text-xl md:text-2xl">
            Recent payouts
          </h2>
          <PayoutHistory payouts={history} canResolve />
        </section>
      </div>
    </>
  );
}
