import { and, asc, eq } from "drizzle-orm";
import { hasConsent, NOTICE_VERSION, purposeFor, type ConsentChannel, type ConsentPurpose } from "@/domain";
import type { Db, Tx } from "../db/client";
import { consentRecords, customers } from "../db/schema";
import { messaging } from "../adapters/messaging";
import { notFound } from "./errors";
import { newId } from "./ids";
import type { Org } from "./org";

export type Customer = typeof customers.$inferSelect;

export async function customerById(db: Db | Tx, orgId: string, customerId: string): Promise<Customer> {
  const [c] = await db.select().from(customers).where(and(eq(customers.orgId, orgId), eq(customers.id, customerId)));
  if (!c) throw notFound("Member");
  return c;
}

export async function customerByPhone(db: Db | Tx, orgId: string, phone: string): Promise<Customer | null> {
  const [c] = await db.select().from(customers).where(and(eq(customers.orgId, orgId), eq(customers.phone, phone)));
  return c ?? null;
}

export async function customerByAccessToken(db: Db | Tx, token: string): Promise<Customer> {
  const [c] = await db.select().from(customers).where(eq(customers.accessToken, token));
  if (!c) throw notFound("Member");
  return c;
}

/** Append one consent record per purpose given. */
export async function recordConsent(
  tx: Db | Tx,
  orgId: string,
  customerId: string,
  choices: Partial<Record<ConsentPurpose, boolean>>,
  channel: ConsentChannel,
  now: Date,
): Promise<void> {
  const rows = (Object.entries(choices) as [ConsentPurpose, boolean | undefined][])
    .filter(([, v]) => v !== undefined)
    .map(([purpose, granted]) => ({
      id: newId("cns"),
      orgId,
      customerId,
      purpose,
      granted: granted!,
      noticeVersion: NOTICE_VERSION,
      channel,
      createdAt: now,
    }));
  if (rows.length) await tx.insert(consentRecords).values(rows);
}

export async function consentState(db: Db | Tx, orgId: string, customerId: string): Promise<Record<ConsentPurpose, boolean>> {
  const rows = await db
    .select()
    .from(consentRecords)
    .where(and(eq(consentRecords.orgId, orgId), eq(consentRecords.customerId, customerId)))
    .orderBy(asc(consentRecords.createdAt));
  const recs = rows.map((r) => ({ purpose: r.purpose, granted: r.granted, at: r.createdAt.getTime() }));
  return { service: hasConsent(recs, "service"), marketing: hasConsent(recs, "marketing") };
}

/**
 * Send a WhatsApp to a customer through the messaging adapter, honouring consent:
 * utility messages need "service" consent, marketing needs "marketing" consent.
 * Returns "sent", "skipped" (no consent, logged) or "duplicate".
 */
export async function messageCustomer(
  tx: Db | Tx,
  org: Org,
  customer: Customer,
  msg: { template: string; category: "utility" | "marketing"; body: string; dedupeKey?: string },
  now: Date,
): Promise<"sent" | "skipped" | "duplicate"> {
  const consent = await consentState(tx, org.id, customer.id);
  const allowed = consent[purposeFor(msg.category)];
  const inserted = await messaging().sendWhatsApp(
    tx as Tx,
    { orgId: org.id, customerId: customer.id, to: customer.phone, allowed, ...msg },
    now,
  );
  if (!inserted) return "duplicate";
  return allowed ? "sent" : "skipped";
}
