"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ArrowRightIcon } from "@/components/icons";
import {
  formatKm,
  formatMoney,
  formatTime,
  type Race,
} from "@/lib/events";
import { MAX_RUNNERS, checkoutHref } from "@/lib/registrations";

export function TicketPicker({
  slug,
  races,
  defaultRaceId,
}: {
  slug: string;
  races: Race[];
  defaultRaceId: string;
}) {
  const [raceId, setRaceId] = useState(defaultRaceId);
  const [quantity, setQuantity] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelInView, setPanelInView] = useState(false);

  // The mobile bar only needs to show while the full panel is off screen.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const observer = new IntersectionObserver(([entry]) =>
      setPanelInView(entry.isIntersecting),
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const race = races.find((r) => r.id === raceId) ?? races[0];
  const maxQuantity = Math.min(MAX_RUNNERS, race.spotsLeft);
  const total = race.price * quantity;

  function selectRace(id: string) {
    const next = races.find((r) => r.id === id)!;
    setRaceId(id);
    setQuantity((q) => Math.min(q, Math.min(MAX_RUNNERS, next.spotsLeft)));
  }

  return (
    <>
      <div
        ref={panelRef}
        id="tickets"
        className="scroll-mt-24 rounded-xl border border-line bg-surface p-5 shadow-raised sm:p-6"
      >
        <fieldset className="stack gap-3">
          <legend className="mb-3 font-display text-lg font-bold text-ink">
            Choose your distance
          </legend>
          {races.map((r) => {
            const soldOut = r.spotsLeft === 0;
            return (
              <label
                key={r.id}
                className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                  r.id === race.id
                    ? "border-brand bg-brand-soft"
                    : "border-line hover:border-line-strong"
                } ${soldOut ? "pointer-events-none opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="race"
                  value={r.id}
                  checked={r.id === race.id}
                  disabled={soldOut}
                  onChange={() => selectRace(r.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-md font-display leading-none ${
                    r.id === race.id
                      ? "bg-brand text-on-brand"
                      : "bg-surface-sunken text-ink"
                  }`}
                >
                  <span className="text-lg font-extrabold">
                    {r.km < 1 ? r.km * 1000 : r.km}
                  </span>
                  <span className="mt-0.5 text-2xs font-semibold">
                    {r.km < 1 ? "m" : "km"}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{r.name}</span>
                  <span className="meta block">
                    Flag-off {formatTime(r.startTime)}
                    {r.spotsLeft > 0 && r.spotsLeft <= 50 && (
                      <span className="font-semibold text-danger">
                        {" "}
                        · {r.spotsLeft} left
                      </span>
                    )}
                  </span>
                </span>
                <span className="font-display text-base font-bold text-ink">
                  {soldOut ? "Sold out" : formatMoney(r.price)}
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="label mb-0" id="qty-label">
            Runners
          </span>
          <div
            role="group"
            aria-labelledby="qty-label"
            className="flex items-center rounded-full border border-line-strong"
          >
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Remove a runner"
            >
              −
            </button>
            <output
              aria-live="polite"
              className="w-8 text-center font-semibold text-ink"
            >
              {quantity}
            </output>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              aria-label="Add a runner"
            >
              +
            </button>
          </div>
        </div>

        <hr className="divider my-5" />

        <div className="flex items-baseline justify-between">
          <span className="meta">
            {quantity} × {formatKm(race.km)}
          </span>
          <span className="font-display text-2xl font-extrabold text-ink">
            {formatMoney(total)}
          </span>
        </div>

        {race.spotsLeft > 0 ? (
          <Link
            href={checkoutHref(slug, race.id, quantity)}
            className="btn btn-primary btn-lg mt-4 w-full"
          >
            {race.price === 0 ? "Register free" : "Register now"}
            <ArrowRightIcon />
          </Link>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-lg mt-4 w-full"
            disabled
          >
            Sold out
          </button>
        )}
        <p className="meta mt-3 text-center text-xs">
          Free cancellation up to 14 days before race day.
        </p>
      </div>

      {/* Mobile: keep price and action in reach while scrolling. */}
      <div
        aria-hidden={panelInView}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur transition-transform duration-200 lg:hidden ${
          panelInView ? "invisible translate-y-full" : ""
        }`}
      >
        <div className="container-page flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {race.name}
            </p>
            <p className="meta">
              {quantity > 1 ? `${quantity} runners · ` : ""}
              {formatMoney(total)}
            </p>
          </div>
          <a href="#tickets" className="btn btn-primary shrink-0">
            {race.price === 0 ? "Register free" : "Get tickets"}
          </a>
        </div>
      </div>
    </>
  );
}
