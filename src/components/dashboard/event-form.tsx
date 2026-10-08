"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createEventAction,
  updateEventAction,
} from "@/app/dashboard/events/[slug]/actions";
import { SubmitButton } from "@/components/auth/auth-form";
import { FormAlert, FormField } from "@/components/dashboard/form-field";
import {
  RacesEditor,
  type EditableRace,
} from "@/components/dashboard/races-editor";
import type { EventDraft } from "@/lib/dashboard";
import { EVENT_CATEGORIES, EVENT_STATUSES } from "@/lib/events";
import { payoutAccountLabel, type PayoutAccount } from "@/lib/payouts";

const categoryOptions = [
  { value: "", label: "Select…" },
  ...EVENT_CATEGORIES.map((c) => ({ value: c, label: c })),
];
const statusOptions = [
  { value: "", label: "None" },
  ...EVENT_STATUSES.map((s) => ({ value: s, label: s })),
];

const card = "rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6";

// Create or edit an event with its races. `currentSlug` switches to edit mode.
export function EventForm({
  event,
  races,
  currentSlug,
  canFeature,
  payoutAccounts,
  defaultCommission,
}: {
  event?: EventDraft;
  races: EditableRace[];
  currentSlug?: string;
  canFeature: boolean; // admin-only settings: featuring and commission
  payoutAccounts: PayoutAccount[]; // the organizers' accounts
  defaultCommission: string; // e.g. "5%"
}) {
  const [state, formAction] = useActionState(
    currentSlug ? updateEventAction : createEventAction,
    {},
  );
  // A live event's URL stays fixed (enforced by the action too).
  const slugLocked = Boolean(currentSlug && event?.isPublished);
  const checked = (name: "isPublished" | "isFeatured") =>
    state.values ? state.values[name] === "on" : Boolean(event?.[name]);

  return (
    <form action={formAction} className="stack gap-6" noValidate>
      {currentSlug && <input type="hidden" name="currentSlug" value={currentSlug} />}
      <FormAlert state={state} />

      <section className={card} aria-labelledby="details-heading">
        <h2 id="details-heading" className="mb-5 text-xl md:text-2xl">
          Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            className="sm:col-span-2"
            name="title"
            label="Event name"
            state={state}
            defaultValue={event?.title}
          />
          <FormField
            name="slug"
            label="URL"
            hint={
              slugLocked
                ? "Fixed while the event is live."
                : "/events/… — leave blank to use the name."
            }
            readOnly={slugLocked}
            state={state}
            defaultValue={event?.slug}
          />
          <FormField
            name="category"
            label="Category"
            options={categoryOptions}
            state={state}
            defaultValue={event?.category}
          />
          <FormField
            name="distance"
            label="Headline distance"
            placeholder="21.1 km"
            state={state}
            defaultValue={event?.distance}
          />
          <FormField
            name="startsAt"
            label="Date and start (Manila time)"
            type="datetime-local"
            state={state}
            defaultValue={event?.startsAt}
          />
          <FormField
            name="organizer"
            label="Organizer name"
            hint="Shown on the event page."
            state={state}
            defaultValue={event?.organizer}
          />
          <FormField
            name="status"
            label="Label"
            options={statusOptions}
            state={state}
            defaultValue={event?.status ?? ""}
          />
        </div>
      </section>

      <section className={card} aria-labelledby="venue-heading">
        <h2 id="venue-heading" className="mb-5 text-xl md:text-2xl">
          Venue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="venue" label="Venue" state={state} defaultValue={event?.venue} />
          <FormField name="area" label="City or area" state={state} defaultValue={event?.area} />
          <FormField
            className="sm:col-span-2"
            name="address"
            label="Address"
            state={state}
            defaultValue={event?.address}
          />
        </div>
      </section>

      <section className={card} aria-labelledby="content-heading">
        <h2 id="content-heading" className="mb-5 text-xl md:text-2xl">
          Page content
        </h2>
        <div className="grid gap-4">
          <FormField
            name="imageUrl"
            label="Photo"
            type="url"
            placeholder="https://images.unsplash.com/photo-…"
            hint="An Unsplash image address (images.unsplash.com/photo-…)."
            state={state}
            defaultValue={event?.imageUrl}
          />
          <FormField
            name="imageAlt"
            label="Photo description"
            state={state}
            defaultValue={event?.imageAlt}
          />
          <FormField
            name="about"
            label="About the event"
            hint="Separate paragraphs with a blank line."
            multiline
            state={state}
            defaultValue={event?.about.join("\n\n")}
          />
          <FormField
            name="included"
            label="What's included"
            hint="One item per line."
            multiline
            state={state}
            defaultValue={event?.included.join("\n")}
          />
        </div>
      </section>

      <section className={card}>
        <RacesEditor
          key={races.map((r) => r.id).join()}
          races={races}
          state={state}
        />
      </section>

      <section className={card} aria-labelledby="payouts-heading">
        <h2 id="payouts-heading" className="mb-1 text-xl md:text-2xl">
          Payouts
        </h2>
        <p className="meta mb-5">
          Registrations are collected by Fun Run. After race day we transfer
          the takings, less the platform commission, to this account.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {payoutAccounts.length ? (
            <FormField
              name="payoutAccountId"
              label="Payout account"
              options={[
                { value: "", label: "Not set" },
                ...payoutAccounts.map((a) => ({ value: a.id, label: payoutAccountLabel(a) })),
              ]}
              state={state}
              defaultValue={event ? (event.payoutAccountId ?? "") : payoutAccounts[0].id}
            />
          ) : (
            <p className="meta sm:col-span-2">
              No payout account yet.{" "}
              <Link href="/dashboard/payouts" className="link">
                Add your bank details
              </Link>{" "}
              to get paid; sales are held until you do.
            </p>
          )}
          {canFeature && (
            <FormField
              name="commissionPercent"
              label="Platform commission (%)"
              inputMode="decimal"
              placeholder={defaultCommission.replace("%", "")}
              hint={`Blank uses the default (${defaultCommission}). Applies to new orders only.`}
              state={state}
              defaultValue={event?.commissionPercent}
            />
          )}
        </div>
      </section>

      <section className={card} aria-labelledby="visibility-heading">
        <h2 id="visibility-heading" className="mb-5 text-xl md:text-2xl">
          Visibility
        </h2>
        <div className="stack gap-3">
          <label className="flex items-start gap-3">
            <input
              key={String(checked("isPublished"))}
              type="checkbox"
              name="isPublished"
              defaultChecked={checked("isPublished")}
              className="mt-1 size-4 accent-brand"
            />
            <span>
              <span className="font-semibold text-ink">Published</span>
              <span className="meta block">
                Live on the site and open for registration. Drafts are only
                visible here.
              </span>
            </span>
          </label>
          {canFeature && (
            <label className="flex items-start gap-3">
              <input
                key={String(checked("isFeatured"))}
                type="checkbox"
                name="isFeatured"
                defaultChecked={checked("isFeatured")}
                className="mt-1 size-4 accent-brand"
              />
              <span>
                <span className="font-semibold text-ink">Featured</span>
                <span className="meta block">Shown first on the homepage.</span>
              </span>
            </label>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton
          className="btn btn-primary"
          pendingLabel={currentSlug ? "Saving…" : "Creating…"}
        >
          {currentSlug ? "Save changes" : "Create event"}
        </SubmitButton>
        {/* Repeats the alert at the top for people who submitted from down here. */}
        {(state.error || state.success) && (
          <p
            aria-hidden="true"
            className={`text-sm ${state.error ? "text-danger" : "text-success"}`}
          >
            {state.error ?? state.success}
          </p>
        )}
      </div>
    </form>
  );
}
