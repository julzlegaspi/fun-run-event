// Sets a user's role, e.g. to bootstrap the first admin.
// Run with `npm run user:role -- someone@example.com admin`.
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { USER_ROLES, type UserRole } from "@/lib/dashboard";

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !USER_ROLES.includes(role as UserRole)) {
    console.error(`Usage: npm run user:role -- <email> <${USER_ROLES.join("|")}>`);
    process.exitCode = 1;
    return;
  }

  const updated = await db
    .update(user)
    .set({ role: role as UserRole })
    .where(eq(user.email, email.toLowerCase()))
    .returning({ id: user.id });
  if (!updated.length) {
    console.error(`No user with email ${email}. They need to sign up first.`);
    process.exitCode = 1;
    return;
  }
  console.log(`${email} is now ${role}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
