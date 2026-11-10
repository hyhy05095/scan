CREATE TABLE "payment_orders" (
	"order_id" text PRIMARY KEY NOT NULL,
	"order_name" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"metadata" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"user_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_orders_order_id_check" CHECK ("payment_orders"."order_id" ~ '^[A-Za-z0-9_-]{6,64}$'),
	CONSTRAINT "payment_orders_positive_amount_check" CHECK ("payment_orders"."amount" > 0),
	CONSTRAINT "payment_orders_currency_check" CHECK ("payment_orders"."currency" IN ('KRW')),
	CONSTRAINT "payment_orders_status_check" CHECK ("payment_orders"."status" IN ('PENDING', 'APPROVED', 'FAILED'))
);
--> statement-breakpoint
ALTER TABLE "payment_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Orders are created and read only by trusted server code. No browser role gets
-- a grant or policy; service_role remains available for hosted server runtimes.
REVOKE ALL ON TABLE "public"."payment_orders" FROM "anon", "authenticated", "service_role";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."payment_orders" TO "service_role";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "currency" text DEFAULT 'KRW' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_orders_user_id_index" ON "payment_orders" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_positive_amount_check" CHECK ("payments"."total_amount" > 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_currency_check" CHECK ("payments"."currency" IN ('KRW'));--> statement-breakpoint
CREATE TRIGGER "set_payment_orders_updated_at"
BEFORE UPDATE ON "public"."payment_orders"
FOR EACH ROW
EXECUTE FUNCTION "private"."set_updated_at"();
