ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'participant';--> statement-breakpoint
UPDATE "user" SET "role" = 'participant' WHERE "role" = 'user';
--> statement-breakpoint
UPDATE "user" SET "role" = 'organizer' WHERE "role" = 'participant' AND "id" IN (SELECT "user_id" FROM "event_organizers");
