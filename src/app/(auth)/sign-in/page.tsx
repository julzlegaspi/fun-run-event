import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthHeading } from "@/components/auth/auth-heading";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { SignInForm } from "@/components/auth/sign-in-form";
import { googleEnabled } from "@/lib/auth";
import { getSession, safeRedirect } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = safeRedirect(param(params.next));
  if (await getSession()) redirect(next);

  const signUpHref =
    next === "/account" ? "/sign-up" : `/sign-up?next=${encodeURIComponent(next)}`;

  return (
    <>
      <AuthHeading title="Welcome back">
        Sign in to register for runs and manage your entries.
      </AuthHeading>

      <div className="stack gap-5">
        {param(params.reset) && (
          <p
            role="status"
            className="rounded-sm border border-success/30 bg-success-soft px-3 py-2.5 text-sm text-success"
          >
            Your password has been reset. Sign in with your new password.
          </p>
        )}
        {param(params.error) && (
          <p
            role="alert"
            className="rounded-sm border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger"
          >
            We couldn&apos;t sign you in with Google. Please try again.
          </p>
        )}
        {googleEnabled && (
          <>
            <GoogleButton next={next} />
            <OrDivider />
          </>
        )}
        <SignInForm next={next} />
        <p className="meta text-center">
          New to Fun Run?{" "}
          <Link href={signUpHref} className="link">
            Create an account
          </Link>
        </p>
      </div>
    </>
  );
}
