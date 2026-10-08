import type { Metadata } from "next";
import Link from "next/link";

import {
  CalendarIcon,
  MedalIcon,
  RouteIcon,
  SearchIcon,
  TicketIcon,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Help centre",
  description:
    "Answers about finding runs, tickets, race day and hosting an event on Fun Run.",
};

const topics = [
  {
    id: "finding-a-run",
    icon: SearchIcon,
    title: "Finding a run",
    blurb: "Search, filters and what each event page tells you.",
    faqs: [
      {
        q: "How do I find runs near me?",
        a: "Go to Find a run and search for your city or venue, for example “Quezon City” or “Iloilo”. You can then narrow the list by category, such as 5K, Trail or Kids.",
      },
      {
        q: "Are there free runs?",
        a: "Yes. Pick the Free filter on Find a run to see every event with at least one free category. Free runs still need a ticket so the organiser can plan bibs and water.",
      },
      {
        q: "What does “Almost full” mean?",
        a: "Fewer than a handful of slots are left in at least one distance. Slot counts are shown per distance on the event page.",
      },
    ],
  },
  {
    id: "tickets",
    icon: TicketIcon,
    title: "Tickets and registration",
    blurb: "Choosing a distance, confirmations and changes.",
    faqs: [
      {
        q: "Can I register friends or family?",
        a: "Yes. Choose a distance on the event page and add each runner. Every runner gets their own ticket with their name, distance and race-day QR code.",
      },
      {
        q: "I didn’t get my confirmation email.",
        a: "Check your spam or promotions folder first. If it isn’t there after 15 minutes, contact us with the email you registered with and the event name.",
      },
      {
        q: "Can I switch to a different distance?",
        a: "Many organisers allow distance changes until race-kit claiming starts. The event page lists the organiser’s policy; contact the organiser directly to request a change.",
      },
      {
        q: "Can I get a refund?",
        a: "Refunds are set by each organiser. If an event is cancelled, you’ll be refunded in full automatically.",
      },
    ],
  },
  {
    id: "race-day",
    icon: MedalIcon,
    title: "Race day",
    blurb: "Race kits, flag-off times and cut-offs.",
    faqs: [
      {
        q: "When should I arrive?",
        a: "Aim to arrive at least 45 minutes before your distance’s flag-off. Each event page has a race-day schedule with assembly, warm-up and flag-off times.",
      },
      {
        q: "What happens if I miss the cut-off?",
        a: "Marshals may move you to the sidewalk or ask you to board the sweeper vehicle so roads can reopen on time. You can still claim your finisher’s items at the venue.",
      },
      {
        q: "Is there a minimum age?",
        a: "Some distances have a minimum age, shown in the Distance options table on the event page. Runners under 18 need a parent or guardian’s consent.",
      },
    ],
  },
  {
    id: "event-changes",
    icon: CalendarIcon,
    title: "Postponed or cancelled runs",
    blurb: "Weather, route changes and what happens to your ticket.",
    faqs: [
      {
        q: "What if a run is postponed?",
        a: "Your ticket moves to the new date automatically and we’ll email you. If you can’t make the new date, you can ask the organiser for a refund.",
      },
      {
        q: "Will I be told if the route changes?",
        a: "Yes. Organisers update the event page and we email every registered runner about changes to the venue, route or flag-off time.",
      },
    ],
  },
  {
    id: "organisers",
    icon: RouteIcon,
    title: "Hosting an event",
    blurb: "Publishing a run and managing sign-ups.",
    faqs: [
      {
        q: "How much does it cost to list a run?",
        a: "Listing a free community run costs nothing. For paid runs, a small fee per ticket sold is deducted before payout.",
      },
      {
        q: "Can I offer several distances in one event?",
        a: "Yes. Each distance has its own price, flag-off time, cut-off, age limit and number of slots.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help centre"
        title="How can we help?"
        crumb="Help centre"
      >
        <p>
          Quick answers about finding a run, registering, race day and hosting
          your own event.
        </p>
      </PageHeader>

      <section
        aria-labelledby="topics-heading"
        className="section container-page"
      >
        <div className="stack gap-8">
          <h2 id="topics-heading" className="sr-only">
            Browse by topic
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map(({ id, icon: Icon, title, blurb }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="card card-outline h-full flex-row items-start gap-4 p-5"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Icon />
                  </span>
                  <span className="stack min-w-0 gap-1">
                    <span className="font-display font-bold text-ink">
                      {title}
                    </span>
                    <span className="meta">{blurb}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="faq-heading"
        className="section border-t border-line bg-surface-muted"
      >
        <div className="container-content stack gap-12">
          <div className="stack gap-3">
            <p className="eyebrow">FAQs</p>
            <h2 id="faq-heading">Common questions</h2>
          </div>

          {topics.map(({ id, title, faqs }) => (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-heading`}
              className="stack scroll-mt-24 gap-4"
            >
              <h3 id={`${id}-heading`}>{title}</h3>
              <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {faqs.map(({ q, a }) => (
                  <details key={q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
                      {q}
                      <span
                        aria-hidden="true"
                        className="font-display text-xl leading-none text-ink-muted transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-prose px-5 pb-5">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="contact-heading"
        className="section container-page"
      >
        <div className="flex flex-col gap-6 rounded-xl border border-line p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="stack gap-2">
            <h2 id="contact-heading" className="text-xl md:text-2xl">
              Still need help?
            </h2>
            <p className="max-w-xl">
              Send us your question with the event name and the email you
              registered with. We reply within one working day.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:help@funrun.example"
              className="btn btn-primary"
            >
              Email support
            </a>
            <Link href="/events" className="btn btn-secondary">
              Find a run
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
