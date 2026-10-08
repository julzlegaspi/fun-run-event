import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

// Narrow centered card for sign-in, sign-up and password reset.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bg-surface-muted py-10 md:py-16">
      <div className="container-narrow">
        <div className="rounded-xl border border-line bg-surface p-6 shadow-card sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
