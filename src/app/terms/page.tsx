import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Fun Run as a runner or an event organiser.",
};

const sections: LegalSection[] = [
  {
    id: "about-these-terms",
    title: "About these terms",
    paragraphs: [
      "These terms apply when you browse Fun Run, create an account, register for a run or list an event. By using Fun Run, you agree to them.",
      "Fun Run is a platform. Each run is organised by an independent organiser, who is responsible for the event itself.",
    ],
  },
  {
    id: "your-account",
    title: "Your account",
    paragraphs: [
      "You need to give accurate details and keep your password private. You're responsible for activity on your account. You must be at least 18 to create one; younger runners can be registered by a parent or guardian.",
    ],
  },
  {
    id: "registering",
    title: "Registering for a run",
    paragraphs: [
      "A ticket is confirmed once you receive a confirmation email. Each ticket is for the named runner and distance only.",
    ],
    points: [
      "Check the date, distance, cut-off time and age limit before registering.",
      "Transfers, distance changes and refunds follow the organiser's policy shown on the event page.",
      "If a run is cancelled by the organiser, you'll receive a full refund of the ticket price.",
    ],
  },
  {
    id: "health-and-safety",
    title: "Health and safety",
    paragraphs: [
      "Running carries a risk of injury. By registering, you confirm you're fit to take part in the distance you've chosen and that you'll follow the instructions of marshals and medical staff on race day.",
    ],
  },
  {
    id: "organisers",
    title: "For organisers",
    paragraphs: [
      "If you list an event, the details you publish must be accurate and kept up to date. You must hold any permits the event needs, and you may only use runners' data to run your event.",
      "We may remove listings that are misleading, unsafe or break these terms.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: ["When using Fun Run, you must not:"],
    points: [
      "Resell tickets above face value or register under someone else's name without permission.",
      "Try to access accounts or data that aren't yours, or disrupt the service.",
      "Post content that is unlawful, misleading or infringes someone else's rights.",
    ],
  },
  {
    id: "liability",
    title: "Liability",
    paragraphs: [
      "We work to keep Fun Run accurate and available, but we can't guarantee it will always be error-free. To the extent allowed by law, we're not liable for the conduct of an event, which is the organiser's responsibility. Nothing in these terms limits your rights as a consumer under Philippine law.",
    ],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    paragraphs: [
      "We may update these terms from time to time. If a change is significant, we'll tell registered users by email before it takes effect.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of use"
      updated="6 October 2026"
      intro="The rules for using Fun Run, whether you're registering for a run or organising one."
      sections={sections}
    />
  );
}
