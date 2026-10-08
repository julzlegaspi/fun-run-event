CREATE TYPE "public"."gender" AS ENUM('Female', 'Male', 'Other');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'expired', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."shirt_size" AS ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"race_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"hitpay_payment_request_id" text,
	"hitpay_payment_id" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_hitpay_payment_request_id_unique" UNIQUE("hitpay_payment_request_id"),
	CONSTRAINT "orders_quantity_check" CHECK ("orders"."quantity" between 1 and 6),
	CONSTRAINT "orders_unit_price_check" CHECK ("orders"."unit_price" >= 0),
	CONSTRAINT "orders_total_check" CHECK ("orders"."total" = "orders"."unit_price" * "orders"."quantity")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"birthdate" date NOT NULL,
	"gender" "gender" NOT NULL,
	"shirt_size" "shirt_size" NOT NULL,
	"emergency_name" text NOT NULL,
	"emergency_phone" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_created_at_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "participants_order_id_idx" ON "participants" USING btree ("order_id");