import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const createdAt = () => ts("created_at").notNull().default(sql`now()`);

/** A gym or studio (tenant). Every other business row carries org_id. */
export const orgs = pgTable("orgs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull().default(""),
  gstin: text("gstin"),
  upiVpa: text("upi_vpa").notNull(),
  whatsapp: text("whatsapp").notNull(),
  /** Unguessable token in the entrance (check-in) QR. */
  checkinToken: text("checkin_token").notNull().unique(),
  /** Unguessable token in the walk-in (trial) QR. */
  trialToken: text("trial_token").notNull().unique(),
  isDemo: boolean("is_demo").notNull().default(false),
  invoiceSeq: integer("invoice_seq").notNull().default(0),
  createdAt: createdAt(),
});

export const staff = pgTable(
  "staff",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => orgs.id),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    role: text("role", { enum: ["owner", "desk", "trainer"] }).notNull(),
    /** Trainer PT commission in basis points (4000 = 40%). */
    commissionBp: integer("commission_bp").notNull().default(0),
    /** Price of one PT session with this trainer, paise. */
    ptRatePaise: integer("pt_rate_paise").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("staff_org_phone").on(t.orgId, t.phone), index("staff_phone").on(t.phone)],
);

/** Members and walk-in leads, keyed by E.164 phone per org (the CRM). */
export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => orgs.id),
    phone: text("phone").notNull(),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["lead", "member"] }).notNull(),
    leadStage: text("lead_stage", { enum: ["new", "contacted", "visited", "converted", "lost"] }),
    source: text("source", { enum: ["trial_qr", "desk", "import", "referral"] }).notNull(),
    goal: text("goal"),
    /** Unguessable token for the member's personal page (/m/<token>) used in WhatsApp links. */
    accessToken: text("access_token").notNull().unique(),
    memberSince: ts("member_since"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("customers_org_phone").on(t.orgId, t.phone), index("customers_org_kind").on(t.orgId, t.kind)],
);

export const consentRecords = pgTable(
  "consent_records",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => orgs.id),
    customerId: text("customer_id").notNull().references(() => customers.id),
    purpose: text("purpose", { enum: ["service", "marketing"] }).notNull(),
    granted: boolean("granted").notNull(),
    noticeVersion: text("notice_version").notNull(),
    channel: text("channel", { enum: ["qr_web", "member_page", "desk"] }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("consent_customer").on(t.orgId, t.customerId)],
);

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => orgs.id),
  name: text("name").notNull(),
  durationDays: integer("duration_days").notNull(),
  /** Price before GST, paise. */
  pricePaise: integer("price_paise").notNull(),
  /** GST in basis points (500 = 5%). */
  gstBp: integer("gst_bp").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => orgs.id),
    customerId: text("customer_id").notNull().references(() => customers.id),
    planId: text("plan_id").notNull().references(() => plans.id),
    planName: text("plan_name").notNull(),
    startAt: ts("start_at").notNull(),
    /** IST midnight of the last valid day (inclusive). */
    endAt: ts("end_at").notNull(),
    frozenFrom: ts("frozen_from"),
    frozenUntil: ts("frozen_until"),
    /** Total including GST, paise. */
    totalPaise: integer("total_paise").notNull(),
    paidPaise: integer("paid_paise").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("memberships_org_end").on(t.orgId, t.endAt), index("memberships_customer").on(t.orgId, t.customerId)],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => orgs.id),
    customerId: text("customer_id").notNull().references(() => customers.id),
    membershipId: text("membership_id").references(() => memberships.id),
    ptSessionId: text("pt_session_id"),
    amountPaise: integer("amount_paise").notNull(),
    mode: text("mode", { enum: ["upi", "cash", "card"] }).notNull(),
    invoiceNo: text("invoice_no").notNull(),
    paidAt: ts("paid_at").notNull(),
    recordedBy: text("recorded_by"),
  },
  (t) => [index("payments_org_paid").on(t.orgId, t.paidAt), uniqueIndex("payments_org_invoice").on(t.orgId, t.invoiceNo)],
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => orgs.id),
    customerId: text("customer_id").notNull().references(() => customers.id),
    at: ts("at").notNull(),
    method: text("method", { enum: ["self_qr", "desk", "trial"] }).notNull(),
  },
  (t) => [index("checkins_org_at").on(t.orgId, t.at), index("checkins_customer_at").on(t.orgId, t.customerId, t.at)],
);

export const trialPasses = pgTable("trial_passes", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => orgs.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  code: text("code").notNull(),
  validFrom: ts("valid_from").notNull(),
  validUntil: ts("valid_until").notNull(),
  usedAt: ts("used_at"),
  createdAt: createdAt(),
});

/** Simulated messaging adapter: every WhatsApp send lands here and is shown in the owner UI. */
export const outbox = pgTable(
  "outbox",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => orgs.id),
    customerId: text("customer_id").references(() => customers.id),
    channel: text("channel", { enum: ["whatsapp", "sms", "email"] }).notNull(),
    toAddress: text("to_address").notNull(),
    template: text("template").notNull(),
    category: text("category", { enum: ["utility", "marketing"] }).notNull(),
    body: text("body").notNull(),
    status: text("status", { enum: ["sent", "skipped_no_consent"] }).notNull(),
    /** Prevents the same automated reminder going out twice. */
    dedupeKey: text("dedupe_key"),
    createdAt: createdAt(),
  },
  (t) => [index("outbox_org_created").on(t.orgId, t.createdAt), uniqueIndex("outbox_org_dedupe").on(t.orgId, t.dedupeKey)],
);

/** Outreach to at-risk members (who was contacted, how, outcome). */
export const riskActions = pgTable("risk_actions", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => orgs.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  action: text("action", { enum: ["whatsapp", "call", "dismissed"] }).notNull(),
  note: text("note"),
  staffId: text("staff_id"),
  createdAt: createdAt(),
});

export const ptSessions = pgTable(
  "pt_sessions",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => orgs.id),
    trainerId: text("trainer_id").notNull().references(() => staff.id),
    customerId: text("customer_id").notNull().references(() => customers.id),
    startsAt: ts("starts_at").notNull(),
    pricePaise: integer("price_paise").notNull(),
    status: text("status", { enum: ["booked", "done", "cancelled", "no_show"] }).notNull(),
    bookedVia: text("booked_via", { enum: ["member_page", "desk"] }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("pt_org_starts").on(t.orgId, t.startsAt)],
);

export const otpCodes = pgTable("otp_codes", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: ts("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  usedAt: ts("used_at"),
  createdAt: createdAt(),
});
