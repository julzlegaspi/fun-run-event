"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { authClient } from "@/lib/auth-client";
import type { AuthFormState } from "@/lib/auth-form";

type Action = (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;

// Server actions set the session cookie, but the client `useSession` store
// (used by the header) doesn't see that, so tell it to refetch.
export function refreshSession() {
  authClient.$store.notify("$sessionSignal");
}

// `useActionState` plus the post-success step: refresh the client session and
// go to `redirectTo` when the action returns one.
export function useAuthAction(action: Action) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (!state.redirectTo) return;
    refreshSession();
    router.push(state.redirectTo);
    router.refresh();
  }, [state, router]);

  return [state, formAction, pending] as const;
}

export function Field({
  label,
  name,
  hint,
  ...props
}: ComponentProps<"input"> & { label: string; name: string; hint?: string }) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        className="input"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormMessage({ state }: { state: AuthFormState }) {
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

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary w-full",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
