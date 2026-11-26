import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { addGst, DAY_MS, HOUR_MS, startOfDayIST } from "@/domain";
import { createMemoryDb, type Db } from "../db/client";
import { checkIns, customers, orgs, outbox, plans, staff } from "../db/schema";
import { resetDb, seedDemo, DEMO } from "../db/seed";
import { requestOtp, verifyOtp } from "./auth";
import { runDailyAutomations, nudgeAtRisk, listOutbox } from "./automations";
import { deskCheckIn, selfCheckIn, todayAttendance } from "./checkins";
import { consentState } from "./customers";
import { ownerDashboard } from "./dashboard";
import { eraseCustomer, exportCustomer, memberPage, memberSetConsent } from "./member-page";
import { freezeMembership, recordPayment, sellMembership, simulateMemberPayment } from "./memberships";
import { bookPt, commissionReport, freeSlots, memberBookPt, setPtStatus } from "./pt";
import { atRiskMembers, listLeads, listMembers, moveLead } from "./roster";
import { claimTrial } from "./trials";

const NOW = Date.UTC(2026, 10, 25, 6, 0); // 25 Nov 2026, 11:30 IST
let db: Db;
let orgId: string;
let org: typeof orgs.$inferSelect;

beforeAll(async () => {
  db = await createMemoryDb();
});

beforeEach(async () => {
  await resetDb(db);
  ({ orgId } = await seedDemo(db, NOW));
  [org] = await db.select().from(orgs).where(eq(orgs.id, orgId));
});

const monthly = async () => (await db.select().from(plans).where(eq(plans.orgId, orgId))).find((p) => p.name === "Monthly")!;

describe("seed", () => {
  it("creates a demo gym with a realistic spread", async () => {
    const d = await ownerDashboard(db, orgId, NOW);
    expect(org.isDemo).toBe(true);
    expect(d.activeMembers).toBeGreaterThan(30);
    expect(d.expiringIn7.length).toBeGreaterThanOrEqual(6);
    expect(d.atRiskCount).toBeGreaterThan(2);
    expect(d.attendance.trend).toHaveLength(14);
    expect(d.leads.open).toBeGreaterThan(0);
  });
});

describe("walk-in trial QR", () => {
  it("captures a lead with separate consents and sends the pass only with service consent", async () => {
    const r = await claimTrial(db, { trialToken: org.trialToken, name: "Rohit Kumar", phone: "+919000011111", consentService: true, consentMarketing: false }, NOW);
    expect(r.code).toMatch(/^TRY-\d{4}$/);
    expect(r.whatsapp).toBe("sent");
    const leads = await listLeads(db, orgId);
    const lead = leads.find((l) => l.phone === "+919000011111")!;
    expect(lead.stage).toBe("new");
    expect(lead.consent).toEqual({ service: true, marketing: false });

    const r2 = await claimTrial(db, { trialToken: org.trialToken, name: "Silent Lead", phone: "+919000022222", consentService: false, consentMarketing: false }, NOW);
    expect(r2.whatsapp).toBe("skipped");
  });

  it("returns the same pass on a repeat scan today and blocks a second trial later", async () => {
    const input = { trialToken: org.trialToken, name: "Rohit Kumar", phone: "+919000011111", consentService: true, consentMarketing: true };
    const a = await claimTrial(db, input, NOW);
    const b = await claimTrial(db, input, NOW + HOUR_MS);
    expect(b.code).toBe(a.code);
    await expect(claimTrial(db, input, NOW + 5 * DAY_MS)).rejects.toThrow(/already used a free trial/);
  });

  it("rejects a bad token and existing members", async () => {
    await expect(claimTrial(db, { trialToken: "nope", name: "X Y", phone: "+919000011111", consentService: false, consentMarketing: false }, NOW)).rejects.toThrow(/not found/);
    const [m] = await db.select().from(customers).where(eq(customers.kind, "member")).limit(1);
    await expect(claimTrial(db, { trialToken: org.trialToken, name: "X Y", phone: m.phone, consentService: false, consentMarketing: false }, NOW)).rejects.toThrow(/already has a membership/);
  });

  it("checks a trial lead in once and marks them visited", async () => {
    await claimTrial(db, { trialToken: org.trialToken, name: "Rohit Kumar", phone: "+919000011111", consentService: true, consentMarketing: false }, NOW);
    const r = await selfCheckIn(db, { checkinToken: org.checkinToken, phone: "+919000011111" }, NOW + HOUR_MS);
    expect(r.result).toBe("checked_in");
    const lead = (await listLeads(db, orgId)).find((l) => l.phone === "+919000011111")!;
    expect(lead.stage).toBe("visited");
    expect(lead.trialUsed).toBe(true);
    const next = await selfCheckIn(db, { checkinToken: org.checkinToken, phone: "+919000011111" }, NOW + 2 * DAY_MS);
    expect(next.result).toBe("expired");
  });
});

