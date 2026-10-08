import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Fun Run collects, uses and protects your personal data.",
};

const sections: LegalSection[] = [
  {
    id: "what-we-collect",
    title: "What we collect",
    paragraphs: [
      "We only collect what we need to register you for a run and keep your account working.",
    ],
    points: [
      "Account details: your name, email address and password (stored hashed, never in plain text).",
      "Registration details: the runs and distances you sign up for, plus anything the organiser asks for, such as shirt size, emergency contact or date of birth.",
      "Technical data: your IP address, browser and device type, used to keep the service secure.",
    ],
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    paragraphs: ["We use your data to:"],
    points: [
      "Create and manage your tickets and send race-day details.",
      "Tell you about changes to a run you've registered for.",
      "Prevent fraud and abuse, such as repeated failed sign-ins.",
      "Send updates about new runs, only if you've opted in. You can unsubscribe at any time.",
    ],
  },
  {
    id: "sharing",
    title: "Who we share it with",
    paragraphs: [
      "When you register for a run, we share your registration details with that run's organiser so they can prepare race kits, bibs and safety plans. Organisers may only use this data to run their event.",
      "We also use trusted service providers for hosting, email and payments. They process data on our behalf and under contract. We never sell your personal data.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep it",
    paragraphs: [
      "We keep your account data while your account is open. Registration records are kept for up to three years after an event for results, receipts and dispute handling, then deleted or anonymised.",
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    paragraphs: [
      "Under the Data Privacy Act of 2012 (Republic Act No. 10173), you can ask to access, correct or delete your personal data, object to its processing, or get a copy of it. Email us and we'll respond within 15 working days.",
      "If you're unhappy with how we've handled your data, you can also complain to the National Privacy Commission.",
    ],
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "Data is encrypted in transit, passwords are hashed and access to personal data is limited to people who need it. No system is perfectly secure, so please use a strong, unique password.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paragraphs: [
      "If we make significant changes, we'll update the date at the top of this page and let registered users know by email.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy policy"
      updated="6 October 2026"
      intro="What personal data we collect when you use Fun Run, why we need it and the choices you have."
      sections={sections}
    />
  );
}
