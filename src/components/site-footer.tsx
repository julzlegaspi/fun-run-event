import Link from "next/link";

import { LogoMark } from "@/components/icons";

const columns = [
  {
    heading: "Runners",
    links: [
      { label: "Find a run", href: "/events" },
      { label: "Free runs", href: "/events?category=Free" },
      { label: "Kids & family", href: "/events?category=Kids" },
      { label: "Running clubs", href: "#" },
    ],
  },
  {
    heading: "Organisers",
    links: [
      { label: "Host an event", href: "/#host" },
      { label: "Pricing", href: "#" },
      { label: "Race-day check-in", href: "#" },
      { label: "Resources", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Help centre", href: "/help" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:grid-cols-3 md:grid-cols-[1.5fr_repeat(3,1fr)] md:py-16">
        <div className="stack col-span-2 max-w-xs gap-3 sm:col-span-3 md:col-span-1">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink"
          >
            <LogoMark />
            Fun Run
          </Link>
          <p className="meta">
            Community runs, colour runs and race days, all in one place.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.heading} className="stack gap-3">
            <h2 className="text-sm font-bold tracking-normal">
              {column.heading}
            </h2>
            <ul className="stack gap-2">
              {column.links.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="link-nav font-medium text-ink-muted">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Fun Run. Sample content for demonstration.</p>
          <p>Photography from Unsplash.</p>
        </div>
      </div>
    </footer>
  );
}
