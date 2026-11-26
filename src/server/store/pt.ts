import { and, asc, eq, gte, lt } from "drizzle-orm";
import {
  availableSlots,
  checkSlot,
  commission,
  DAY_MS,
  formatDateTimeIST,
  ptBookedText,
  SLOT_PROBLEM_TEXT,
  startOfDayIST,
  type BookedSlot,
} from "@/domain";
import type { Db } from "../db/client";
import { customers, ptSessions, staff } from "../db/schema";
import { customerByAccessToken, customerById, messageCustomer } from "./customers";
import { notFound, StoreError } from "./errors";
import { newId } from "./ids";
import { currentMembership, summarize } from "./memberships";
import { orgById } from "./org";

export async function listTrainers(db: Db, orgId: string) {
  return db
    .select({ id: staff.id, name: staff.name, ptRatePaise: staff.ptRatePaise, commissionBp: staff.commissionBp })
    .from(staff)
    .where(and(eq(staff.orgId, orgId), eq(staff.role, "trainer"), eq(staff.active, true)))
    .orderBy(asc(staff.name));
}

async function bookedAround(db: Db, orgId: string, day: number): Promise<BookedSlot[]> {
  const from = startOfDayIST(day);
  const rows = await db
    .select()
    .from(ptSessions)
    .where(and(eq(ptSessions.orgId, orgId), gte(ptSessions.startsAt, new Date(from)), lt(ptSessions.startsAt, new Date(from + DAY_MS))));
  return rows.map((r) => ({ startsAt: r.startsAt.getTime(), trainerId: r.trainerId, customerId: r.customerId, status: r.status }));
}

export async function freeSlots(db: Db, orgId: string, trainerId: string, day: number, nowMs = Date.now()) {
  return availableSlots(day, trainerId, await bookedAround(db, orgId, day), nowMs);
}

export async function bookPt(
  db: Db,
  input: { orgId: string; trainerId: string; customerId: string; startsAt: number; via: "member_page" | "desk" },
  nowMs = Date.now(),
) {
  const now = new Date(nowMs);
  const org = await orgById(db, input.orgId);
  const [trainer] = await db.select().from(staff).where(and(eq(staff.orgId, org.id), eq(staff.id, input.trainerId), eq(staff.role, "trainer")));
  if (!trainer || !trainer.active) throw notFound("Trainer");
  const customer = await customerById(db, org.id, input.customerId);
  if (customer.kind !== "member") throw new StoreError(400, "PT is for members. Sell a plan first.");
  const m = await currentMembership(db, org.id, customer.id, nowMs);
  if (!m || summarize(m, nowMs).status === "expired") throw new StoreError(409, "Membership has expired. Renew to book PT.");
  return db.transaction(async (tx) => {
    // Re-read inside the transaction; the unique slot check is enforced here.
    const from = startOfDayIST(input.startsAt);
    const rows = await tx
      .select()
      .from(ptSessions)
      .where(and(eq(ptSessions.orgId, org.id), gte(ptSessions.startsAt, new Date(from)), lt(ptSessions.startsAt, new Date(from + DAY_MS))));
    const booked = rows.map((r) => ({ startsAt: r.startsAt.getTime(), trainerId: r.trainerId, customerId: r.customerId, status: r.status }));
    const problem = checkSlot(input.startsAt, trainer.id, customer.id, booked, nowMs);
    if (problem) throw new StoreError(409, SLOT_PROBLEM_TEXT[problem]);
    const [s] = await tx
      .insert(ptSessions)
      .values({ id: newId("pts"), orgId: org.id, trainerId: trainer.id, customerId: customer.id, startsAt: new Date(input.startsAt), pricePaise: trainer.ptRatePaise, status: "booked", bookedVia: input.via, createdAt: now })
      .returning();
    await messageCustomer(tx, org, customer, { template: "pt_booked", category: "utility", body: ptBookedText({ name: customer.name, trainer: trainer.name, when: formatDateTimeIST(input.startsAt), gym: org.name }) }, now);
    return { id: s.id, startsAt: input.startsAt, trainer: trainer.name, pricePaise: s.pricePaise };
  });
}

export async function memberBookPt(db: Db, accessToken: string, trainerId: string, startsAt: number, nowMs = Date.now()) {
  const c = await customerByAccessToken(db, accessToken);
  return bookPt(db, { orgId: c.orgId, trainerId, customerId: c.id, startsAt, via: "member_page" }, nowMs);
}

export async function setPtStatus(db: Db, orgId: string, sessionId: string, status: "done" | "cancelled" | "no_show", trainerOnly?: string) {
  const [s] = await db.select().from(ptSessions).where(and(eq(ptSessions.orgId, orgId), eq(ptSessions.id, sessionId)));
  if (!s) throw notFound("Session");
  if (trainerOnly && s.trainerId !== trainerOnly) throw new StoreError(403, "Not your session");
  if (s.status !== "booked") throw new StoreError(409, `Session is already ${s.status}`);
  await db.update(ptSessions).set({ status }).where(eq(ptSessions.id, s.id));
  return { id: s.id, status };
}

export async function listPtSessions(db: Db, orgId: string, fromMs: number, toMs: number, trainerId?: string) {
  const rows = await db
    .select({ s: ptSessions, member: customers.name, trainer: staff.name })
    .from(ptSessions)
    .innerJoin(customers, eq(customers.id, ptSessions.customerId))
    .innerJoin(staff, eq(staff.id, ptSessions.trainerId))
    .where(and(eq(ptSessions.orgId, orgId), gte(ptSessions.startsAt, new Date(fromMs)), lt(ptSessions.startsAt, new Date(toMs))))
    .orderBy(asc(ptSessions.startsAt));
  return rows
    .filter((r) => !trainerId || r.s.trainerId === trainerId)
    .map((r) => ({ id: r.s.id, startsAt: r.s.startsAt.getTime(), status: r.s.status, pricePaise: r.s.pricePaise, member: r.member, trainer: r.trainer, trainerId: r.s.trainerId, via: r.s.bookedVia }));
}

/** Commission owed per trainer for completed sessions in [from, to). */
export async function commissionReport(db: Db, orgId: string, fromMs: number, toMs: number) {
  const trainers = await listTrainers(db, orgId);
  const sessions = await listPtSessions(db, orgId, fromMs, toMs);
  return trainers.map((t) => {
    const mine = sessions.filter((s) => s.trainerId === t.id);
    return {
      trainerId: t.id,
      name: t.name,
      commissionBp: t.commissionBp,
      done: mine.filter((s) => s.status === "done").length,
      booked: mine.filter((s) => s.status === "booked").length,
      revenuePaise: mine.filter((s) => s.status === "done").reduce((a, s) => a + s.pricePaise, 0),
      commissionPaise: commission(mine, t.commissionBp),
    };
  });
}
