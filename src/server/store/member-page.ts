import { and, asc, eq, gte } from "drizzle-orm";
import { addGst, daysToExpiry, membershipStatus, startOfDayIST, type ConsentPurpose } from "@/domain";
import type { Db } from "../db/client";
import { checkIns, customers, ptSessions, staff } from "../db/schema";
import { consentState, customerByAccessToken, recordConsent } from "./customers";
import { currentMembership, latestMembership, listPlans, summarize, toPeriod, upiLink } from "./memberships";
import { orgById } from "./org";
import { listTrainers } from "./pt";

/** Everything the member's own page (/m/<token>) shows. No login: the token is the key. */
export async function memberPage(db: Db, accessToken: string, nowMs = Date.now()) {
  const c = await customerByAccessToken(db, accessToken);
  const org = await orgById(db, c.orgId);
  const m = await currentMembership(db, org.id, c.id, nowMs);
  const latest = await latestMembership(db, org.id, c.id);
  const summary = m ? summarize(m, nowMs) : null;
  const renewsTo = latest && m && latest.id !== m.id ? latest.endAt.getTime() : null;
  if (summary && m && renewsTo) {
    // Renewed early: covered until the renewal's end, so not "expiring".
    const combined = { ...toPeriod(m), endAt: renewsTo };
    summary.status = membershipStatus(combined, nowMs);
    summary.daysToExpiry = daysToExpiry(combined, nowMs);
  }
  const plans = (await listPlans(db, org.id)).map((p) => {
    const { total } = addGst(p.pricePaise, p.gstBp);
    return { id: p.id, name: p.name, durationDays: p.durationDays, totalPaise: total, upi: upiLink(org, total, `${p.name} - ${c.name}`.slice(0, 80), c.id.slice(-12)) };
  });
  const duesUpi = summary && summary.duesPaise > 0 ? upiLink(org, summary.duesPaise, `Dues - ${c.name}`.slice(0, 80), c.id.slice(-12)) : null;
  const visits = await db
    .select({ at: checkIns.at })
    .from(checkIns)
    .where(and(eq(checkIns.orgId, org.id), eq(checkIns.customerId, c.id), gte(checkIns.at, new Date(nowMs - 30 * 86_400_000))));
  const pt = await db
    .select({ id: ptSessions.id, startsAt: ptSessions.startsAt, status: ptSessions.status, trainer: staff.name })
    .from(ptSessions)
    .innerJoin(staff, eq(staff.id, ptSessions.trainerId))
    .where(and(eq(ptSessions.orgId, org.id), eq(ptSessions.customerId, c.id), gte(ptSessions.startsAt, new Date(nowMs - 3_600_000))))
    .orderBy(asc(ptSessions.startsAt));
  return {
    gym: { name: org.name, city: org.city, isDemo: org.isDemo, whatsapp: org.whatsapp },
    member: { name: c.name, kind: c.kind, phoneLast4: c.phone.slice(-4) },
    membership: summary,
    renewsTo,
    duesUpi,
    plans,
    visitsLast30: visits.length,
    pt: pt.map((p) => ({ ...p, startsAt: p.startsAt.getTime() })),
    trainers: c.kind === "member" ? (await listTrainers(db, org.id)).map((t) => ({ id: t.id, name: t.name, ptRatePaise: t.ptRatePaise })) : [],
    consent: await consentState(db, org.id, c.id),
    today: startOfDayIST(nowMs),
  };
}

export async function memberSetConsent(db: Db, accessToken: string, purpose: ConsentPurpose, granted: boolean, nowMs = Date.now()) {
  const c = await customerByAccessToken(db, accessToken);
  await recordConsent(db, c.orgId, c.id, { [purpose]: granted }, "member_page", new Date(nowMs));
  return consentState(db, c.orgId, c.id);
}

/** DPDP: export everything held about one customer. */
export async function exportCustomer(db: Db, orgId: string, customerId: string) {
  const { consentRecords, memberships, payments, outbox, trialPasses } = await import("../db/schema");
  const [c] = await db.select().from(customers).where(and(eq(customers.orgId, orgId), eq(customers.id, customerId)));
  if (!c) return null;
  const where = <T extends { orgId: unknown; customerId: unknown }>(t: T) => and(eq(t.orgId as never, orgId), eq(t.customerId as never, customerId));
  return {
    exportedAt: new Date().toISOString(),
    customer: { ...c, accessToken: undefined },
    consents: await db.select().from(consentRecords).where(where(consentRecords)),
    memberships: await db.select().from(memberships).where(where(memberships)),
    payments: await db.select().from(payments).where(where(payments)),
    checkIns: await db.select().from(checkIns).where(where(checkIns)),
    trialPasses: await db.select().from(trialPasses).where(where(trialPasses)),
    messages: await db.select().from(outbox).where(where(outbox)),
  };
}

/**
 * DPDP: erase a customer's personal data. Payment and invoice rows stay (tax records) but are
 * no longer linked to a name or phone; consents are withdrawn; message bodies are blanked.
 */
export async function eraseCustomer(db: Db, orgId: string, customerId: string, nowMs = Date.now()) {
  const { outbox } = await import("../db/schema");
  const { newToken } = await import("./ids");
  return db.transaction(async (tx) => {
    const [c] = await tx.select().from(customers).where(and(eq(customers.orgId, orgId), eq(customers.id, customerId)));
    if (!c) return { ok: false };
    await recordConsent(tx, orgId, c.id, { service: false, marketing: false }, "desk", new Date(nowMs));
    await tx
      .update(customers)
      .set({ name: "Erased member", phone: `erased:${c.id}`, goal: null, accessToken: newToken() })
      .where(eq(customers.id, c.id));
    await tx.update(outbox).set({ toAddress: "erased", body: "[erased on request]" }).where(and(eq(outbox.orgId, orgId), eq(outbox.customerId, c.id)));
    return { ok: true };
  });
}
