import Link from "next/link";

import { LogoMark } from "@/components/icons";

const columns = [
  {
    heading: "Runners",
    links: ["Find a run", "Free runs", "Kids & family", "Running clubs"],
  },
  {
    heading: "Organisers",
    links: ["Host an event", "Pricing", "Race-day check-in", "Resources"],
  },
  {
    heading: "Company",
    links: ["About", "Help centre", "Privacy", "Terms"],
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
              {column.links.map((label) => (
                <li key={label}>
                  <a href="#" className="link-nav font-medium text-ink-muted">
                    {label}
                  </a>
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
