import { Collections } from "@/components/home/collections";
import { EventExplorer } from "@/components/home/event-explorer";
import { FeaturedEvent } from "@/components/home/featured-event";
import { Hero } from "@/components/home/hero";
import { HostCta } from "@/components/home/host-cta";
import { HowItWorks } from "@/components/home/how-it-works";
import { getEvents, getFeaturedEvent } from "@/db/queries/events";
import { categories } from "@/lib/events";

export const revalidate = 60;

export default async function Home() {
  const [events, featuredEvent] = await Promise.all([
    getEvents(),
    getFeaturedEvent(),
  ]);

  return (
    <>
      <Hero />

      {featuredEvent && <FeaturedEvent event={featuredEvent} />}

      <section
        id="events"
        aria-labelledby="events-heading"
        className="section container-page scroll-mt-16 pt-0 md:pt-0"
      >
        <div className="stack gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="stack max-w-2xl gap-3">
              <p className="eyebrow">Upcoming in the Philippines</p>
              <h2 id="events-heading">Runs worth setting an alarm for</h2>
            </div>
            <a href="#events" className="link text-sm">
              See all runs
            </a>
          </div>
          <EventExplorer events={events} categories={categories} />
        </div>
      </section>

      <Collections />
      <HowItWorks />
      <HostCta />
    </>
  );
}
