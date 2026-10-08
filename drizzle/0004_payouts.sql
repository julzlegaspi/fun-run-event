CREATE TYPE "public"."payout_status" AS ENUM('processing', 'paid', 'failed', 'canceled');--> statement-breakpoint
CREATE TABLE "payout_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"holder_name" text NOT NULL,
	"bank_code" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_last4" text NOT NULL,
	"hitpay_beneficiary_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_accounts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"payout_account_id" uuid,
	"account_label" text NOT NULL,
	"gross" integer NOT NULL,
	"commission" integer NOT NULL,
	"amount" integer NOT NULL,
	"status" "payout_status" DEFAULT 'processing' NOT NULL,
	"hitpay_transfer_id" text,
	"failure_reason" text,
	"created_by" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_hitpay_transfer_id_unique" UNIQUE("hitpay_transfer_id"),
	CONSTRAINT "payouts_amount_check" CHECK ("payouts"."amount" >= 1),
	CONSTRAINT "payouts_net_check" CHECK ("payouts"."amount" = "payouts"."gross" - "payouts"."commission")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "payout_account_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "commission_bps" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "commission" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payout_account_id_payout_accounts_id_fk" FOREIGN KEY ("payout_account_id") REFERENCES "public"."payout_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payouts_event_id_idx" ON "payouts" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_payout_account_id_payout_accounts_id_fk" FOREIGN KEY ("payout_account_id") REFERENCES "public"."payout_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_commission_bps_check" CHECK ("events"."commission_bps" between 0 and 5000);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_commission_check" CHECK ("orders"."commission" between 0 and "orders"."total");