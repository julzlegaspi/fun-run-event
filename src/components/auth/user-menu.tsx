"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { authClient } from "@/lib/auth-client";
import { isOrganizer } from "@/lib/dashboard";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : ""))
    .toUpperCase();
}

// Read on the client so the header stays static on ISR pages.
export function UserMenu({ variant }: { variant: "desktop" | "mobile" }) {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();

  const signInHref =
    pathname === "/" || pathname.startsWith("/sign-") || pathname.endsWith("-password")
      ? "/sign-in"
      : `/sign-in?next=${encodeURIComponent(pathname)}`;

  if (isPending)
    return variant === "desktop" ? (
      <span aria-hidden="true" className="size-9 rounded-full bg-surface-sunken" />
    ) : null;

  if (!session)
    return (
      <Link
        href={signInHref}
        className={
          variant === "desktop"
            ? "btn btn-ghost btn-sm"
            : "btn btn-secondary btn-sm w-full"
        }
      >
        Sign in
      </Link>
    );

  const { user } = session;
  const organizer = isOrganizer(user);

  if (variant === "mobile")
    return (
      <>
        <p className="truncate px-2 text-sm font-semibold text-ink">{user.name}</p>
        {organizer && (
          <Link href="/dashboard" className="btn btn-secondary btn-sm w-full">
            Dashboard
          </Link>
        )}
        <Link href="/account" className="btn btn-secondary btn-sm w-full">
          My account
        </Link>
        <SignOutButton className="btn btn-ghost btn-sm w-full" />
      </>
    );

  return (
    // Key on the path so the dropdown closes after navigating.
    <details key={pathname} className="relative">
      <summary
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand [&::-webkit-details-marker]:hidden"
        aria-label="Account menu"
      >
        {initials(user.name) || "?"}
      </summary>
      <div className="absolute right-0 mt-2 w-64 rounded-lg border border-line bg-surface p-2 shadow-overlay">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-muted">{user.email}</p>
        </div>
        <hr className="divider my-1" />
        {organizer && (
          <Link
            href="/dashboard"
            className="block rounded-sm px-3 py-2.5 text-sm font-semibold text-ink-body hover:bg-surface-muted"
          >
            Dashboard
          </Link>
        )}
        <Link
          href="/account"
          className="block rounded-sm px-3 py-2.5 text-sm font-semibold text-ink-body hover:bg-surface-muted"
        >
          My account
        </Link>
        <SignOutButton className="block w-full rounded-sm px-3 py-2.5 text-left text-sm font-semibold text-ink-body hover:bg-surface-muted disabled:opacity-50" />
      </div>
    </details>
  );
}
