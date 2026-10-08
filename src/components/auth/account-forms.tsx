"use client";

import { useActionState, useEffect } from "react";

import { changePasswordAction, updateNameAction } from "@/app/account/actions";
import {
  Field,
  FormMessage,
  refreshSession,
  SubmitButton,
} from "@/components/auth/auth-form";

export function UpdateNameForm({ name }: { name: string }) {
  const [state, formAction] = useActionState(updateNameAction, {});

  // The header menu shows the name, so refetch the client session.
  useEffect(() => {
    if (state.success) refreshSession();
  }, [state]);

  return (
    <form action={formAction} className="stack gap-4" noValidate>
      <FormMessage state={state} />
      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        required
        defaultValue={state.values?.name ?? name}
      />
      <SubmitButton pendingLabel="Saving…" className="btn btn-primary self-start">
        Save name
      </SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="stack gap-4" noValidate>
      <FormMessage state={state} />
      <Field
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
      />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="At least 8 characters."
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
      />
      <SubmitButton
        pendingLabel="Updating…"
        className="btn btn-primary self-start"
      >
        Change password
      </SubmitButton>
    </form>
  );
}
