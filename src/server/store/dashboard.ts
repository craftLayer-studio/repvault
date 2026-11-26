import { and, eq, gte, lt, sum } from "drizzle-orm";
import { attendanceTrend, DAY_MS, hourlyHistogram, percentChange, startOfDayIST, startOfMonthIST } from "@/domain";
import type { Db } from "../db/client";
import { checkIns, customers, outbox, payments } from "../db/schema";
import { atRiskMembers, listMembers } from "./roster";

async function revenue(db: Db, orgId: string, from: number, to: number): Promise<number> {
  const [r] = await db
    .select({ total: sum(payments.amountPaise) })
    .from(payments)
    .where(and(eq(payments.orgId, orgId), gte(payments.paidAt, new Date(from)), lt(payments.paidAt, new Date(to))));
  return Number(r?.total ?? 0);
}

export async function ownerDashboard(db: Db, orgId: string, nowMs = Date.now()) {
  const members = await listMembers(db, orgId, nowMs);
  const current = members.filter((m) => m.membership && ["active", "expiring", "frozen"].includes(m.membership.status));
  const expiring = members
    .filter((m) => m.membership?.status === "expiring")
    .sort((a, b) => a.membership!.daysToExpiry - b.membership!.daysToExpiry);
  const recentlyExpired = members.filter((m) => m.membership?.status === "expired" && m.membership.daysToExpiry >= -30);
  const duesTotal = current.reduce((s, m) => s + (m.membership?.duesPaise ?? 0), 0);

  const monthStart = startOfMonthIST(nowMs);
  const prevMonthStart = startOfMonthIST(monthStart - DAY_MS);
  const today = startOfDayIST(nowMs);
  const [revMonth, revPrevMonthToDate, revToday] = await Promise.all([
    revenue(db, orgId, monthStart, nowMs + 1),
    revenue(db, orgId, prevMonthStart, prevMonthStart + (nowMs - monthStart) + 1),
    revenue(db, orgId, today, nowMs + 1),
  ]);

  const visits = await db
    .select({ at: checkIns.at })
    .from(checkIns)
    .where(and(eq(checkIns.orgId, orgId), gte(checkIns.at, new Date(today - 28 * DAY_MS))));
  const times = visits.map((v) => v.at.getTime());
  const trend = attendanceTrend(times, nowMs, 14);
  const thisWeek = trend.slice(7).reduce((s, d) => s + d.count, 0);
  const lastWeek = trend.slice(0, 7).reduce((s, d) => s + d.count, 0);

  const leads = await db.select().from(customers).where(and(eq(customers.orgId, orgId), gte(customers.createdAt, new Date(nowMs - 30 * DAY_MS))));
  const trialLeads = leads.filter((c) => c.source === "trial_qr");
  const converted = trialLeads.filter((c) => c.kind === "member").length;

  const msgs = await db.select().from(outbox).where(and(eq(outbox.orgId, orgId), gte(outbox.createdAt, new Date(nowMs - 7 * DAY_MS))));
  const atRisk = await atRiskMembers(db, orgId, nowMs);

  return {
    activeMembers: current.length,
    expiringIn7: expiring.map((m) => ({ id: m.id, name: m.name, phone: m.phone, planName: m.membership!.planName, daysToExpiry: m.membership!.daysToExpiry, endAt: m.membership!.endAt })),
    recentlyExpired: recentlyExpired.length,
    duesTotal,
    revenue: { month: revMonth, prevMonthToDate: revPrevMonthToDate, change: percentChange(revMonth, revPrevMonthToDate), today: revToday },
    attendance: { trend, today: trend.at(-1)?.count ?? 0, thisWeek, lastWeek, change: percentChange(thisWeek, lastWeek), hourly: hourlyHistogram(times) },
    leads: { last30: trialLeads.length, converted, open: leads.filter((c) => c.kind === "lead" && c.leadStage !== "lost").length },
    atRisk: atRisk.slice(0, 10).map((r) => ({ id: r.id, name: r.name, rules: r.rules, daysSinceLastVisit: r.daysSinceLastVisit })),
    atRiskCount: atRisk.length,
    messages: { sent: msgs.filter((m) => m.status === "sent").length, skipped: msgs.filter((m) => m.status === "skipped_no_consent").length },
  };
}
