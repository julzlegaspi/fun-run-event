"use client";

import Link from "next/link";

import { signInAction } from "@/app/(auth)/actions";
import {
  Field,
  FormMessage,
  SubmitButton,
  useAuthAction,
} from "@/components/auth/auth-form";

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction] = useAuthAction(signInAction);

  return (
    <form action={formAction} className="stack gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormMessage state={state} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
      />
      <div>
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Link href="/forgot-password" className="link mt-2 inline-block text-sm">
          Forgot password?
        </Link>
      </div>
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
