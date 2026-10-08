import type { Metadata } from "next";

import { getParticipants } from "@/db/queries/dashboard";
import { dashboardHref, formatCount } from "@/lib/dashboard";
import { SHIRT_SIZES } from "@/lib/registrations";
import { requireEventManager } from "@/lib/session";

export const metadata: Metadata = {
  title: "Participants",
  robots: { index: false },
};

export default async function ParticipantsPage({
  params,
  searchParams,
}: PageProps<"/dashboard/events/[slug]/participants">) {
  const { slug } = await params;
  const { race } = await searchParams;
  const { event } = await requireEventManager(
    slug,
    dashboardHref(slug, "participants"),
  );
  const raceId = event.races.find((r) => r.id === race)?.id;
  const runners = await getParticipants(event, raceId);

  const shirts = SHIRT_SIZES.map((size) => ({
    size,
    count: runners.filter((r) => r.shirtSize === size).length,
  }));
  const csvHref = `${dashboardHref(slug)}/participants.csv${raceId ? `?race=${raceId}` : ""}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="race-filter" className="label">
              Race
            </label>
            <select
              id="race-filter"
              name="race"
              defaultValue={raceId ?? ""}
              className="input w-auto"
            >
              <option value="">All races</option>
              {event.races.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
        <a href={csvHref} className="btn btn-primary" download>
          Download CSV
        </a>
      </div>

      <section
        aria-labelledby="shirts-heading"
        className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <h2 id="shirts-heading" className="mb-4 text-xl md:text-2xl">
          Shirt sizes
        </h2>
        <dl className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {shirts.map(({ size, count }) => (
            <div key={size} className="rounded-lg border border-line p-3 text-center">
              <dt className="meta text-xs">{size}</dt>
              <dd className="text-xl font-semibold text-ink">{count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="runners-heading"
        className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <h2 id="runners-heading" className="mb-1 text-xl md:text-2xl">
          Confirmed runners
        </h2>
        <p className="meta mb-5">
          {formatCount(runners.length)} paid{" "}
          {runners.length === 1 ? "runner" : "runners"}. Unpaid orders aren&apos;t
          listed.
        </p>
        {runners.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  {["Name", "Race", "Age", "Gender", "Shirt", "Contact", "Emergency contact"].map(
                    (heading) => (
                      <th key={heading} scope="col" className="py-2 pr-4 font-semibold">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {runners.map((r, i) => (
                  <tr key={`${r.orderId}-${i}`} className="border-b border-line align-top last:border-0">
                    <th scope="row" className="py-3 pr-4 font-semibold text-ink">
                      {r.fullName}
                    </th>
                    <td className="py-3 pr-4 text-ink-body">{r.raceName}</td>
                    <td className="py-3 pr-4 text-ink-body tabular-nums">{r.age}</td>
                    <td className="py-3 pr-4 text-ink-body">{r.gender}</td>
                    <td className="py-3 pr-4 text-ink-body">{r.shirtSize}</td>
                    <td className="py-3 pr-4 text-ink-body">
                      {r.email}
                      <span className="block">{r.phone}</span>
                    </td>
                    <td className="py-3 text-ink-body">
                      {r.emergencyName}
                      <span className="block">{r.emergencyPhone}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="meta">No confirmed runners yet.</p>
        )}
      </section>
    </>
  );
}
