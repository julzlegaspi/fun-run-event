import Link from "next/link";

import { resolvePayoutAction } from "@/app/dashboard/payouts/actions";
import { dashboardHref, formatRevenue } from "@/lib/dashboard";
import { formatEventDate } from "@/lib/events";
import {
  payoutAccountLabel,
  payoutStatusBadge,
  payoutStatusLabel,
  type EventBalance,
  type PayoutRow,
} from "@/lib/payouts";

function balanceStatus(b: EventBalance) {
  if (b.processing) return "Payout processing";
  if (b.balance < 1) return b.paidOut > 0 ? "Paid out" : "No paid sales yet";
  if (!b.payoutAccount) return "Add a payout account";
  if (!b.ended) return `Available after ${formatEventDate(b.startsAt)}`;
  return "Ready for payout";
}

// Takings per event. `action` renders a last column (the admin's button).
export function BalancesTable({
  balances,
  action,
}: {
  balances: EventBalance[];
  action?: (balance: EventBalance) => React.ReactNode;
}) {
  if (!balances.length) return <p className="meta">No events yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <thead className="border-b border-line text-ink-muted">
          <tr>
            <th scope="col" className="py-2 pr-4 font-semibold">Event</th>
            <th scope="col" className="py-2 pr-4 text-right font-semibold">Sales</th>
            <th scope="col" className="py-2 pr-4 text-right font-semibold">Commission</th>
            <th scope="col" className="py-2 pr-4 text-right font-semibold">Paid out</th>
            <th scope="col" className="py-2 pr-4 text-right font-semibold">Balance</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
            {action && <th scope="col" className="py-2"><span className="sr-only">Action</span></th>}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {balances.map((b) => (
            <tr key={b.eventId} className="border-b border-line last:border-0">
              <th scope="row" className="py-3 pr-4 font-semibold text-ink">
                <Link href={dashboardHref(b.slug)} className="link">
                  {b.title}
                </Link>
                <span className="meta block font-normal">
                  {formatEventDate(b.startsAt)}
                  {b.payoutAccount && <> · {payoutAccountLabel(b.payoutAccount)}</>}
                </span>
              </th>
              <td className="py-3 pr-4 text-right text-ink-body">{formatRevenue(b.gross)}</td>
              <td className="py-3 pr-4 text-right text-ink-body">−{formatRevenue(b.commission)}</td>
              <td className="py-3 pr-4 text-right text-ink-body">{formatRevenue(b.paidOut)}</td>
              <td className="py-3 pr-4 text-right font-semibold text-ink">
                {formatRevenue(b.balance)}
              </td>
              <td className="py-3 pr-4 text-ink-body">{balanceStatus(b)}</td>
              {action && <td className="py-3 text-right">{action(b)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// `canResolve` (admins) shows buttons to settle unconfirmed transfers.
export function PayoutHistory({
  payouts,
  canResolve = false,
}: {
  payouts: PayoutRow[];
  canResolve?: boolean;
}) {
  if (!payouts.length) return <p className="meta">No payouts yet.</p>;
  return (
    <ul className="stack gap-3">
      {payouts.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4"
        >
          <span className="min-w-0">
            <span className="block font-semibold text-ink">
              {formatRevenue(p.amount)} · {p.eventTitle}
            </span>
            <span className="meta block">
              {p.account} · {formatEventDate(p.paidAt ?? p.createdAt)}
            </span>
            {p.failureReason && (
              <span className="block text-xs text-danger">{p.failureReason}</span>
            )}
          </span>
          {canResolve && p.unconfirmed ? (
            <form action={resolvePayoutAction} className="flex gap-2">
              <input type="hidden" name="payoutId" value={p.id} />
              <button type="submit" name="sent" value="yes" className="btn btn-secondary btn-sm">
                It was sent
              </button>
              <button type="submit" name="sent" value="no" className="btn btn-ghost btn-sm">
                It wasn&apos;t
              </button>
            </form>
          ) : (
            <span className={`badge ${payoutStatusBadge[p.status]}`}>
              {payoutStatusLabel[p.status]}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
