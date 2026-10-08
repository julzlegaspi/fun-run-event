import Link from "next/link";

import { PageHeader } from "@/components/page-header";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
};

// Long-form policy page: header band, sticky contents list on desktop and
// numbered sections in a readable column.
export function LegalDocument({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader eyebrow="Legal" title={title}>
        <p>{intro}</p>
        <p className="meta mt-3">Last updated {updated}</p>
      </PageHeader>

      <div className="section container-page">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-16">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-sm font-bold text-ink">On this page</p>
            <ol className="stack gap-2 border-l-2 border-line pl-4">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="link-nav font-medium text-ink-muted">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="stack max-w-prose min-w-0 gap-10">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                aria-labelledby={`${s.id}-heading`}
                className="stack scroll-mt-24 gap-3"
              >
                <h2 id={`${s.id}-heading`} className="text-xl md:text-2xl">
                  <span className="text-ink-subtle">{i + 1}.</span> {s.title}
                </h2>
                {s.paragraphs.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
                {s.points && (
                  <ul className="stack list-disc gap-2 pl-5 marker:text-brand">
                    {s.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <div className="rounded-xl bg-surface-muted p-5">
              <p>
                Questions about this page? Visit the{" "}
                <Link href="/help" className="link">
                  Help centre
                </Link>{" "}
                or email{" "}
                <a href="mailto:help@funrun.example" className="link">
                  help@funrun.example
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