describe("entrance QR check-in", () => {
  it("checks in an active member, dedupes rapid rescans, and appears live", async () => {
    const m = (await listMembers(db, orgId, NOW)).find((x) => x.membership?.status === "active")!;
    const r = await selfCheckIn(db, { checkinToken: org.checkinToken, phone: m.phone }, NOW);
    expect(r.result).toBe("checked_in");
    const again = await selfCheckIn(db, { checkinToken: org.checkinToken, accessToken: m.accessToken }, NOW + 10 * 60_000);
    expect(again.result).toBe("already");
    const live = await todayAttendance(db, orgId, NOW + 11 * 60_000);
    expect(live.filter((c) => c.customerId === m.id && c.at >= NOW)).toHaveLength(1);
  });

  it("refuses expired members and points them to renewal", async () => {
    const m = (await listMembers(db, orgId, NOW)).find((x) => x.membership?.status === "expired")!;
    const r = await selfCheckIn(db, { checkinToken: org.checkinToken, phone: m.phone }, NOW);
    expect(r.result).toBe("expired");
    if (r.result === "expired") expect(r.memberUrl).toContain(`/m/${m.accessToken}`);
  });

  it("does not accept another gym's member token, and reports unknown numbers", async () => {
    expect((await selfCheckIn(db, { checkinToken: org.checkinToken, phone: "+919999999999" }, NOW)).result).toBe("not_found");
    await expect(selfCheckIn(db, { checkinToken: "bad", phone: "+919999999999" }, NOW)).rejects.toThrow();
  });

  it("supports desk check-in", async () => {
    const m = (await listMembers(db, orgId, NOW)).find((x) => x.membership?.status === "active")!;
    expect((await deskCheckIn(db, orgId, m.id, NOW)).result).toBe("checked_in");
    const [row] = await db.select().from(checkIns).where(eq(checkIns.customerId, m.id)).orderBy(checkIns.at);
    expect(row).toBeDefined();
  });
});

describe("memberships, payments and dues", () => {
  it("converts a lead into a member with server-side pricing and an invoice", async () => {
    await claimTrial(db, { trialToken: org.trialToken, name: "Rohit Kumar", phone: "+919000011111", consentService: true, consentMarketing: false }, NOW);
    const lead = (await listLeads(db, orgId)).find((l) => l.phone === "+919000011111")!;
    const plan = await monthly();
    const total = addGst(plan.pricePaise, plan.gstBp).total;
    await expect(sellMembership(db, { orgId, customerId: lead.id, planId: plan.id, paidPaise: total + 1, mode: "cash" }, NOW)).rejects.toThrow();
    const r = await sellMembership(db, { orgId, customerId: lead.id, planId: plan.id, paidPaise: 100000, mode: "cash" }, NOW);
    expect(r.invoiceNo).toMatch(/^RV-2026-\d{6}$/);
    expect(r.membership.duesPaise).toBe(total - 100000);
    expect(r.membership.daysToExpiry).toBe(29);
    const [c] = await db.select().from(customers).where(eq(customers.id, lead.id));
    expect(c.kind).toBe("member");
    expect(c.leadStage).toBe("converted");

    const pay = await recordPayment(db, { orgId, membershipId: r.membership.id, amountPaise: total - 100000, mode: "upi" }, NOW);
    expect(pay.duesPaise).toBe(0);
    await expect(recordPayment(db, { orgId, membershipId: r.membership.id, amountPaise: 100, mode: "upi" }, NOW)).rejects.toThrow(/Nothing is due/);
  });

  it("renews early from the current end date (no lost days)", async () => {
    const m = (await listMembers(db, orgId, NOW)).find((x) => x.membership?.status === "expiring" && x.membership.daysToExpiry === 3)!;
    const before = m.membership!.endAt;
    const plan = await monthly();
    const r = await sellMembership(db, { orgId, customerId: m.id, planId: plan.id, paidPaise: addGst(plan.pricePaise, plan.gstBp).total, mode: "upi" }, NOW);
    expect(r.isRenewal).toBe(true);
    expect(r.membership.startAt).toBe(before + DAY_MS);
    const after = (await listMembers(db, orgId, NOW)).find((x) => x.id === m.id)!;
    expect(after.membership!.status).toBe("active");
    expect(after.membership!.daysToExpiry).toBe(33);
  });

  it("renews from the member page via simulated UPI payment", async () => {
    const m = (await listMembers(db, orgId, NOW)).find((x) => x.membership?.status === "expired")!;
    const page = await memberPage(db, m.accessToken, NOW);
    expect(page.plans[0].upi).toMatch(/^upi:\/\/pay\?pa=kesariforge\.demo%40okdemo/);
    await simulateMemberPayment(db, m.accessToken, page.plans[0].id, NOW);
    const after = await memberPage(db, m.accessToken, NOW);
    expect(after.membership!.status).toBe("active");
    const msgs = await listOutbox(db, orgId);
    expect(msgs.some((x) => x.template === "payment_receipt" && x.to === m.phone)).toBe(true);
  });

  it("freezes a membership", async () => {
    const m = (await listMembers(db, orgId, NOW)).find((x) => x.membership?.status === "active")!;
    const f = await freezeMembership(db, orgId, m.membership!.id, 10, NOW);
    expect(f.status).toBe("frozen");
    expect(f.endAt - m.membership!.endAt).toBe(10 * DAY_MS);
  });
});

