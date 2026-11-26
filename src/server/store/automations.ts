import { and, desc, eq, gte, lt } from "drizzle-orm";
import {
  addGst,
  DAY_MS,
  duesReminderKey,
  duesText,
  istDateKey,
  missedYouText,
  reminderKey,
  reminderStage,
  renewalText,
  startOfDayIST,
  TEMPLATE_CATEGORY,
  trialFollowupText,
} from "@/domain";
import type { Db } from "../db/client";
import { customers, outbox, riskActions, trialPasses } from "../db/schema";
import { customerById, messageCustomer } from "./customers";
import { StoreError } from "./errors";
import { newId } from "./ids";
import { listPlans, memberLink } from "./memberships";
import { orgById } from "./org";
import { listMembers } from "./roster";

export interface AutomationRun {
  sent: number;
  skippedNoConsent: number;
  alreadySent: number;
  byTemplate: Record<string, number>;
}

/** IST week bucket (Monday) for weekly dedupe. */
function weekKey(nowMs: number): string {
  const day = startOfDayIST(nowMs);
  const dow = (new Date(day + 330 * 60_000).getUTCDay() + 6) % 7;
  return istDateKey(day - dow * DAY_MS);
}

/**
 * Daily automation (run by a cron in production; a button in the demo):
 * renewal reminders T-7/T-3/T-0/T+3, win-back T+10, weekly dues reminders, and a next-day
 * offer to trial leads. Each message has a dedupe key so re-running is safe.
 */
export async function runDailyAutomations(db: Db, orgId: string, nowMs = Date.now()): Promise<AutomationRun> {
  const now = new Date(nowMs);
  const org = await orgById(db, orgId);
  const run: AutomationRun = { sent: 0, skippedNoConsent: 0, alreadySent: 0, byTemplate: {} };
  const tally = (template: string, r: "sent" | "skipped" | "duplicate") => {
    if (r === "sent") {
      run.sent++;
      run.byTemplate[template] = (run.byTemplate[template] ?? 0) + 1;
    } else if (r === "skipped") run.skippedNoConsent++;
    else run.alreadySent++;
  };
  const plans = await listPlans(db, orgId);
  const members = await listMembers(db, orgId, nowMs);

  for (const m of members) {
    const s = m.membership;
    if (!s) continue;
    const customer = await customerById(db, orgId, m.id);
    const link = memberLink(customer);
    const rule = reminderStage(s.daysToExpiry);
    if (rule) {
      const plan = plans.find((p) => p.name === s.planName) ?? plans[0];
      const amount = plan ? addGst(plan.pricePaise, plan.gstBp).total : s.totalPaise;
      const template = `renewal_${rule.stage}`;
      const r = await messageCustomer(
        db,
        org,
        customer,
        {
          template,
          category: TEMPLATE_CATEGORY[template as keyof typeof TEMPLATE_CATEGORY],
          body: renewalText({ stage: rule.stage, name: customer.name, gym: org.name, plan: s.planName, endAt: s.endAt, amount, link }),
          dedupeKey: reminderKey(s.id, rule.stage),
        },
        now,
      );
      tally(template, r);
    }
    if (s.duesPaise > 0 && s.status !== "expired") {
      const r = await messageCustomer(
        db,
        org,
        customer,
        { template: "dues", category: "utility", body: duesText({ name: customer.name, gym: org.name, amount: s.duesPaise, link }), dedupeKey: duesReminderKey(s.id, weekKey(nowMs)) },
        now,
      );
      tally("dues", r);
    }
  }

  // Trial leads: offer the day after the trial, once.
  const cheapest = plans[0];
  if (cheapest) {
    const leads = await db
      .select({ c: customers, until: trialPasses.validUntil, passId: trialPasses.id })
      .from(trialPasses)
      .innerJoin(customers, eq(customers.id, trialPasses.customerId))
      .where(and(eq(trialPasses.orgId, orgId), lt(trialPasses.validUntil, now), gte(trialPasses.validUntil, new Date(nowMs - 7 * DAY_MS))));
    for (const { c, passId } of leads) {
      if (c.kind !== "lead" || c.leadStage === "lost") continue;
      const r = await messageCustomer(
        db,
        org,
        c,
        {
          template: "trial_followup",
          category: "marketing",
          body: trialFollowupText({ name: c.name, gym: org.name, plan: cheapest.name, amount: addGst(cheapest.pricePaise, cheapest.gstBp).total, link: memberLink(c) }),
          dedupeKey: `trial_followup:${passId}`,
        },
        now,
      );
      tally("trial_followup", r);
    }
  }
  return run;
}

/** One-tap "missed you" nudge to an at-risk member, logged as outreach. */
export async function nudgeAtRisk(db: Db, orgId: string, customerId: string, staffId: string, nowMs = Date.now()) {
  const now = new Date(nowMs);
  const org = await orgById(db, orgId);
  const c = await customerById(db, orgId, customerId);
  if (c.kind !== "member") throw new StoreError(400, "Only members can be nudged");
  const r = await messageCustomer(
    db,
    org,
    c,
    { template: "missed_you", category: "marketing", body: missedYouText({ name: c.name, gym: org.name, link: memberLink(c) }), dedupeKey: `missed_you:${c.id}:${istDateKey(nowMs)}` },
    now,
  );
  await db.insert(riskActions).values({ id: newId("rsk"), orgId, customerId: c.id, action: "whatsapp", note: r, staffId, createdAt: now });
  return { result: r };
}

export async function logRiskAction(db: Db, orgId: string, customerId: string, action: "call" | "dismissed", note: string | undefined, staffId: string, nowMs = Date.now()) {
  await customerById(db, orgId, customerId);
  await db.insert(riskActions).values({ id: newId("rsk"), orgId, customerId, action, note: note ?? null, staffId, createdAt: new Date(nowMs) });
  return { ok: true };
}

export async function listOutbox(db: Db, orgId: string, limit = 100) {
  const rows = await db
    .select({ o: outbox, name: customers.name })
    .from(outbox)
    .leftJoin(customers, eq(customers.id, outbox.customerId))
    .where(eq(outbox.orgId, orgId))
    .orderBy(desc(outbox.createdAt))
    .limit(limit);
  return rows.map(({ o, name }) => ({
    id: o.id,
    to: o.toAddress,
    name,
    template: o.template,
    category: o.category,
    body: o.body,
    status: o.status,
    createdAt: o.createdAt.getTime(),
  }));
}
