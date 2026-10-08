import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { recheckPaymentAction } from "@/app/dashboard/events/[slug]/actions";
import { getEventOrder } from "@/db/queries/dashboard";
import { dashboardHref } from "@/lib/dashboard";
import { formatEventDate, formatKm, formatMoney } from "@/lib/events";
import {
  ageOn,
  orderStatusBadge,
  orderStatusLabel,
} from "@/lib/registrations";
import { requireEventManager } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false },
};

export default async function DashboardOrderPage({
  params,
}: PageProps<"/dashboard/events/[slug]/orders/[id]">) {
  const { slug, id } = await params;
  const { event } = await requireEventManager(
    slug,
    `${dashboardHref(slug, "orders")}/${id}`,
  );
  const order = await getEventOrder(event.id, id);
  if (!order) notFound();

  const details = [
    ["Order", order.id],
    ["Placed", formatEventDate(order.createdAt)],
    ["Paid", order.paidAt ? formatEventDate(order.paidAt) : "—"],
    ["Buyer", `${order.buyer.name} (${order.buyer.email})`],
    ["HitPay request", order.paymentRequestId ?? "—"],
    ["HitPay payment", order.paymentId ?? "—"],
  ];

  return (
    <>
      <Link href={dashboardHref(slug, "orders")} className="link w-fit text-sm">
        ← All orders
      </Link>

      <section
        aria-labelledby="order-heading"
        className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-1">
            <h2 id="order-heading" className="text-xl md:text-2xl">
              Order {order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="meta">
              {order.race.name} · {formatKm(order.race.km)} × {order.quantity} ·{" "}
              {formatMoney(order.total)}
            </p>
          </div>
          <span className={`badge ${orderStatusBadge[order.status]}`}>
            {orderStatusLabel[order.status]}
          </span>
        </div>

        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
          {details.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-ink-muted">{label}</dt>
              <dd className="break-all text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {order.status === "pending" && order.paymentRequestId && (
          <form action={recheckPaymentAction} className="mt-5">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className="btn btn-secondary btn-sm">
              Re-check payment with HitPay
            </button>
          </form>
        )}
      </section>

      <section
        aria-labelledby="runners-heading"
        className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <h2 id="runners-heading" className="mb-5 text-xl md:text-2xl">
          Runners
        </h2>
        <ul className="stack gap-4">
          {order.participants.map((p, i) => (
            <li
              key={i}
              className="grid gap-1 border-line not-last:border-b not-last:pb-4 sm:grid-cols-2"
            >
              <p className="font-semibold text-ink sm:col-span-2">{p.fullName}</p>
              <p className="meta">{p.email}</p>
              <p className="meta">{p.phone}</p>
              <p className="meta">
                {p.gender} · Age {ageOn(p.birthdate, order.event.startsAt)} on race
                day · Shirt {p.shirtSize}
              </p>
              <p className="meta">
                Emergency: {p.emergencyName}, {p.emergencyPhone}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
