CREATE TABLE "event_organizers" (
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_organizers_event_id_user_id_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_organizers_user_id_idx" ON "event_organizers" USING btree ("user_id");--> statement-breakpoint
-- Events that existed before drafts were introduced stay live.
UPDATE "events" SET "is_published" = true;