describe("reminders and consent", () => {
  it("sends each renewal stage once and respects consent", async () => {
    const run = await runDailyAutomations(db, orgId, NOW);
    expect(run.sent).toBeGreaterThan(0);
    expect(run.byTemplate["renewal_T-7"]).toBeGreaterThan(0);
    const again = await runDailyAutomations(db, orgId, NOW + HOUR_MS);
    expect(again.sent).toBe(0);
    expect(again.alreadySent).toBe(run.sent + run.skippedNoConsent);

    const rows = await db.select().from(outbox).where(eq(outbox.orgId, orgId));
    for (const r of rows.filter((x) => x.status === "sent")) {
      const c = await consentState(db, orgId, r.customerId!);
      expect(r.category === "marketing" ? c.marketing : c.service).toBe(true);
    }
    const upi = rows.find((r) => r.template === "renewal_T-7")!;
    expect(upi.body).toContain("/m/");
  });

  it("lets a member opt out of marketing from their page; marketing then is not sent", async () => {
    const risk = await atRiskMembers(db, orgId, NOW);
    const target = risk[0];
    await memberSetConsent(db, target.accessToken, "marketing", false, NOW);
    const r = await nudgeAtRisk(db, orgId, target.id, "stf_x", NOW);
    expect(r.result).toBe("skipped");
    await memberSetConsent(db, target.accessToken, "marketing", true, NOW + 1);
    const r2 = await nudgeAtRisk(db, orgId, target.id, "stf_x", NOW + DAY_MS);
    expect(r2.result).toBe("sent");
  });
});

describe("churn", () => {
  it("flags idle, dropped and low-attendance new members", async () => {
    const risk = await atRiskMembers(db, orgId, NOW);
    const rules = new Set(risk.flatMap((r) => r.rules));
    expect(rules.has("no_visit_7d")).toBe(true);
    expect(rules.has("new_member_low")).toBe(true);
    expect(risk[0].score).toBeGreaterThanOrEqual(risk.at(-1)!.score);
    // A check-in clears the idle flag.
    const idle = risk.find((r) => r.rules.includes("no_visit_7d") && !r.rules.includes("new_member_low"))!;
    await deskCheckIn(db, orgId, idle.id, NOW);
    const after = await atRiskMembers(db, orgId, NOW + 1000);
    expect(after.find((r) => r.id === idle.id)?.rules ?? []).not.toContain("no_visit_7d");
  });
});

