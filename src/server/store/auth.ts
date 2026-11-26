import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { MINUTE_MS } from "@/domain";
import type { Db } from "../db/client";
import { orgs, otpCodes, staff } from "../db/schema";
import { StoreError } from "./errors";
import { newId } from "./ids";

export const OTP_TTL_MS = 5 * MINUTE_MS;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_PER_10_MIN = 3;

const hash = (phone: string, code: string) => createHash("sha256").update(`${phone}:${code}`).digest("hex");

/** Demo mode shows the OTP on screen. Real SMS needs an SMS adapter (not built). */
export const isDemoMode = () => process.env.DEMO_MODE !== "off";

export async function requestOtp(db: Db, phone: string, nowMs = Date.now()) {
  const [member] = await db.select().from(staff).where(and(eq(staff.phone, phone), eq(staff.active, true))).limit(1);
  // Same response whether or not the number is staff, so the endpoint does not reveal staff phones.
  const recent = await db.select().from(otpCodes).where(and(eq(otpCodes.phone, phone), gte(otpCodes.createdAt, new Date(nowMs - 10 * MINUTE_MS))));
  if (recent.length >= OTP_MAX_PER_10_MIN) throw new StoreError(429, "Too many codes requested. Try again in 10 minutes.");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(otpCodes).values({ id: newId("otp"), phone, codeHash: hash(phone, code), expiresAt: new Date(nowMs + OTP_TTL_MS), createdAt: new Date(nowMs) });
  return { sent: true, demoOtp: isDemoMode() && member ? code : undefined };
}

export interface StaffSession {
  staffId: string;
  orgId: string;
  role: "owner" | "desk" | "trainer";
  name: string;
}

export async function verifyOtp(db: Db, phone: string, code: string, nowMs = Date.now()): Promise<StaffSession> {
  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.usedAt), gte(otpCodes.expiresAt, new Date(nowMs))))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!otp) throw new StoreError(401, "Code expired. Request a new one.");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new StoreError(429, "Too many wrong codes. Request a new one.");
  const a = Buffer.from(otp.codeHash, "hex");
  const b = Buffer.from(hash(phone, code), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
    throw new StoreError(401, "Wrong code");
  }
  const [s] = await db
    .select({ id: staff.id, orgId: staff.orgId, role: staff.role, name: staff.name })
    .from(staff)
    .innerJoin(orgs, eq(orgs.id, staff.orgId))
    .where(and(eq(staff.phone, phone), eq(staff.active, true)))
    .limit(1);
  if (!s) throw new StoreError(401, "This number is not registered as staff");
  await db.update(otpCodes).set({ usedAt: new Date(nowMs) }).where(eq(otpCodes.id, otp.id));
  return { staffId: s.id, orgId: s.orgId, role: s.role, name: s.name };
}

export async function staffStillActive(db: Db, staffId: string, orgId: string): Promise<boolean> {
  const [s] = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.id, staffId), eq(staff.orgId, orgId), eq(staff.active, true)));
  return !!s;
}
