"use client";

import type { DashboardFormState } from "@/lib/dashboard";

type FormFieldProps = {
  name: string;
  label: string;
  state: DashboardFormState;
  defaultValue?: string;
  hint?: string;
  options?: readonly { value: string; label: string }[];
  multiline?: boolean;
  className?: string;
} & Omit<React.ComponentProps<"input">, "name" | "defaultValue" | "className">;

// Label, input/select/textarea, hint and inline error. Keyed on the value so
// React resets it to the server's copy after an error, like the checkout form.
export function FormField({
  name,
  label,
  state,
  defaultValue = "",
  hint,
  options,
  multiline,
  className,
  ...props
}: FormFieldProps) {
  const id = `field-${name}`;
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? defaultValue;
  const describedBy =
    [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") ||
    undefined;
  const shared = {
    id,
    name,
    defaultValue: value,
    className: "input aria-invalid:border-danger",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {options ? (
        <select key={value} {...shared}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea key={value} rows={5} {...shared} className={`${shared.className} py-2.5`} />
      ) : (
        <input key={value} {...shared} {...props} />
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ state }: { state: DashboardFormState }) {
  if (state.error)
    return (
      <p
        role="alert"
        className="rounded-sm border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger"
      >
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p
        role="status"
        className="rounded-sm border border-success/30 bg-success-soft px-3 py-2.5 text-sm text-success"
      >
        {state.success}
      </p>
    );
  return null;
}