describe("PT booking", () => {
  it("books, prevents double-booking, and reports commission", async () => {
    const [trainer] = await db.select().from(staff).where(eq(staff.role, "trainer")).orderBy(staff.name);
    const m = (await listMembers(db, orgId, NOW)).find((x) => x.membership?.status === "active")!;
    const tomorrow = startOfDayIST(NOW) + DAY_MS;
    const slots = await freeSlots(db, orgId, trainer.id, tomorrow, NOW);
    const at = slots.at(-1)!;
    const b = await bookPt(db, { orgId, trainerId: trainer.id, customerId: m.id, startsAt: at, via: "desk" }, NOW);
    expect(b.pricePaise).toBe(trainer.ptRatePaise);
    await expect(memberBookPt(db, m.accessToken, trainer.id, at, NOW)).rejects.toThrow(/Trainer is already booked/);
    expect(await freeSlots(db, orgId, trainer.id, tomorrow, NOW)).not.toContain(at);
    await setPtStatus(db, orgId, b.id, "done");
    await expect(setPtStatus(db, orgId, b.id, "cancelled")).rejects.toThrow(/already done/);
    const report = await commissionReport(db, orgId, startOfDayIST(NOW) - 30 * DAY_MS, NOW + 3 * DAY_MS);
    const mine = report.find((r) => r.trainerId === trainer.id)!;
    expect(mine.commissionPaise).toBe(Math.round((mine.revenuePaise * trainer.commissionBp) / 10_000));
  });

  it("refuses PT for leads", async () => {
    const [trainer] = await db.select().from(staff).where(eq(staff.role, "trainer"));
    const lead = (await listLeads(db, orgId))[0];
    await expect(bookPt(db, { orgId, trainerId: trainer.id, customerId: lead.id, startsAt: startOfDayIST(NOW) + DAY_MS + 8 * HOUR_MS, via: "desk" }, NOW)).rejects.toThrow(/PT is for members/);
  });
});

describe("leads", () => {
  it("moves leads through allowed stages only", async () => {
    const lead = (await listLeads(db, orgId)).find((l) => l.stage === "new")!;
    await moveLead(db, orgId, lead.id, "contacted");
    await expect(moveLead(db, orgId, lead.id, "converted")).rejects.toThrow(/Sell a plan/);
  });
});

describe("staff OTP auth", () => {
  it("issues a demo OTP to staff only and verifies once", async () => {
    const r = await requestOtp(db, DEMO.owner.phone, NOW);
    expect(r.demoOtp).toMatch(/^\d{6}$/);
    await expect(verifyOtp(db, DEMO.owner.phone, "000000" === r.demoOtp ? "111111" : "000000", NOW)).rejects.toThrow(/Wrong code/);
    const s = await verifyOtp(db, DEMO.owner.phone, r.demoOtp!, NOW);
    expect(s.role).toBe("owner");
    expect(s.orgId).toBe(orgId);
    await expect(verifyOtp(db, DEMO.owner.phone, r.demoOtp!, NOW)).rejects.toThrow(/expired/);
    const stranger = await requestOtp(db, "+919000000000", NOW);
    expect(stranger.demoOtp).toBeUndefined();
  });

  it("rate-limits OTP requests", async () => {
    for (let i = 0; i < 3; i++) await requestOtp(db, DEMO.desk.phone, NOW);
    await expect(requestOtp(db, DEMO.desk.phone, NOW)).rejects.toThrow(/Too many/);
  });
});

describe("DPDP export and erase", () => {
  it("exports and then erases personal data", async () => {
    const m = (await listMembers(db, orgId, NOW))[0];
    const data = await exportCustomer(db, orgId, m.id);
    expect(data!.customer.phone).toBe(m.phone);
    expect(data!.consents.length).toBeGreaterThan(0);
    await eraseCustomer(db, orgId, m.id, NOW);
    const [c] = await db.select().from(customers).where(eq(customers.id, m.id));
    expect(c.name).toBe("Erased member");
    expect(c.phone).not.toBe(m.phone);
    expect(await consentState(db, orgId, m.id)).toEqual({ service: false, marketing: false });
  });
});

describe("tenancy", () => {
  it("never returns another org's rows", async () => {
    const other = await seedDemo(db, NOW);
    const mine = await listMembers(db, orgId, NOW);
    const theirs = await listMembers(db, other.orgId, NOW);
    const ids = new Set(mine.map((m) => m.id));
    expect(theirs.every((m) => !ids.has(m.id))).toBe(true);
    await expect(deskCheckIn(db, other.orgId, mine[0].id, NOW)).rejects.toThrow(/not found/);
  });
});

describe("member page after early renewal", () => {
  it("shows the member as active until the renewed end date", async () => {
    const m = (await listMembers(db, orgId, NOW)).find((x) => x.membership?.status === "expiring" && x.membership.daysToExpiry === 3)!;
    const page = await memberPage(db, m.accessToken, NOW);
    await simulateMemberPayment(db, m.accessToken, page.plans[0].id, NOW);
    const after = await memberPage(db, m.accessToken, NOW);
    expect(after.membership!.status).toBe("active");
    expect(after.renewsTo).not.toBeNull();
    expect(after.membership!.daysToExpiry).toBe(33);
  });
});
