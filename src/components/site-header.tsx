import Link from "next/link";

import { UserMenu } from "@/components/auth/user-menu";
import { LogoMark, MenuIcon } from "@/components/icons";

const nav = [
  { href: "/events", label: "Find a run" },
  { href: "/#collections", label: "Collections" },
  { href: "/#host", label: "Host an event" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink"
        >
          <LogoMark />
          Fun Run
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="link-nav">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <UserMenu variant="desktop" />
          <Link href="/sign-up?as=organizer" className="btn btn-primary btn-sm">
            Create event
          </Link>
        </div>

        {/* No-JS mobile menu */}
        <details className="group relative md:hidden">
          <summary
            className="btn btn-ghost btn-icon list-none [&::-webkit-details-marker]:hidden"
            aria-label="Open menu"
          >
            <MenuIcon />
          </summary>
          <div className="absolute right-0 mt-2 w-60 rounded-lg border border-line bg-surface p-2 shadow-overlay">
            <nav aria-label="Mobile" className="stack gap-0">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-sm px-3 py-2.5 text-sm font-semibold text-ink-body hover:bg-surface-muted"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <hr className="divider my-2" />
            <div className="stack gap-2 p-1">
              <UserMenu variant="mobile" />
              <Link href="/sign-up?as=organizer" className="btn btn-primary btn-sm w-full">
                Create event
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
