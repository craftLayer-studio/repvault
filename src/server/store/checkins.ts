import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { dues, HOUR_MS, isTrialValid, startOfDayIST, type MembershipStatus } from "@/domain";
import type { Db } from "../db/client";
import { checkIns, customers, trialPasses } from "../db/schema";
import { customerByAccessToken, customerById, customerByPhone, type Customer } from "./customers";
import { newId } from "./ids";
import { currentMembership, memberLink, summarize } from "./memberships";
import { orgByCheckinToken, orgById, type Org } from "./org";

/** A second scan within this window does not create another check-in. */
export const CHECKIN_DEDUPE_MS = 3 * HOUR_MS;

export type CheckInResult =
  | { result: "checked_in" | "already"; kind: "member"; firstName: string; status: MembershipStatus; daysToExpiry: number; planName: string; duesPaise: number; memberUrl: string; accessToken: string }
  | { result: "checked_in" | "already"; kind: "trial"; firstName: string; trialCode: string; accessToken: string }
  | { result: "expired"; firstName: string; planName: string | null; endAt: number | null; memberUrl: string; accessToken: string }
  | { result: "not_found" };

async function checkIn(db: Db, org: Org, customer: Customer, method: "self_qr" | "desk", nowMs: number): Promise<CheckInResult> {
  const now = new Date(nowMs);
  const firstName = customer.name.split(/\s+/)[0];
  const [recent] = await db
    .select({ at: checkIns.at })
    .from(checkIns)
    .where(and(eq(checkIns.orgId, org.id), eq(checkIns.customerId, customer.id), gte(checkIns.at, new Date(nowMs - CHECKIN_DEDUPE_MS))))
    .limit(1);

  if (customer.kind === "lead") {
    const [pass] = await db
      .select()
      .from(trialPasses)
      .where(and(eq(trialPasses.orgId, org.id), eq(trialPasses.customerId, customer.id)))
      .orderBy(desc(trialPasses.validUntil))
      .limit(1);
    if (!pass || !isTrialValid({ validFrom: pass.validFrom.getTime(), validUntil: pass.validUntil.getTime() }, nowMs)) {
      return { result: "expired", firstName, planName: null, endAt: pass ? pass.validUntil.getTime() : null, memberUrl: memberLink(customer), accessToken: customer.accessToken };
    }
    if (recent) return { result: "already", kind: "trial", firstName, trialCode: pass.code, accessToken: customer.accessToken };
    await db.transaction(async (tx) => {
      await tx.insert(checkIns).values({ id: newId("chk"), orgId: org.id, customerId: customer.id, at: now, method: "trial" });
      await tx.update(trialPasses).set({ usedAt: now }).where(and(eq(trialPasses.id, pass.id), isNull(trialPasses.usedAt)));
      if (customer.leadStage === "new" || customer.leadStage === "contacted") {
        await tx.update(customers).set({ leadStage: "visited" }).where(eq(customers.id, customer.id));
      }
    });
    return { result: "checked_in", kind: "trial", firstName, trialCode: pass.code, accessToken: customer.accessToken };
  }

  const m = await currentMembership(db, org.id, customer.id, nowMs);
  const s = m ? summarize(m, nowMs) : null;
  if (!m || !s || s.status === "expired" || s.status === "upcoming") {
    return { result: "expired", firstName, planName: m?.planName ?? null, endAt: s?.endAt ?? null, memberUrl: memberLink(customer), accessToken: customer.accessToken };
  }
  const base = {
    kind: "member" as const,
    firstName,
    status: s.status,
    daysToExpiry: s.daysToExpiry,
    planName: m.planName,
    duesPaise: dues(m.totalPaise, m.paidPaise),
    memberUrl: memberLink(customer),
    accessToken: customer.accessToken,
  };
  if (recent) return { result: "already", ...base };
  await db.insert(checkIns).values({ id: newId("chk"), orgId: org.id, customerId: customer.id, at: now, method });
  return { result: "checked_in", ...base };
}

/**
 * Entrance QR check-in. The member identifies by phone the first time; the page then remembers
 * the device (member access token) so later scans are one tap.
 */
export async function selfCheckIn(
  db: Db,
  input: { checkinToken: string; phone?: string; accessToken?: string },
  nowMs = Date.now(),
): Promise<CheckInResult> {
  const org = await orgByCheckinToken(db, input.checkinToken);
  let customer: Customer | null = null;
  if (input.accessToken) {
    customer = await customerByAccessToken(db, input.accessToken).catch(() => null);
    if (customer && customer.orgId !== org.id) customer = null;
  }
  if (!customer && input.phone) customer = await customerByPhone(db, org.id, input.phone);
  if (!customer) return { result: "not_found" };
  return checkIn(db, org, customer, "self_qr", nowMs);
}

/** Front-desk tablet mode: staff pick the member. */
export async function deskCheckIn(db: Db, orgId: string, customerId: string, nowMs = Date.now()): Promise<CheckInResult> {
  const org = await orgById(db, orgId);
  const customer = await customerById(db, orgId, customerId);
  return checkIn(db, org, customer, "desk", nowMs);
}

export async function todayAttendance(db: Db, orgId: string, nowMs = Date.now()) {
  const rows = await db
    .select({ id: checkIns.id, at: checkIns.at, method: checkIns.method, customerId: customers.id, name: customers.name, kind: customers.kind })
    .from(checkIns)
    .innerJoin(customers, eq(customers.id, checkIns.customerId))
    .where(and(eq(checkIns.orgId, orgId), gte(checkIns.at, new Date(startOfDayIST(nowMs)))))
    .orderBy(desc(checkIns.at));
  return rows.map((r) => ({ ...r, at: r.at.getTime() }));
}
