"use client";

import { useState } from "react";

import { EventCard } from "@/components/event-card";
import type { EventCategory, RunEvent } from "@/lib/events";

export type Filter = "All" | "Free" | EventCategory;

export function EventExplorer({
  events,
  categories,
  initialFilter = "All",
}: {
  events: RunEvent[];
  categories: EventCategory[];
  initialFilter?: Filter;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);

  const filters: Filter[] = [
    "All",
    "Free",
    ...categories.filter(
      (c) => c === filter || events.some((e) => e.category === c),
    ),
  ];

  const visible = events.filter((event) => {
    if (filter === "All") return true;
    if (filter === "Free") return event.priceFrom === 0;
    return event.category === filter;
  });

  return (
    <div className="stack gap-8">
      <div className="rail -mx-4 scroll-px-4 px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className="chip"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="grid-cards">
          {visible.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      ) : (
        <p className="meta rounded-lg border border-dashed border-line-strong p-10 text-center">
          No runs match this filter yet. Try another category.
        </p>
      )}
    </div>
  );
}
