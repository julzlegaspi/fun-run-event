"use client";

import { useActionState } from "react";

import { checkoutAction } from "@/app/events/[slug]/checkout/actions";
import { SubmitButton } from "@/components/auth/auth-form";
import { ArrowRightIcon } from "@/components/icons";
import { formatMoney } from "@/lib/events";
import {
  GENDERS,
  SHIRT_SIZES,
  runnerField,
  type CheckoutFormState,
  type Participant,
} from "@/lib/registrations";

type RunnerFieldProps = {
  index: number;
  name: keyof Participant;
  label: string;
  state: CheckoutFormState;
  defaultValue?: string;
  options?: readonly string[];
} & Omit<React.ComponentProps<"input">, "name" | "defaultValue">;

// Label, input (or select) and inline error for one runner field. Keyed on the
// submitted value so React resets it to the server's copy after an error.
function RunnerField({
  index,
  name,
  label,
  state,
  defaultValue = "",
  options,
  ...props
}: RunnerFieldProps) {
  const fieldName = runnerField(index, name);
  const id = `field-${fieldName}`;
  const error = state.fieldErrors?.[fieldName];
  const value = state.values?.[fieldName] ?? defaultValue;
  const shared = {
    id,
    name: fieldName,
    defaultValue: value,
    className: "input aria-invalid:border-danger",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {options ? (
        <select key={value} {...shared}>
          <option value="" disabled>
            Select…
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input key={value} {...shared} {...props} />
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({
  slug,
  raceId,
  quantity,
  total,
  account,
}: {
  slug: string;
  raceId: string;
  quantity: number;
  total: number;
  account: { name: string; email: string };
}) {
  const [state, formAction] = useActionState(checkoutAction, {});
  const free = total === 0;

  return (
    <form action={formAction} className="stack gap-6" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="raceId" value={raceId} />
      <input type="hidden" name="quantity" value={quantity} />

      {state.error && (
        <p
          role="alert"
          className="rounded-sm border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      {Array.from({ length: quantity }, (_, i) => (
        <fieldset
          key={i}
          className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6"
        >
          <legend className="sr-only">Runner {i + 1}</legend>
          <div className="stack mb-5 gap-1">
            <h2 aria-hidden="true" className="text-xl md:text-2xl">
              Runner {i + 1}
            </h2>
            {i === 0 && (
              <p className="meta">
                Race kit details go to this runner&apos;s email.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <RunnerField
                index={i}
                name="fullName"
                label="Full name (as on ID)"
                state={state}
                defaultValue={i === 0 ? account.name : ""}
                autoComplete={i === 0 ? "name" : "off"}
              />
            </div>
            <RunnerField
              index={i}
              name="email"
              label="Email"
              type="email"
              state={state}
              defaultValue={i === 0 ? account.email : ""}
              autoComplete={i === 0 ? "email" : "off"}
            />
            <RunnerField
              index={i}
              name="phone"
              label="Mobile number"
              type="tel"
              placeholder="0917 123 4567"
              state={state}
              autoComplete={i === 0 ? "tel" : "off"}
            />
            <RunnerField
              index={i}
              name="birthdate"
              label="Date of birth"
              type="date"
              state={state}
              autoComplete={i === 0 ? "bday" : "off"}
            />
            <RunnerField
              index={i}
              name="gender"
              label="Gender"
              options={GENDERS}
              state={state}
            />
            <RunnerField
              index={i}
              name="shirtSize"
              label="Shirt size"
              options={SHIRT_SIZES}
              state={state}
            />
          </div>

          <hr className="divider my-5" />
          <p className="label">Emergency contact</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <RunnerField
              index={i}
              name="emergencyName"
              label="Name"
              state={state}
              autoComplete="off"
            />
            <RunnerField
              index={i}
              name="emergencyPhone"
              label="Mobile number"
              type="tel"
              state={state}
              autoComplete="off"
            />
          </div>
        </fieldset>
      ))}

      <div className="stack gap-3">
        <SubmitButton
          className="btn btn-primary btn-lg w-full"
          pendingLabel={free ? "Confirming…" : "Starting secure payment…"}
        >
          {free
            ? "Confirm free registration"
            : `Pay ${formatMoney(total)} with HitPay`}
          <ArrowRightIcon />
        </SubmitButton>
        {!free && (
          <p className="meta text-center text-xs">
            You&apos;ll finish payment on HitPay&apos;s secure checkout by card,
            e-wallet or QR, then come back here.
          </p>
        )}
      </div>
    </form>
  );
}
