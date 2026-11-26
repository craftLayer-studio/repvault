import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  addGst,
  daysToExpiry,
  dues,
  freeze,
  membershipStatus,
  periodFor,
  receiptText,
  renewalFirstDay,
  welcomeText,
  type MembershipPeriod,
  type MembershipStatus,
} from "@/domain";
import type { Db, Tx } from "../db/client";
import { customers, memberships, payments, plans } from "../db/schema";
import { payments as paymentAdapter } from "../adapters/payments";
import { appUrl } from "../config";
import { customerById, customerByPhone, messageCustomer, recordConsent, type Customer } from "./customers";
import { notFound, StoreError } from "./errors";
import { newId, newToken } from "./ids";
import { nextInvoiceNo, orgById, type Org } from "./org";

export type Membership = typeof memberships.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type PaymentMode = "upi" | "cash" | "card";

export const toPeriod = (m: Membership): MembershipPeriod => ({
  startAt: m.startAt.getTime(),
  endAt: m.endAt.getTime(),
  frozenFrom: m.frozenFrom?.getTime() ?? null,
  frozenUntil: m.frozenUntil?.getTime() ?? null,
});

export interface MembershipSummary {
  id: string;
  planName: string;
  startAt: number;
  endAt: number;
  status: MembershipStatus;
  daysToExpiry: number;
  totalPaise: number;
  paidPaise: number;
  duesPaise: number;
}

export function summarize(m: Membership, now: number): MembershipSummary {
  const p = toPeriod(m);
  return {
    id: m.id,
    planName: m.planName,
    startAt: p.startAt,
    endAt: p.endAt,
    status: membershipStatus(p, now),
    daysToExpiry: daysToExpiry(p, now),
    totalPaise: m.totalPaise,
    paidPaise: m.paidPaise,
    duesPaise: dues(m.totalPaise, m.paidPaise),
  };
}

/** The membership with the latest end date (the one renewals extend from). */
export async function latestMembership(db: Db | Tx, orgId: string, customerId: string): Promise<Membership | null> {
  const [m] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.customerId, customerId)))
    .orderBy(desc(memberships.endAt))
    .limit(1);
  return m ?? null;
}

/** Membership covering today, if any (a renewal bought early may start later). */
export async function currentMembership(db: Db | Tx, orgId: string, customerId: string, now: number): Promise<Membership | null> {
  const rows = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.customerId, customerId)))
    .orderBy(asc(memberships.startAt));
  const live = rows.find((m) => {
    const s = membershipStatus(toPeriod(m), now);
    return s === "active" || s === "expiring" || s === "frozen";
  });
  return live ?? rows.at(-1) ?? null;
}

export async function listPlans(db: Db, orgId: string, includeInactive = false): Promise<Plan[]> {
  const rows = await db.select().from(plans).where(eq(plans.orgId, orgId)).orderBy(asc(plans.durationDays));
  return includeInactive ? rows : rows.filter((p) => p.active);
}

export async function planById(db: Db | Tx, orgId: string, planId: string): Promise<Plan> {
  const [p] = await db.select().from(plans).where(and(eq(plans.orgId, orgId), eq(plans.id, planId)));
  if (!p) throw notFound("Plan");
  return p;
}

export async function savePlan(
  db: Db,
  orgId: string,
  input: { id?: string; name: string; durationDays: number; pricePaise: number; gstBp: number; active: boolean },
): Promise<Plan> {
  if (!Number.isInteger(input.durationDays) || input.durationDays < 1 || input.durationDays > 730) {
    throw new StoreError(400, "Duration must be 1-730 days");
  }
  if (!Number.isInteger(input.pricePaise) || input.pricePaise < 100 || input.pricePaise > 100_000_00) {
    throw new StoreError(400, "Price must be between ₹1 and ₹1,00,000");
  }
  if (![0, 500, 1200, 1800].includes(input.gstBp)) throw new StoreError(400, "GST must be 0%, 5%, 12% or 18%");
  const values = { name: input.name, durationDays: input.durationDays, pricePaise: input.pricePaise, gstBp: input.gstBp, active: input.active };
  if (input.id) {
    const [p] = await db.update(plans).set(values).where(and(eq(plans.orgId, orgId), eq(plans.id, input.id))).returning();
    if (!p) throw notFound("Plan");
    return p;
  }
  const [p] = await db.insert(plans).values({ id: newId("pln"), orgId, ...values }).returning();
  return p;
}

