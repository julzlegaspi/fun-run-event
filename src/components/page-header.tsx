import Link from "next/link";

// Title block for content pages: breadcrumb, eyebrow, heading and intro,
// on the same tinted band the homepage uses for its secondary sections.
export function PageHeader({
  eyebrow,
  title,
  crumb = title,
  children,
}: {
  eyebrow: string;
  title: string;
  // Breadcrumb label when the heading isn't the page's name.
  crumb?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface-muted">
      <div className="container-page stack gap-4 pt-4 pb-10 md:pt-6 md:pb-14">
        <nav aria-label="Breadcrumb" className="meta mb-2">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {crumb}
            </li>
          </ol>
        </nav>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="max-w-3xl">{title}</h1>
        {children && (
          <div className="max-w-2xl text-lg text-ink-body">{children}</div>
        )}
      </div>
    </div>
  );
}
