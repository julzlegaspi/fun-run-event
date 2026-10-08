"use client";

import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/app/(auth)/actions";
import {
  Field,
  FormMessage,
  SubmitButton,
  useAuthAction,
} from "@/components/auth/auth-form";

export function ForgotPasswordForm() {
  const [state, formAction] = useAuthAction(requestPasswordResetAction);

  return (
    <form action={formAction} className="stack gap-4" noValidate>
      <FormMessage state={state} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
      />
      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useAuthAction(resetPasswordAction);

  return (
    <form action={formAction} className="stack gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
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
      <SubmitButton pendingLabel="Saving…">Set new password</SubmitButton>
    </form>
  );
}
