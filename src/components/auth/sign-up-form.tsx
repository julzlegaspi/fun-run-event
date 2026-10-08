"use client";

import { signUpAction } from "@/app/(auth)/actions";
import {
  Field,
  FormMessage,
  SubmitButton,
  useAuthAction,
} from "@/components/auth/auth-form";

export function SignUpForm({
  next,
  asOrganizer = false,
}: {
  next?: string;
  asOrganizer?: boolean;
}) {
  const [state, formAction] = useAuthAction(signUpAction);

  return (
    <form action={formAction} className="stack gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {asOrganizer && <input type="hidden" name="accountType" value="organizer" />}
      <FormMessage state={state} />
      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        required
        defaultValue={state.values?.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="At least 8 characters."
      />
      <Field
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
      />
      <SubmitButton pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
