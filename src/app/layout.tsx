import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Body/UI text. Wired into Tailwind's `font-sans` in globals.css.
const geistSans = Geist({
  variable: "--font-body",
  subsets: ["latin"],
});

// Headings and card titles. Wired into `font-display` in globals.css.
const display = Plus_Jakarta_Sans({
  variable: "--font-display-face",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Fun Run", template: "%s � Fun Run" },
  description: "Fun Run event registration",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${display.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Leave room for the fixed mobile ticket bar on event pages. */}
      <body className="flex min-h-full flex-col bg-surface text-ink-body has-[#tickets]:pb-20 lg:has-[#tickets]:pb-0">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
