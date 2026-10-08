// Server-only by use (imported from auth.ts), but no `server-only` import:
// the `auth generate` CLI loads auth.ts outside Next.js and would throw.
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.EMAIL_FROM ?? "Fun Run <onboarding@resend.dev>";

// Sends through Resend; without RESEND_API_KEY (local dev) it logs the email
// so links such as password resets can still be followed.
export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!resend) {
    console.info(`\n[email] to: ${to}\n[email] subject: ${subject}\n${text}\n`);
    return;
  }

  const { error } = await resend.emails.send({ from, to, subject, text });
  if (error) throw new Error(`Failed to send email: ${error.message}`);
}
