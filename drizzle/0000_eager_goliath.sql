CREATE TABLE "check_ins" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"method" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"purpose" text NOT NULL,
	"granted" boolean NOT NULL,
	"notice_version" text NOT NULL,
	"channel" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"lead_stage" text,
	"source" text NOT NULL,
	"goal" text,
	"access_token" text NOT NULL,
	"member_since" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"plan_name" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"frozen_from" timestamp with time zone,
	"frozen_until" timestamp with time zone,
	"total_paise" integer NOT NULL,
	"paid_paise" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orgs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"gstin" text,
	"upi_vpa" text NOT NULL,
	"whatsapp" text NOT NULL,
	"checkin_token" text NOT NULL,
	"trial_token" text NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"invoice_seq" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orgs_checkin_token_unique" UNIQUE("checkin_token"),
	CONSTRAINT "orgs_trial_token_unique" UNIQUE("trial_token")
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text,
	"channel" text NOT NULL,
	"to_address" text NOT NULL,
	"template" text NOT NULL,
	"category" text NOT NULL,
	"body" text NOT NULL,
	"status" text NOT NULL,
	"dedupe_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"membership_id" text,
	"pt_session_id" text,
	"amount_paise" integer NOT NULL,
	"mode" text NOT NULL,
	"invoice_no" text NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"recorded_by" text
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"duration_days" integer NOT NULL,
	"price_paise" integer NOT NULL,
	"gst_bp" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"trainer_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"price_paise" integer NOT NULL,
	"status" text NOT NULL,
	"booked_via" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"action" text NOT NULL,
	"note" text,
	"staff_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"role" text NOT NULL,
	"commission_bp" integer DEFAULT 0 NOT NULL,
	"pt_rate_paise" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trial_passes" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"code" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD CONSTRAINT "pt_sessions_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD CONSTRAINT "pt_sessions_trainer_id_staff_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD CONSTRAINT "pt_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_actions" ADD CONSTRAINT "risk_actions_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_actions" ADD CONSTRAINT "risk_actions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_passes" ADD CONSTRAINT "trial_passes_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_passes" ADD CONSTRAINT "trial_passes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkins_org_at" ON "check_ins" USING btree ("org_id","at");--> statement-breakpoint
CREATE INDEX "checkins_customer_at" ON "check_ins" USING btree ("org_id","customer_id","at");--> statement-breakpoint
CREATE INDEX "consent_customer" ON "consent_records" USING btree ("org_id","customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_org_phone" ON "customers" USING btree ("org_id","phone");--> statement-breakpoint
CREATE INDEX "customers_org_kind" ON "customers" USING btree ("org_id","kind");--> statement-breakpoint
CREATE INDEX "memberships_org_end" ON "memberships" USING btree ("org_id","end_at");--> statement-breakpoint
CREATE INDEX "memberships_customer" ON "memberships" USING btree ("org_id","customer_id");--> statement-breakpoint
CREATE INDEX "outbox_org_created" ON "outbox" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_org_dedupe" ON "outbox" USING btree ("org_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "payments_org_paid" ON "payments" USING btree ("org_id","paid_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_org_invoice" ON "payments" USING btree ("org_id","invoice_no");--> statement-breakpoint
CREATE INDEX "pt_org_starts" ON "pt_sessions" USING btree ("org_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_org_phone" ON "staff" USING btree ("org_id","phone");--> statement-breakpoint
CREATE INDEX "staff_phone" ON "staff" USING btree ("phone");