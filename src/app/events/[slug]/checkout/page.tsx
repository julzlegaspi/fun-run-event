import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CalendarIcon, PinIcon } from "@/components/icons";
import { getCheckoutRace } from "@/db/queries/events";
import {
  eventHref,
  formatEventDate,
  formatKm,
  formatMoney,
  formatTime,
} from "@/lib/events";
import { MAX_RUNNERS, checkoutHref } from "@/lib/registrations";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: PageProps<"/events/[slug]/checkout">) {
  const { slug } = await params;
  const query = await searchParams;
  const raceId = param(query.race) ?? "";
  const requested = Math.max(1, Math.floor(Number(param(query.qty)) || 1));

  const { user } = await requireSession(checkoutHref(slug, raceId, requested));
  const checkout = await getCheckoutRace(slug, raceId);
  if (!checkout) notFound();

  const { event, race } = checkout;
  const quantity = Math.min(requested, MAX_RUNNERS, race.spotsLeft);
  const total = race.price * quantity;

  return (
    <div className="section container-page">
      <nav aria-label="Breadcrumb" className="meta mb-6">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={eventHref(event)} className="hover:text-ink">
              {event.title}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            Checkout
          </li>
        </ol>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div className="stack gap-6">
          <header className="stack gap-2">
            <p className="eyebrow">Checkout</p>
            <h1>Runner details</h1>
            <p className="text-lg text-ink-body">
              Tell us who&apos;s running so the organiser can prepare race kits.
            </p>
          </header>

          {quantity === 0 ? (
            <div className="stack gap-4 rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6">
              <p className="text-ink">
                {race.name} is sold out. Pick another distance.
              </p>
              <Link href={eventHref(event)} className="btn btn-secondary w-fit">
                Back to the event
              </Link>
            </div>
          ) : (
            <CheckoutForm
              slug={event.slug}
              raceId={race.id}
              quantity={quantity}
              total={total}
              account={{ name: user.name, email: user.email }}
            />
          )}
        </div>

        <aside aria-label="Order summary" className="lg:sticky lg:top-24">
          <div className="stack gap-4 rounded-xl border border-line bg-surface p-5 shadow-raised sm:p-6">
            <h2 className="text-lg">Order summary</h2>
            <div className="stack gap-1">
              <p className="font-display text-base font-bold text-ink">
                {event.title}
              </p>
              <p className="meta flex items-center gap-1.5">
                <CalendarIcon className="size-4 shrink-0" />
                {formatEventDate(event.startsAt)}
              </p>
              <p className="meta flex items-center gap-1.5">
                <PinIcon className="size-4 shrink-0" />
                {event.venue}, {event.area}
              </p>
            </div>
            <hr className="divider" />
            <dl className="stack gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-body">
                  {race.name} · {formatKm(race.km)}
                </dt>
                <dd className="text-ink">{formatMoney(race.price)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-body">Flag-off</dt>
                <dd className="text-ink">{formatTime(race.startTime)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-body">Runners</dt>
                <dd className="text-ink">× {quantity}</dd>
              </div>
            </dl>
            <hr className="divider" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display text-2xl font-extrabold text-ink">
                {formatMoney(total)}
              </span>
            </div>
            {quantity < requested && quantity > 0 && (
              <p className="meta text-xs">
                Only {quantity} {quantity === 1 ? "spot" : "spots"} available,
                so we&apos;ve adjusted your runners.
              </p>
            )}
            <Link href={eventHref(event)} className="link text-sm">
              Change distance or runners
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
