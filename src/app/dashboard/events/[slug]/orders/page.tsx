import type { Metadata } from "next";
import Link from "next/link";

import { searchOrders } from "@/db/queries/dashboard";
import { dashboardHref } from "@/lib/dashboard";
import { formatEventDate, formatMoney } from "@/lib/events";
import {
  ORDER_STATUSES,
  orderStatusBadge,
  orderStatusLabel,
  type OrderStatus,
} from "@/lib/registrations";
import { requireEventManager } from "@/lib/session";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false },
};

export default async function OrdersPage({
  params,
  searchParams,
}: PageProps<"/dashboard/events/[slug]/orders">) {
  const { slug } = await params;
  const { q, status } = await searchParams;
  const { event } = await requireEventManager(slug, dashboardHref(slug, "orders"));

  const query = typeof q === "string" ? q.slice(0, 100) : "";
  const statusFilter = ORDER_STATUSES.find((s) => s === status) as
    | OrderStatus
    | undefined;
  const orders = await searchOrders(event.id, { q: query, status: statusFilter });

  return (
    <>
      <form role="search" className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="order-q" className="label">
            Search
          </label>
          <input
            id="order-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Order number, buyer or runner name/email"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="order-status" className="label">
            Status
          </label>
          <select
            id="order-status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="input w-auto"
          >
            <option value="">Any status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel[s]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Search
        </button>
      </form>

      <section
        aria-labelledby="orders-heading"
        className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <h2 id="orders-heading" className="mb-5 text-xl md:text-2xl">
          {query || statusFilter ? "Matching orders" : "Latest orders"}
        </h2>
        {orders.length ? (
          <ul className="stack gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`${dashboardHref(slug, "orders")}/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4 transition-colors hover:border-line-strong"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">
                      {order.id.slice(0, 8).toUpperCase()} · {order.buyerEmail}
                    </span>
                    <span className="meta block">
                      {order.raceName} × {order.quantity} ·{" "}
                      {formatMoney(order.total)} · {formatEventDate(order.createdAt)}
                    </span>
                    <span className="meta block truncate">
                      {order.runners.join(", ")}
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
          <p className="meta">No orders found.</p>
        )}
        {orders.length === 50 && (
          <p className="meta mt-4">Showing the latest 50. Narrow your search to see more.</p>
        )}
      </section>
    </>
  );
}
