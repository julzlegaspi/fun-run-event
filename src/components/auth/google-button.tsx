"use client";

import { signInWithGoogleAction } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/auth/auth-form";
import { GoogleIcon } from "@/components/icons";

export function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogleAction}>
      {next && <input type="hidden" name="next" value={next} />}
      <SubmitButton
        pendingLabel="Redirecting to Google…"
        className="btn btn-secondary w-full"
      >
        <GoogleIcon />
        Continue with Google
      </SubmitButton>
    </form>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-ink-muted">
      <hr className="divider flex-1" />
      or
      <hr className="divider flex-1" />
    </div>
  );
}
