import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import { USER_ROLES } from "@/lib/dashboard";
import { sendEmail } from "@/lib/email";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Google sign-in is optional locally; the button only renders when it's configured.
export const googleEnabled = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Fun Run password",
        text: `Hi ${user.name},\n\nReset your password here: ${url}\n\nThe link expires in 1 hour. If you didn't ask for this, you can ignore this email.`,
      });
    },
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        },
      }
    : {},
  user: {
    additionalFields: {
      // See USER_ROLES. Never client-settable: organizers are promoted
      // server-side (setUserRole), admins with `npm run user:role`.
      role: {
        type: [...USER_ROLES],
        defaultValue: "participant",
        input: false,
      },
    },
  },
  account: {
    // A Google login with an email that already signed up links to that user.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  // nextCookies must be the last plugin.
  plugins: [nextCookies()],
});
