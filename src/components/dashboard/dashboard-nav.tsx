"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardHref } from "@/lib/dashboard";

// Tabs for one event's dashboard pages.
export function DashboardNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: dashboardHref(slug), label: "Overview" },
    { href: dashboardHref(slug, "participants"), label: "Participants" },
    { href: dashboardHref(slug, "orders"), label: "Orders" },
    { href: dashboardHref(slug, "edit"), label: "Edit" },
  ];
  const active = (href: string) =>
    href === dashboardHref(slug)
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Event dashboard" className="border-b border-line">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={active(tab.href) ? "page" : undefined}
              className="block border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-ink-muted transition-colors hover:text-ink aria-[current=page]:border-brand aria-[current=page]:text-ink"
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
