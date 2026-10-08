import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { getOrderForUser, reconcileOrder } from "@/db/queries/registrations";
import {
  eventHref,
  formatEventDate,
  formatKm,
  formatMoney,
} from "@/lib/events";
import {
  checkoutHref,
  orderStatusBadge,
  orderStatusLabel,
} from "@/lib/registrations";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your registration",
  robots: { index: false },
};

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const { user } = await requireSession(`/orders/${id}`);

  // Ownership is checked before touching HitPay. HitPay sends runners back
  // here before (or without, on localhost) the webhook, so ask it directly.
  if (!(await getOrderForUser(id, user.id))) notFound();
  await reconcileOrder(id);
  const order = (await getOrderForUser(id, user.id))!;

  const intro = {
    paid: "You're in! See you at the start line.",
    pending:
      "We're waiting for HitPay to confirm your payment. This page updates when you refresh.",
    failed: "Your payment didn't go through, so your spots have been released.",
    expired: "This checkout timed out before payment, so your spots were released.",
    canceled: "This checkout was canceled and your spots were released.",
  }[order.status];

  return (
    <>
      <PageHeader
        eyebrow={`Order ${order.id.slice(0, 8).toUpperCase()}`}
        title={order.status === "paid" ? "Registration confirmed" : orderStatusLabel[order.status]}
        crumb="Registration"
      >
        <p>{intro}</p>
      </PageHeader>

      <div className="section container-content stack gap-6">
        <section
          aria-labelledby="race-heading"
          className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="stack gap-1">
              <h2 id="race-heading" className="text-xl md:text-2xl">
                <Link href={eventHref(order.event)} className="hover:text-brand">
                  {order.event.title}
                </Link>
              </h2>
              <p className="meta">
                {formatEventDate(order.event.startsAt)} · {order.event.venue}
              </p>
            </div>
            <span className={`badge ${orderStatusBadge[order.status]}`}>
              {orderStatusLabel[order.status]}
            </span>
          </div>
          <dl className="stack gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-body">
                {order.race.name} · {formatKm(order.race.km)} × {order.quantity}
              </dt>
              <dd className="text-ink">{formatMoney(order.unitPrice)} each</dd>
            </div>
            <div className="flex justify-between gap-4 font-semibold">
              <dt className="text-ink">Total</dt>
              <dd className="text-ink">{formatMoney(order.total)}</dd>
            </div>
          </dl>

          {(order.status === "failed" ||
            order.status === "expired" ||
            order.status === "canceled") && (
            <Link
              href={checkoutHref(order.event.slug, order.race.id, order.quantity)}
              className="btn btn-primary mt-5"
            >
              Try again
            </Link>
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
                <p className="font-semibold text-ink sm:col-span-2">
                  {p.fullName}
                </p>
                <p className="meta">{p.email}</p>
                <p className="meta">{p.phone}</p>
                <p className="meta">
                  {p.gender} · Shirt {p.shirtSize}
                </p>
                <p className="meta">
                  Emergency: {p.emergencyName}, {p.emergencyPhone}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/account" className="btn btn-secondary">
            My registrations
          </Link>
          <Link href="/events" className="btn btn-ghost">
            Find another run
          </Link>
        </div>
      </div>
    </>
  );
}
