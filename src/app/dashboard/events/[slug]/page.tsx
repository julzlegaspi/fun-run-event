import type { Metadata } from "next";

import { CapacityMeter } from "@/components/dashboard/capacity-meter";
import { StatRow, StatTile } from "@/components/dashboard/stat-tile";
import { getEventStats } from "@/db/queries/dashboard";
import { defaultCommissionBps } from "@/db/queries/payouts";
import { formatCount, formatRevenue } from "@/lib/dashboard";
import { formatKm, formatMoney } from "@/lib/events";
import { formatPercent } from "@/lib/payouts";
import { requireEventManager } from "@/lib/session";

export const metadata: Metadata = {
  title: "Event overview",
  robots: { index: false },
};

export default async function EventOverviewPage({
  params,
}: PageProps<"/dashboard/events/[slug]">) {
  const { slug } = await params;
  const { event } = await requireEventManager(slug, `/dashboard/events/${slug}`);
  const stats = await getEventStats(event.id);

  return (
    <>
      <StatRow>
        <StatTile label="Confirmed runners" value={formatCount(stats.runners)} />
        <StatTile
          label="Revenue"
          value={formatRevenue(stats.revenue)}
          note="Paid orders"
        />
        <StatTile
          label="Awaiting payment"
          value={formatCount(stats.pending)}
          note="Runners holding a spot"
        />
        <StatTile
          label="Spots left"
          value={formatCount(stats.spotsLeft)}
          note={`of ${formatCount(stats.capacity)}`}
        />
        <StatTile
          label="Platform commission"
          value={formatRevenue(stats.commission)}
          note={`${formatPercent(event.commissionBps ?? defaultCommissionBps())} on new orders`}
        />
        <StatTile
          label="Your share"
          value={formatRevenue(stats.revenue - stats.commission)}
          note="Paid out after race day"
        />
      </StatRow>

      <section
        aria-labelledby="races-heading"
        className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <h2 id="races-heading" className="mb-5 text-xl md:text-2xl">
          Races
        </h2>
        {stats.races.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Race
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Price
                  </th>
                  <th scope="col" className="w-1/3 py-2 pr-4 font-semibold">
                    Capacity
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">
                    Runners
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {stats.races.map((race) => (
                  <tr
                    key={race.raceId}
                    className="border-b border-line last:border-0"
                  >
                    <th scope="row" className="py-3 pr-4 font-semibold text-ink">
                      {race.name}
                      <span className="meta block font-normal">
                        {formatKm(race.km)}
                      </span>
                    </th>
                    <td className="py-3 pr-4 text-ink-body">
                      {formatMoney(race.price)}
                    </td>
                    <td className="py-3 pr-4">
                      <CapacityMeter
                        label={`${race.name} capacity`}
                        sold={race.runners}
                        pending={race.pending}
                        capacity={race.capacity}
                      />
                    </td>
                    <td className="py-3 pr-4 text-right text-ink">
                      {formatCount(race.runners)}
                    </td>
                    <td className="py-3 text-right text-ink">
                      {formatRevenue(race.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="meta">No races yet. Add them under Edit.</p>
        )}
      </section>
    </>
  );
}
