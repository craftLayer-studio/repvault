import { sql } from "drizzle-orm";
import { addGst, DAY_MS, HOUR_MS, MINUTE_MS, NOTICE_VERSION, periodFor, startOfDayIST } from "@/domain";
import type { Db } from "./client";
import * as t from "./schema";
import { newId, newToken } from "../store/ids";

/**
 * One fictional demo gym with realistic Indian data, generated relative to "now" so the
 * dashboard always has members expiring this week, at-risk members, dues and fresh leads.
 * Deterministic (seeded PRNG) apart from ids and tokens.
 */
export const DEMO = {
  orgName: "Kesari Forge Fitness",
  city: "Indore",
  owner: { name: "Vikram Malhotra", phone: "+919811000001" },
  desk: { name: "Pooja Yadav", phone: "+919811000002" },
  trainers: [
    { name: "Arjun Thakur", phone: "+919811000003", ratePaise: 80000, commissionBp: 4000 },
    { name: "Sneha Iyer", phone: "+919811000004", ratePaise: 100000, commissionBp: 4500 },
  ],
} as const;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const FIRST = ["Aarav", "Neha", "Rohan", "Priya", "Karan", "Ananya", "Siddharth", "Ishita", "Aditya", "Kavya", "Rahul", "Meera", "Vivek", "Sakshi", "Nikhil", "Pooja", "Harsh", "Riya", "Manish", "Tanvi", "Amit", "Shreya", "Yash", "Divya", "Gaurav", "Nisha", "Varun", "Aditi", "Kunal", "Simran", "Abhishek", "Pallavi", "Deepak", "Swati", "Rajat", "Komal", "Sahil", "Bhavna", "Mohit", "Jyoti", "Arnav", "Muskan", "Tushar", "Payal"];
const LAST = ["Sharma", "Verma", "Patel", "Joshi", "Kulkarni", "Agarwal", "Chouhan", "Jain", "Mishra", "Rathore", "Dubey", "Tiwari", "Saxena", "Pandey", "Gupta", "Solanki", "Malviya", "Bhatt", "Nair", "Reddy"];

type Pattern = "regular" | "dropped" | "idle" | "new_low" | "new_good" | "casual";

export async function isEmpty(db: Db): Promise<boolean> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(t.orgs);
  return Number(r.n) === 0;
}

export async function seedIfEmpty(db: Db, nowMs = Date.now()): Promise<boolean> {
  if (!(await isEmpty(db))) return false;
  await seedDemo(db, nowMs);
  return true;
}

export async function resetDb(db: Db): Promise<void> {
  await db.execute(
    sql`TRUNCATE ${t.otpCodes}, ${t.ptSessions}, ${t.riskActions}, ${t.outbox}, ${t.trialPasses}, ${t.checkIns}, ${t.payments}, ${t.memberships}, ${t.plans}, ${t.consentRecords}, ${t.customers}, ${t.staff}, ${t.orgs} CASCADE`,
  );
}

