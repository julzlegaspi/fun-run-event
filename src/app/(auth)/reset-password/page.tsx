import type { Metadata } from "next";
import Link from "next/link";

import { AuthHeading } from "@/components/auth/auth-heading";
import { ResetPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = { title: "Reset password" };

// Better Auth redirects here from the emailed link with `?token=…`, or with
// `?error=INVALID_TOKEN` when the link is expired or already used.
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token, error } = await searchParams;
  const validToken = typeof token === "string" && token && !error ? token : null;

  if (!validToken)
    return (
      <>
        <AuthHeading title="Link expired">
          This password reset link is invalid or has already been used. Reset
          links work once and expire after an hour.
        </AuthHeading>
        <Link href="/forgot-password" className="btn btn-primary w-full">
          Request a new link
        </Link>
      </>
    );

  return (
    <>
      <AuthHeading title="Set a new password">
        Choose a new password for your Fun Run account. You&apos;ll be signed
        out on other devices.
      </AuthHeading>
      <ResetPasswordForm token={validToken} />
    </>
  );
}
