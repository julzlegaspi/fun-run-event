import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HostCta } from "@/components/home/host-cta";
import {
  ArrowRightIcon,
  HeartIcon,
  PinIcon,
  RouteIcon,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { unsplash } from "@/lib/events";

export const metadata: Metadata = {
  title: "About",
  description:
    "Fun Run brings community runs, colour runs and race days across the Philippines into one place.",
};

const values = [
  {
    icon: HeartIcon,
    title: "Every pace is welcome",
    body: "Walkers, first-timers, kids and sub-40 10K runners all get the same clear details and the same easy sign-up.",
  },
  {
    icon: PinIcon,
    title: "Local first",
    body: "We list runs organised by clubs, schools and communities near you, not just the big city marathons.",
  },
  {
    icon: RouteIcon,
    title: "No surprises on race day",
    body: "Flag-off times, cut-offs, age limits and what's in the race kit are on every event page before you pay.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Fun Run"
        title="Built for the start line"
        crumb="About"
      >
        <p>
          Fun Run is where runners in the Philippines find their next race and
          where organisers fill their start corrals, from barangay fun runs to
          trail half marathons.
        </p>
      </PageHeader>

      <section
        aria-labelledby="story-heading"
        className="section container-page"
      >
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="stack gap-4">
            <p className="eyebrow">Our story</p>
            <h2 id="story-heading">Race info shouldn&apos;t live in a group chat</h2>
            <p className="max-w-prose text-lg">
              Most local runs are announced on a poster, a social post and a
              spreadsheet of sign-ups. Details change, slots run out and
              runners find out on race morning.
            </p>
            <p className="max-w-prose text-lg">
              We started Fun Run to put it all in one place: every distance,
              price, flag-off time and slot count for a run on a single page,
              and a ticket in your inbox a few minutes later.
            </p>
            <Link href="/events" className="link mt-2 inline-flex items-center gap-1.5 self-start">
              Browse upcoming runs
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-sunken">
            <Image
              src={unsplash("1745790289741-12a211a8325d")}
              alt="A crowd of runners streaming through a sunny city street"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="values-heading"
        className="section border-y border-line bg-surface-muted"
      >
        <div className="container-page stack gap-10">
          <div className="stack max-w-2xl gap-3">
            <p className="eyebrow">What we care about</p>
            <h2 id="values-heading">Running is better together</h2>
          </div>
          <ul className="grid gap-8 md:grid-cols-3">
            {values.map(({ icon: Icon, title, body }) => (
              <li key={title} className="stack gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon width={24} height={24} />
                </span>
                <h3>{title}</h3>
                <p className="text-ink-body">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HostCta />
    </>
  );
}