export async function seedDemo(db: Db, nowMs = Date.now()): Promise<{ orgId: string }> {
  const rand = rng(20261125);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const today = startOfDayIST(nowMs);
  const orgId = newId("org");

  await db.insert(t.orgs).values({
    id: orgId,
    name: DEMO.orgName,
    city: DEMO.city,
    address: "2nd floor, 14 Scheme 54, Vijay Nagar, Indore 452010 (fictional)",
    gstin: null,
    upiVpa: "kesariforge.demo@okdemo",
    whatsapp: "+919811000001",
    checkinToken: newToken(),
    trialToken: newToken(),
    isDemo: true,
    createdAt: new Date(nowMs - 400 * DAY_MS),
  });

  await db.insert(t.staff).values([
    { id: newId("stf"), orgId, name: DEMO.owner.name, phone: DEMO.owner.phone, role: "owner" },
    { id: newId("stf"), orgId, name: DEMO.desk.name, phone: DEMO.desk.phone, role: "desk" },
  ]);
  const trainerIds: string[] = [];
  for (const tr of DEMO.trainers) {
    const id = newId("stf");
    trainerIds.push(id);
    await db.insert(t.staff).values({ id, orgId, name: tr.name, phone: tr.phone, role: "trainer", ptRatePaise: tr.ratePaise, commissionBp: tr.commissionBp });
  }

  const planDefs = [
    // Base prices chosen so the 5% GST-inclusive totals are round: ₹1,600 / ₹4,400 / ₹8,000 / ₹14,000.
    { name: "Monthly", durationDays: 30, pricePaise: 152381 },
    { name: "Quarterly", durationDays: 90, pricePaise: 419048 },
    { name: "Half-yearly", durationDays: 180, pricePaise: 761905 },
    { name: "Annual", durationDays: 365, pricePaise: 1333333 },
  ];
  const plans = planDefs.map((p) => ({ id: newId("pln"), orgId, gstBp: 500, active: true, ...p }));
  await db.insert(t.plans).values(plans);

  // Days to expiry for each member, chosen so the dashboard has a realistic spread.
  const spec: { dte: number; pattern: Pattern; plan: number; partPaid?: boolean }[] = [
    // Expiring within 7 days (renewal reminders T-7 / T-3 / T-0)
    { dte: 0, pattern: "regular", plan: 0 },
    { dte: 1, pattern: "casual", plan: 0 },
    { dte: 3, pattern: "regular", plan: 1 },
    { dte: 5, pattern: "dropped", plan: 0 },
    { dte: 6, pattern: "regular", plan: 2 },
    { dte: 7, pattern: "casual", plan: 0, partPaid: true },
    // Recently expired (T+3 follow-up, T+10 win-back)
    { dte: -3, pattern: "idle", plan: 0 },
    { dte: -5, pattern: "idle", plan: 0 },
    { dte: -12, pattern: "idle", plan: 1 },
    { dte: -18, pattern: "idle", plan: 0 },
    // New members
    { dte: 10, pattern: "new_low", plan: 0 },
    { dte: 12, pattern: "new_low", plan: 0 },
    { dte: 75, pattern: "new_good", plan: 1 },
    { dte: 25, pattern: "new_good", plan: 0, partPaid: true },
  ];
  const patterns: Pattern[] = ["regular", "regular", "regular", "casual", "dropped", "idle", "regular", "casual"];
  while (spec.length < 44) {
    const plan = pick([0, 0, 1, 1, 2, 3]);
    const dur = planDefs[plan].durationDays;
    spec.push({ dte: 8 + Math.floor(rand() * Math.max(1, dur - 30)), pattern: pick(patterns), plan, partPaid: rand() < 0.08 });
  }

  const usedPhones = new Set<string>();
  const phone = () => {
    for (;;) {
      const p = `+91${pick(["98", "97", "99", "88", "70", "62", "93"])}${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`;
      if (!usedPhones.has(p) && !p.startsWith("+9198110000")) {
        usedPhones.add(p);
        return p;
      }
    }
  };

  const members: { id: string; name: string; startAt: number; pattern: Pattern }[] = [];
  const nameSet = new Set<string>();
  for (const [i, s] of spec.entries()) {
    let name = "";
    do name = `${FIRST[(i * 7 + Math.floor(rand() * FIRST.length)) % FIRST.length]} ${pick(LAST)}`;
    while (nameSet.has(name));
    nameSet.add(name);
    const plan = plans[s.plan];
    const endAt = today + s.dte * DAY_MS;
    const startAt = endAt - (plan.durationDays - 1) * DAY_MS;
    const isNew = s.pattern === "new_low" || s.pattern === "new_good";
    // Long-standing members joined before this membership; new ones joined with it.
    const memberSince = isNew ? startAt : startAt - Math.floor(60 + rand() * 300) * DAY_MS;
    const id = newId("cus");
    await db.insert(t.customers).values({
      id,
      orgId,
      phone: phone(),
      name,
      kind: "member",
      source: rand() < 0.3 ? "trial_qr" : "import",
      accessToken: newToken(),
      memberSince: new Date(memberSince),
      createdAt: new Date(memberSince),
    });
    const service = rand() < 0.92;
    const marketing = rand() < 0.6;
    await db.insert(t.consentRecords).values([
      { id: newId("cns"), orgId, customerId: id, purpose: "service", granted: service, noticeVersion: NOTICE_VERSION, channel: "desk", createdAt: new Date(memberSince) },
      { id: newId("cns"), orgId, customerId: id, purpose: "marketing", granted: marketing, noticeVersion: NOTICE_VERSION, channel: "desk", createdAt: new Date(memberSince) },
    ]);
    const { total } = addGst(plan.pricePaise, plan.gstBp);
    const paid = s.partPaid ? Math.round(total / 2 / 100) * 100 : total;
    const memId = newId("mem");
    const period = periodFor(plan.durationDays, startAt);
    await db.insert(t.memberships).values({
      id: memId,
      orgId,
      customerId: id,
      planId: plan.id,
      planName: plan.name,
      startAt: new Date(period.startAt),
      endAt: new Date(period.endAt),
      totalPaise: total,
      paidPaise: paid,
      createdAt: new Date(Math.min(startAt, nowMs)),
    });
    const paidAt = Math.min(startAt + 10 * HOUR_MS + Math.floor(rand() * 8) * HOUR_MS, nowMs - HOUR_MS);
    await db.insert(t.payments).values({
      id: newId("pay"),
      orgId,
      customerId: id,
      membershipId: memId,
      amountPaise: paid,
      mode: pick(["upi", "upi", "upi", "cash", "card"] as const),
      invoiceNo: `RV-${new Date(paidAt).getUTCFullYear()}-${String(i + 1).padStart(6, "0")}`,
      paidAt: new Date(paidAt),
    });
    members.push({ id, name, startAt: Math.max(startAt, memberSince), pattern: s.pattern });
  }
  await db.update(t.orgs).set({ invoiceSeq: spec.length }).where(sql`${t.orgs.id} = ${orgId}`);

  // Check-ins over the last 35 days.
  const visits: (typeof t.checkIns.$inferInsert)[] = [];
  const slot = () => (rand() < 0.6 ? 6 + Math.floor(rand() * 4) : 17 + Math.floor(rand() * 4)) * HOUR_MS + Math.floor(rand() * 60) * MINUTE_MS;
  for (const m of members) {
    const s = spec[members.indexOf(m)];
    const endAt = today + s.dte * DAY_MS;
    for (let d = 35; d >= 0; d--) {
      const day = today - d * DAY_MS;
      if (day < startOfDayIST(m.startAt) || day > endAt) continue;
      let p = 0;
      switch (m.pattern) {
        case "regular": p = 0.62; break;
        case "casual": p = 0.35; break;
        case "dropped": p = d > 7 ? 0.65 : d === 6 ? 1 : 0; break;
        case "idle": p = d > 11 ? 0.45 : 0; break;
        case "new_low": p = d === 15 || d === 9 ? 1 : 0; break;
        case "new_good": p = 0.6; break;
      }
      const at = day + slot();
      if (rand() < p && at < nowMs) visits.push({ id: newId("chk"), orgId, customerId: m.id, at: new Date(at), method: rand() < 0.8 ? "self_qr" : "desk" });
    }
  }
  for (let i = 0; i < visits.length; i += 200) await db.insert(t.checkIns).values(visits.slice(i, i + 200));

  // Walk-in leads from the trial QR.
  const leadDefs = [
    { name: "Rahul Bhadoria", daysAgo: 0, stage: "new" as const, goal: "Muscle gain", mk: true },
    { name: "Ankita Soni", daysAgo: 1, stage: "visited" as const, goal: "Weight loss", mk: true },
    { name: "Farhan Qureshi", daysAgo: 2, stage: "contacted" as const, goal: "General fitness", mk: false },
    { name: "Tanya Rawat", daysAgo: 4, stage: "visited" as const, goal: "Yoga & flexibility", mk: true },
    { name: "Mehul Shah", daysAgo: 8, stage: "lost" as const, goal: "Sports / strength", mk: false },
  ];
  for (const l of leadDefs) {
    const id = newId("cus");
    const created = today - l.daysAgo * DAY_MS + 9 * HOUR_MS;
    const createdAt = new Date(Math.min(created, nowMs - 30 * MINUTE_MS));
    await db.insert(t.customers).values({ id, orgId, phone: phone(), name: l.name, kind: "lead", leadStage: l.stage, source: "trial_qr", goal: l.goal, accessToken: newToken(), createdAt });
    await db.insert(t.consentRecords).values([
      { id: newId("cns"), orgId, customerId: id, purpose: "service", granted: true, noticeVersion: NOTICE_VERSION, channel: "qr_web", createdAt },
      { id: newId("cns"), orgId, customerId: id, purpose: "marketing", granted: l.mk, noticeVersion: NOTICE_VERSION, channel: "qr_web", createdAt },
    ]);
    const from = startOfDayIST(createdAt.getTime());
    await db.insert(t.trialPasses).values({
      id: newId("trl"),
      orgId,
      customerId: id,
      code: `TRY-${1000 + Math.floor(rand() * 9000)}`,
      validFrom: new Date(from),
      validUntil: new Date(from + DAY_MS),
      usedAt: l.stage === "visited" ? new Date(createdAt.getTime() + 20 * MINUTE_MS) : null,
      createdAt,
    });
    if (l.stage === "visited") await db.insert(t.checkIns).values({ id: newId("chk"), orgId, customerId: id, at: new Date(createdAt.getTime() + 20 * MINUTE_MS), method: "trial" });
  }

  // PT sessions: some done this month, some booked ahead.
  const regulars = members.filter((m) => m.pattern === "regular" || m.pattern === "new_good").slice(0, 6);
  const pts: (typeof t.ptSessions.$inferInsert)[] = [];
  for (const [i, m] of regulars.entries()) {
    const trainer = i % 2;
    const rate = DEMO.trainers[trainer].ratePaise;
    for (const d of [-9, -6, -3]) {
      pts.push({ id: newId("pts"), orgId, trainerId: trainerIds[trainer], customerId: m.id, startsAt: new Date(today + d * DAY_MS + (7 + i) * HOUR_MS), pricePaise: rate, status: d === -6 && i === 0 ? "no_show" : "done", bookedVia: "desk" });
    }
    pts.push({ id: newId("pts"), orgId, trainerId: trainerIds[trainer], customerId: m.id, startsAt: new Date(today + (1 + (i % 3)) * DAY_MS + (7 + i) * HOUR_MS), pricePaise: rate, status: "booked", bookedVia: i % 2 ? "member_page" : "desk" });
  }
  await db.insert(t.ptSessions).values(pts);
  return { orgId };
}
