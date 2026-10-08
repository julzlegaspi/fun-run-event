"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOutAction } from "@/app/(auth)/actions";
import { refreshSession } from "@/components/auth/auth-form";

export function SignOutButton({
  className = "btn btn-secondary btn-sm",
}: {
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOutAction();
          refreshSession();
          router.push("/");
          router.refresh();
        })
      }
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
