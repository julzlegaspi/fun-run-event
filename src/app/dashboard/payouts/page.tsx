import type { Metadata } from "next";
import Link from "next/link";

import { PayoutAccountForm } from "@/components/dashboard/payout-forms";
import { BalancesTable, PayoutHistory } from "@/components/dashboard/payout-tables";
import { PageHeader } from "@/components/page-header";
import { getManagedEvents } from "@/db/queries/organizers";
import {
  defaultCommissionBps,
  getEventBalances,
  getPayoutAccount,
  getPayoutHistory,
} from "@/db/queries/payouts";
import { isAdmin } from "@/lib/dashboard";
import { getPhBanks, HitPayError } from "@/lib/hitpay";
import { formatPercent, payoutAccountLabel } from "@/lib/payouts";
import { requireOrganizer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Payouts",
  robots: { index: false },
};

const card = "rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6";

async function loadBanks() {
  try {
    return { banks: (await getPhBanks()).banks };
  } catch (error) {
    if (!(error instanceof HitPayError)) console.error(error);
    return {
      error:
        error instanceof HitPayError
          ? error.message
          : "We couldn't load the bank list. Try again in a moment.",
    };
  }
}

export default async function PayoutsPage() {
  const { user } = await requireOrganizer("/dashboard/payouts");
  const eventIds = (await getManagedEvents(user)).map((e) => e.id);
  const [account, bankList, balances, history] = await Promise.all([
    getPayoutAccount(user.id),
    loadBanks(),
    getEventBalances(eventIds),
    getPayoutHistory(eventIds),
  ]);

  return (
    <>
      <PageHeader eyebrow="Organizer" title="Payouts" crumb="Dashboard">
        <p>
          Fun Run collects registrations and transfers your takings, less the
          platform commission (usually {formatPercent(defaultCommissionBps())}),
          to your bank after race day.
        </p>
      </PageHeader>

      <div className="section container-page stack gap-6">
        {isAdmin(user) && (
          <div className="flex justify-end">
            <Link href="/dashboard/payouts/release" className="btn btn-secondary">
              Release payouts
            </Link>
          </div>
        )}

        <section className={card} aria-labelledby="account-heading">
          <h2 id="account-heading" className="mb-1 text-xl md:text-2xl">
            Payout account
          </h2>
          <p className="meta mb-5">
            {account
              ? `Payouts go to ${payoutAccountLabel(account)}. Saving new details replaces it.`
              : "Add the Philippine bank account your payouts should go to."}
          </p>
          {bankList.banks ? (
            <PayoutAccountForm
              banks={bankList.banks}
              email={user.email}
              replacing={Boolean(account)}
            />
          ) : (
            <p role="alert" className="text-sm text-danger">
              {bankList.error}
            </p>
          )}
        </section>

        <section className={card} aria-labelledby="balances-heading">
          <h2 id="balances-heading" className="mb-5 text-xl md:text-2xl">
            Balances
          </h2>
          <BalancesTable balances={balances} />
        </section>

        <section className={card} aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-5 text-xl md:text-2xl">
            Payout history
          </h2>
          <PayoutHistory payouts={history} />
        </section>
      </div>
    </>
  );
}
