import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { USER_ROLES } from "@/lib/dashboard";

// Mirrors the `role` additionalField in src/lib/auth.ts, so the client session
// is typed without importing the server config.
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: { role: { type: [...USER_ROLES], input: false } },
    }),
  ],
});
