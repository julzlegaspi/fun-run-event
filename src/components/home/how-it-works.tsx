import { MedalIcon, SearchIcon, TicketIcon } from "@/components/icons";

const steps = [
  {
    icon: SearchIcon,
    title: "Find your run",
    body: "Filter by distance, date and vibe, from 1 km kids' dashes to half marathons.",
  },
  {
    icon: TicketIcon,
    title: "Register in minutes",
    body: "Pick a category, add your crew and get your race-day QR straight to your inbox.",
  },
  {
    icon: MedalIcon,
    title: "Show up and finish",
    body: "Collect your bib, run your pace and take home the medal and the photos.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="section container-page">
      <div className="stack gap-10">
        <div className="stack max-w-2xl gap-3">
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading">From sofa to start line</h2>
        </div>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="stack gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon width={24} height={24} />
                </span>
                <span className="font-display text-sm font-bold text-ink-subtle">
                  0{i + 1}
                </span>
              </div>
              <h3>{title}</h3>
              <p className="text-ink-body">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
