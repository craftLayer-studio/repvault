import { and, asc, desc, eq, gte, inArray, max } from "drizzle-orm";
import {
  assessChurn,
  canMoveLead,
  DAY_MS,
  daysToExpiry,
  dues,
  membershipStatus,
  type ChurnAssessment,
  type LeadStage,
} from "@/domain";
import type { Db } from "../db/client";
import { checkIns, customers, memberships, riskActions, trialPasses } from "../db/schema";
import { consentState } from "./customers";
import { notFound, StoreError } from "./errors";
import { summarize, toPeriod, type Membership, type MembershipSummary } from "./memberships";

export interface MemberRow {
  id: string;
  name: string;
  phone: string;
  accessToken: string;
  memberSince: number | null;
  membership: MembershipSummary | null;
  lastVisitAt: number | null;
}

/** Pick the membership that represents a member today: the live one, else the latest. */
function pickMembership(ms: Membership[], now: number): Membership | null {
  const sorted = [...ms].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const live = sorted.find((m) => {
    const s = membershipStatus(toPeriod(m), now);
    return s === "active" || s === "expiring" || s === "frozen";
  });
  return live ?? sorted.at(-1) ?? null;
}

/** Latest membership end across all of a member's memberships (to spot early renewals). */
function latestEnd(ms: Membership[]): number {
  return Math.max(...ms.map((m) => m.endAt.getTime()));
}

export async function listMembers(db: Db, orgId: string, nowMs = Date.now()): Promise<MemberRow[]> {
  const people = await db
    .select()
    .from(customers)
    .where(and(eq(customers.orgId, orgId), eq(customers.kind, "member")))
    .orderBy(asc(customers.name));
  const ms = await db.select().from(memberships).where(eq(memberships.orgId, orgId));
  const visits = await db
    .select({ customerId: checkIns.customerId, last: max(checkIns.at) })
    .from(checkIns)
    .where(eq(checkIns.orgId, orgId))
    .groupBy(checkIns.customerId);
  const lastBy = new Map(visits.map((v) => [v.customerId, v.last ? new Date(v.last).getTime() : null]));
  const byCustomer = new Map<string, Membership[]>();
  for (const m of ms) byCustomer.set(m.customerId, [...(byCustomer.get(m.customerId) ?? []), m]);
  return people.map((p) => {
    const mine = byCustomer.get(p.id) ?? [];
    const m = pickMembership(mine, nowMs);
    const summary = m ? summarize(m, nowMs) : null;
    if (summary && m && latestEnd(mine) > summary.endAt) {
      // Renewed early: the member is covered until the latest end date.
      const combined = { ...toPeriod(m), endAt: latestEnd(mine) };
      summary.endAt = combined.endAt;
      summary.daysToExpiry = daysToExpiry(combined, nowMs);
      summary.status = membershipStatus(combined, nowMs);
    }
    if (summary) summary.duesPaise = mine.reduce((s, x) => s + dues(x.totalPaise, x.paidPaise), 0);
    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      accessToken: p.accessToken,
      memberSince: p.memberSince?.getTime() ?? null,
      membership: summary,
      lastVisitAt: lastBy.get(p.id) ?? null,
    };
  });
}

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  goal: string | null;
  stage: LeadStage;
  createdAt: number;
  trialCode: string | null;
  trialUntil: number | null;
  trialUsed: boolean;
  consent: { service: boolean; marketing: boolean };
}

export async function listLeads(db: Db, orgId: string): Promise<LeadRow[]> {
  const rows = await db
    .select()
    .from(customers)
    .where(and(eq(customers.orgId, orgId), inArray(customers.kind, ["lead"])))
    .orderBy(desc(customers.createdAt));
  const passes = rows.length
    ? await db.select().from(trialPasses).where(and(eq(trialPasses.orgId, orgId), inArray(trialPasses.customerId, rows.map((r) => r.id)))).orderBy(desc(trialPasses.createdAt))
    : [];
  const out: LeadRow[] = [];
  for (const r of rows) {
    const pass = passes.find((p) => p.customerId === r.id);
    out.push({
      id: r.id,
      name: r.name,
      phone: r.phone,
      goal: r.goal,
      stage: (r.leadStage ?? "new") as LeadStage,
      createdAt: r.createdAt.getTime(),
      trialCode: pass?.code ?? null,
      trialUntil: pass?.validUntil.getTime() ?? null,
      trialUsed: !!pass?.usedAt,
      consent: await consentState(db, orgId, r.id),
    });
  }
  return out;
}

export async function moveLead(db: Db, orgId: string, customerId: string, to: LeadStage) {
  const [c] = await db.select().from(customers).where(and(eq(customers.orgId, orgId), eq(customers.id, customerId)));
  if (!c || c.kind !== "lead") throw notFound("Lead");
  const from = (c.leadStage ?? "new") as LeadStage;
  if (to === "converted") throw new StoreError(400, "Sell a plan to convert a lead");
  if (!canMoveLead(from, to)) throw new StoreError(409, `Cannot move a lead from ${from} to ${to}`);
  await db.update(customers).set({ leadStage: to }).where(eq(customers.id, c.id));
  return { id: c.id, stage: to };
}

export interface AtRiskRow extends ChurnAssessment {
  id: string;
  name: string;
  phone: string;
  accessToken: string;
  planName: string;
  daysToExpiry: number;
  lastActionAt: number | null;
  lastAction: string | null;
}

/** Current members flagged by the churn rules, most urgent first. */
export async function atRiskMembers(db: Db, orgId: string, nowMs = Date.now()): Promise<AtRiskRow[]> {
  const members = (await listMembers(db, orgId, nowMs)).filter(
    (m) => m.membership && (m.membership.status === "active" || m.membership.status === "expiring"),
  );
  if (!members.length) return [];
  const since = new Date(nowMs - 35 * DAY_MS);
  const visits = await db
    .select({ customerId: checkIns.customerId, at: checkIns.at })
    .from(checkIns)
    .where(and(eq(checkIns.orgId, orgId), gte(checkIns.at, since)));
  const actions = await db.select().from(riskActions).where(eq(riskActions.orgId, orgId)).orderBy(desc(riskActions.createdAt));
  const out: AtRiskRow[] = [];
  for (const m of members) {
    const mine = visits.filter((v) => v.customerId === m.id).map((v) => v.at.getTime());
    const a = assessChurn({ memberSince: m.memberSince ?? m.membership!.startAt, checkIns: mine, now: nowMs });
    if (m.lastVisitAt && (a.lastVisitAt == null || m.lastVisitAt > a.lastVisitAt)) {
      a.lastVisitAt = m.lastVisitAt;
      a.daysSinceLastVisit = Math.floor((nowMs - m.lastVisitAt) / DAY_MS);
    }
    if (!a.rules.length) continue;
    const act = actions.find((x) => x.customerId === m.id);
    // Dismissed in the last 7 days: hide.
    if (act?.action === "dismissed" && act.createdAt.getTime() > nowMs - 7 * DAY_MS) continue;
    out.push({
      ...a,
      id: m.id,
      name: m.name,
      phone: m.phone,
      accessToken: m.accessToken,
      planName: m.membership!.planName,
      daysToExpiry: m.membership!.daysToExpiry,
      lastActionAt: act?.createdAt.getTime() ?? null,
      lastAction: act?.action ?? null,
    });
  }
  return out.sort((x, y) => y.score - x.score);
}