export function memberLink(c: Pick<Customer, "accessToken">): string {
  return `${appUrl()}/m/${c.accessToken}`;
}

export function upiLink(org: Org, amount: number, note: string, reference: string): string {
  return paymentAdapter().paymentLink({ vpa: org.upiVpa, payeeName: org.name, amount, note, reference });
}

async function insertPayment(
  tx: Tx,
  org: Org,
  p: { customerId: string; membershipId?: string; ptSessionId?: string; amount: number; mode: PaymentMode; staffId?: string },
  now: Date,
): Promise<string> {
  const invoiceNo = await nextInvoiceNo(tx, org.id, now);
  await tx.insert(payments).values({
    id: newId("pay"),
    orgId: org.id,
    customerId: p.customerId,
    membershipId: p.membershipId ?? null,
    ptSessionId: p.ptSessionId ?? null,
    amountPaise: p.amount,
    mode: p.mode,
    invoiceNo,
    paidAt: now,
    recordedBy: p.staffId ?? null,
  });
  return invoiceNo;
}

export interface SellInput {
  orgId: string;
  staffId?: string;
  /** Existing customer (lead or member) ... */
  customerId?: string;
  /** ... or a new walk-in registered at the desk. */
  newCustomer?: { name: string; phone: string; consentService: boolean; consentMarketing: boolean };
  planId: string;
  paidPaise: number;
  mode: PaymentMode;
  consentChannel?: "desk" | "member_page";
}

/**
 * Sell a new membership or a renewal. The price comes from the plan (plus GST), never the client.
 * Renewals start the day after the current one ends, so early renewers lose nothing.
 */
export async function sellMembership(db: Db, input: SellInput, nowMs = Date.now()) {
  const now = new Date(nowMs);
  return db.transaction(async (tx) => {
    const org = await orgById(tx, input.orgId);
    const plan = await planById(tx, org.id, input.planId);
    if (!plan.active) throw new StoreError(400, "That plan is no longer on sale");

    let customer: Customer;
    if (input.customerId) {
      customer = await customerById(tx, org.id, input.customerId);
    } else if (input.newCustomer) {
      const existing = await customerByPhone(tx, org.id, input.newCustomer.phone);
      if (existing) {
        customer = existing;
      } else {
        [customer] = await tx
          .insert(customers)
          .values({
            id: newId("cus"),
            orgId: org.id,
            phone: input.newCustomer.phone,
            name: input.newCustomer.name,
            kind: "member",
            source: "desk",
            accessToken: newToken(),
            createdAt: now,
          })
          .returning();
        await recordConsent(
          tx,
          org.id,
          customer.id,
          { service: input.newCustomer.consentService, marketing: input.newCustomer.consentMarketing },
          "desk",
          now,
        );
      }
    } else {
      throw new StoreError(400, "Pick a member or enter a new one");
    }

    const { total } = addGst(plan.pricePaise, plan.gstBp);
    if (!Number.isInteger(input.paidPaise) || input.paidPaise < 0 || input.paidPaise > total) {
      throw new StoreError(400, `Amount paid must be between ₹0 and the plan total`);
    }
    const prev = await latestMembership(tx, org.id, customer.id);
    const isRenewal = prev !== null;
    const period = periodFor(plan.durationDays, renewalFirstDay(prev ? toPeriod(prev) : null, nowMs));
    const [m] = await tx
      .insert(memberships)
      .values({
        id: newId("mem"),
        orgId: org.id,
        customerId: customer.id,
        planId: plan.id,
        planName: plan.name,
        startAt: new Date(period.startAt),
        endAt: new Date(period.endAt),
        totalPaise: total,
        paidPaise: input.paidPaise,
        createdAt: now,
      })
      .returning();
    await tx
      .update(customers)
      .set({
        kind: "member",
        leadStage: customer.kind === "lead" ? "converted" : customer.leadStage,
        memberSince: customer.memberSince ?? new Date(period.startAt),
      })
      .where(eq(customers.id, customer.id));

    let invoiceNo: string | null = null;
    if (input.paidPaise > 0) {
      invoiceNo = await insertPayment(tx, org, { customerId: customer.id, membershipId: m.id, amount: input.paidPaise, mode: input.mode, staffId: input.staffId }, now);
    }
    if (isRenewal && invoiceNo) {
      await messageCustomer(tx, org, customer, { template: "payment_receipt", category: "utility", body: receiptText({ name: customer.name, gym: org.name, amount: input.paidPaise, invoiceNo, endAt: period.endAt }) }, now);
    } else if (!isRenewal) {
      await messageCustomer(tx, org, customer, { template: "welcome", category: "utility", body: welcomeText({ name: customer.name, gym: org.name, plan: plan.name, endAt: period.endAt }) }, now);
    }
    return { membership: summarize(m, nowMs), customerId: customer.id, invoiceNo, isRenewal };
  });
}

