# Fun Run

Next.js app for a Fun Run event. Scaffold only; no event features are built yet.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, `src/` dir)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Better Auth](https://better-auth.com): email and password enabled
- [Drizzle ORM](https://orm.drizzle.team) + drizzle-kit
- [Neon](https://neon.tech) serverless Postgres (WebSocket `Pool` driver)

## Getting started

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run dev
```

Use `.env` rather than `.env.local`, because `drizzle.config.ts` loads env via `dotenv/config`.

### Setting up the database

1. Generate the Better Auth tables: `npm run auth:generate` (writes `src/db/schema/auth.ts`)
2. Re-export them from `src/db/schema/index.ts`: `export * from "./auth";`
3. Create and apply migrations: `npm run db:generate && npm run db:migrate`
   (or `npm run db:push` while prototyping)

## Project structure

```
src/
  app/
    api/auth/[...all]/route.ts   Better Auth route handler
    layout.tsx, page.tsx         Placeholder shell
  db/
    index.ts                     Drizzle client (Neon)
    schema/index.ts              Schema barrel (empty)
  lib/
    auth.ts                      Better Auth server instance
    auth-client.ts               Better Auth React client
drizzle.config.ts                drizzle-kit config (migrations → ./drizzle)
```

## Scripts

| Script | Purpose |
| --- | --- |
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `auth:generate` | Generate the Better Auth Drizzle schema |
| `db:generate` / `db:migrate` / `db:push` / `db:studio` | drizzle-kit |
