"use client";

import { useActionState } from "react";

import {
  releasePayoutAction,
  savePayoutAccountAction,
} from "@/app/dashboard/payouts/actions";
import { SubmitButton } from "@/components/auth/auth-form";
import { FormAlert, FormField } from "@/components/dashboard/form-field";
import { formatRevenue } from "@/lib/dashboard";
import type { Bank } from "@/lib/payouts";

// Bank details are sent straight to HitPay; we keep only the last 4 digits.
export function PayoutAccountForm({
  banks,
  email,
  replacing,
}: {
  banks: Bank[];
  email: string;
  replacing: boolean;
}) {
  const [state, formAction] = useActionState(savePayoutAccountAction, {});
  return (
    <form action={formAction} className="stack gap-4" noValidate>
      <FormAlert state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          name="holderName"
          label="Account holder name"
          autoComplete="name"
          hint="Exactly as the bank has it."
          state={state}
        />
        <FormField
          name="bankCode"
          label="Bank"
          options={[{ value: "", label: "Select…" }, ...banks]}
          state={state}
        />
        <FormField
          name="accountNumber"
          label="Account number"
          inputMode="numeric"
          autoComplete="off"
          state={state}
        />
        <FormField
          name="email"
          label="Email for payout notices"
          type="email"
          state={state}
          defaultValue={email}
        />
        <FormField
          className="sm:col-span-2"
          name="street"
          label="Street address"
          autoComplete="street-address"
          state={state}
        />
        <FormField name="city" label="City" autoComplete="address-level2" state={state} />
        <FormField
          name="postcode"
          label="ZIP code"
          inputMode="numeric"
          autoComplete="postal-code"
          state={state}
        />
      </div>
      <div>
        <SubmitButton className="btn btn-primary" pendingLabel="Saving…">
          {replacing ? "Replace account" : "Save payout account"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function ReleasePayoutForm({
  eventId,
  amount,
}: {
  eventId: string;
  amount: number;
}) {
  const [state, formAction] = useActionState(releasePayoutAction, {});
  return (
    <form action={formAction} className="stack items-end gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Sending…">
        Pay out {formatRevenue(amount)}
      </SubmitButton>
      {state.error && (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
