import type { Metadata } from "next";
import Link from "next/link";

import { AuthHeading } from "@/components/auth/auth-heading";
import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Forgot your password?">
        Enter the email you signed up with and we&apos;ll send you a link to
        set a new one.
      </AuthHeading>

      <div className="stack gap-5">
        <ForgotPasswordForm />
        <p className="meta text-center">
          Remembered it?{" "}
          <Link href="/sign-in" className="link">
            Back to sign in
          </Link>
        </p>
      </div>
    </>
  );
}
