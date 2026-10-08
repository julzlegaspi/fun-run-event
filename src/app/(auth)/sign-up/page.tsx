import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthHeading } from "@/components/auth/auth-heading";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { googleEnabled } from "@/lib/auth";
import { isOrganizer } from "@/lib/dashboard";
import { getSession, safeRedirect } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignUpPage({
  searchParams,
}: PageProps<"/sign-up">) {
  const { next: nextParam, as } = await searchParams;
  const asOrganizer = as === "organizer";
  const next = safeRedirect(
    Array.isArray(nextParam) ? nextParam[0] : nextParam,
    asOrganizer ? "/dashboard/events/new" : undefined,
  );
  const session = await getSession();
  if (session) {
    // `?as=organizer` doubles as the "Create event" link, so route signed-in
    // users to the form, or to their account page to become an organizer.
    if (!asOrganizer) redirect(next);
    redirect(isOrganizer(session.user) ? next : "/account#organizer");
  }

  const signInHref =
    next === "/account" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(next)}`;

  return (
    <>
      {asOrganizer ? (
        <AuthHeading title="Create your organizer account">
          List your run, take registrations and track sales in one place.
        </AuthHeading>
      ) : (
        <AuthHeading title="Create your account">
          One account for every run you join on Fun Run.
        </AuthHeading>
      )}

      <div className="stack gap-5">
        {googleEnabled && !asOrganizer && (
          <>
            <GoogleButton next={next} />
            <OrDivider />
          </>
        )}
        <SignUpForm next={next} asOrganizer={asOrganizer} />
        <p className="text-center text-xs text-ink-muted">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="link">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="link">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="meta text-center">
          Already have an account?{" "}
          <Link href={signInHref} className="link">
            Sign in
          </Link>
        </p>
        <p className="meta text-center">
          {asOrganizer ? (
            <>
              Just running?{" "}
              <Link href="/sign-up" className="link">
                Create a runner account
              </Link>
            </>
          ) : (
            <>
              Organizing a run?{" "}
              <Link href="/sign-up?as=organizer" className="link">
                Sign up as an organizer
              </Link>
            </>
          )}
        </p>
      </div>
    </>
  );
}
