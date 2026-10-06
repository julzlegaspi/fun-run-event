import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Same env file Next.js reads in development.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
