import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { unsplash } from "@/lib/events";

export function HostCta() {
  return (
    <section id="host" aria-labelledby="host-heading" className="section container-page scroll-mt-16">
      <div className="relative isolate grid overflow-hidden rounded-xl bg-[#13162a] text-white md:grid-cols-2">
        <div className="stack justify-center gap-5 p-8 sm:p-10 lg:p-14">
          <p className="eyebrow text-white/70">For organisers</p>
          <h2 id="host-heading" className="text-white">
            Hosting a run? Fill every start corral.
          </h2>
          <p className="text-white/80">
            Publish your event, sell tiered tickets and manage race-day
            check-in from one dashboard. Free for community runs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up?as=organizer" className="btn btn-primary btn-lg">
              Create your event
              <ArrowRightIcon />
            </Link>
            <a
              href="#"
              className="btn btn-lg border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              See how it works
            </a>
          </div>
        </div>
        <div className="relative min-h-64 md:min-h-full">
          <Image
            src={unsplash("1700914299726-ff93b1bd2d05")}
            alt="Young runners racing around a red athletics track"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
