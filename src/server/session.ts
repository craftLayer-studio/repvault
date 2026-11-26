import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db/client";
import { StoreError } from "./store/errors";
import { staffStillActive, type StaffSession } from "./store/auth";

export const SESSION_COOKIE = "rv_session";
const SESSION_TTL_S = 12 * 60 * 60;

let warned = false;
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE === "off") {
    throw new Error("SESSION_SECRET (32+ chars) is required in production");
  }
  if (!warned) {
    console.warn("[repvault] SESSION_SECRET not set: using an insecure dev fallback. Set it in .env.");
    warned = true;
  }
  return "repvault-dev-only-insecure-session-secret-change-me";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function encodeSession(s: StaffSession, nowMs = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ ...s, exp: Math.floor(nowMs / 1000) + SESSION_TTL_S })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined, nowMs = Date.now()): StaffSession | null {
  if (!value) return null;
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const got = Buffer.from(mac);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as StaffSession & { exp: number };
    if (data.exp * 1000 < nowMs) return null;
    return { staffId: data.staffId, orgId: data.orgId, role: data.role, name: data.name };
  } catch {
    return null;
  }
}

export async function setSessionCookie(s: StaffSession): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, encodeSession(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function currentStaff(): Promise<StaffSession | null> {
  return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Server-side role check for every staff/owner action. */
export async function requireStaff(roles: readonly StaffSession["role"][]): Promise<StaffSession> {
  const s = await currentStaff();
  if (!s) throw new StoreError(401, "Sign in first");
  if (!roles.includes(s.role)) throw new StoreError(403, "Your role cannot do this");
  if (!(await staffStillActive(await getDb(), s.staffId, s.orgId))) throw new StoreError(401, "Account disabled");
  return s;
}