/** Record a part-payment against outstanding dues. */
export async function recordPayment(
  db: Db,
  input: { orgId: string; membershipId: string; amountPaise: number; mode: PaymentMode; staffId?: string },
  nowMs = Date.now(),
) {
  const now = new Date(nowMs);
  return db.transaction(async (tx) => {
    const org = await orgById(tx, input.orgId);
    const [m] = await tx.select().from(memberships).where(and(eq(memberships.orgId, org.id), eq(memberships.id, input.membershipId)));
    if (!m) throw notFound("Membership");
    const owed = dues(m.totalPaise, m.paidPaise);
    if (owed === 0) throw new StoreError(409, "Nothing is due on this membership");
    if (!Number.isInteger(input.amountPaise) || input.amountPaise < 1 || input.amountPaise > owed) {
      throw new StoreError(400, "Amount must be more than ₹0 and no more than the dues");
    }
    await tx.update(memberships).set({ paidPaise: sql`${memberships.paidPaise} + ${input.amountPaise}` }).where(eq(memberships.id, m.id));
    const invoiceNo = await insertPayment(tx, org, { customerId: m.customerId, membershipId: m.id, amount: input.amountPaise, mode: input.mode, staffId: input.staffId }, now);
    const customer = await customerById(tx, org.id, m.customerId);
    await messageCustomer(tx, org, customer, { template: "payment_receipt", category: "utility", body: receiptText({ name: customer.name, gym: org.name, amount: input.amountPaise, invoiceNo, endAt: m.endAt.getTime() }) }, now);
    return { invoiceNo, duesPaise: owed - input.amountPaise };
  });
}

export async function freezeMembership(db: Db, orgId: string, membershipId: string, days: number, nowMs = Date.now()) {
  const [m] = await db.select().from(memberships).where(and(eq(memberships.orgId, orgId), eq(memberships.id, membershipId)));
  if (!m) throw notFound("Membership");
  let next: MembershipPeriod;
  try {
    next = freeze(toPeriod(m), days, nowMs);
  } catch (err) {
    throw new StoreError(400, (err as Error).message);
  }
  const [row] = await db
    .update(memberships)
    .set({ endAt: new Date(next.endAt), frozenFrom: new Date(next.frozenFrom!), frozenUntil: new Date(next.frozenUntil!) })
    .where(eq(memberships.id, m.id))
    .returning();
  return summarize(row, nowMs);
}

/**
 * Demo stand-in for a payment-gateway webhook: the member tapped the UPI link and "paid".
 * Renews with the chosen plan (or clears dues when planId is omitted), paid in full by UPI.
 */
export async function simulateMemberPayment(db: Db, accessToken: string, planId: string | null, nowMs = Date.now()) {
  const [c] = await db.select().from(customers).where(eq(customers.accessToken, accessToken));
  if (!c) throw notFound("Member");
  if (planId) {
    const plan = await planById(db, c.orgId, planId);
    const { total } = addGst(plan.pricePaise, plan.gstBp);
    return sellMembership(db, { orgId: c.orgId, customerId: c.id, planId, paidPaise: total, mode: "upi" }, nowMs);
  }
  const m = await currentMembership(db, c.orgId, c.id, nowMs);
  if (!m) throw new StoreError(409, "No membership to pay for");
  const owed = dues(m.totalPaise, m.paidPaise);
  return recordPayment(db, { orgId: c.orgId, membershipId: m.id, amountPaise: owed, mode: "upi" }, nowMs);
}
