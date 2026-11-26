import { assertPaise, type Paise } from "./money";
import { calendarDaysBetween, DAY_MS, startOfDayIST } from "./time";

/**
 * A membership covers whole IST calendar days. `startAt` is IST midnight of the first day and
 * `endAt` is IST midnight of the LAST valid day (inclusive), so "days to expiry" is a plain
 * calendar difference: 0 means "expires today", -3 means "expired three days ago".
 */
export interface MembershipPeriod {
  startAt: number;
  endAt: number;
  frozenFrom?: number | null;
  frozenUntil?: number | null;
}

export type MembershipStatus = "upcoming" | "active" | "expiring" | "frozen" | "expired";

/** Members inside this many days of expiry are "expiring" and get renewal nudges. */
export const EXPIRING_WINDOW_DAYS = 7;
export const MAX_FREEZE_DAYS = 30;

export function periodFor(durationDays: number, firstDay: number): { startAt: number; endAt: number } {
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3660) throw new Error("durationDays must be 1-3660");
  const startAt = startOfDayIST(firstDay);
  return { startAt, endAt: startAt + (durationDays - 1) * DAY_MS };
}

export function daysToExpiry(m: Pick<MembershipPeriod, "endAt">, now: number): number {
  return calendarDaysBetween(now, m.endAt);
}

export function isFrozen(m: MembershipPeriod, now: number): boolean {
  return m.frozenFrom != null && m.frozenUntil != null && now >= m.frozenFrom && now < m.frozenUntil;
}

export function membershipStatus(m: MembershipPeriod, now: number): MembershipStatus {
  if (now < m.startAt) return "upcoming";
  const left = daysToExpiry(m, now);
  if (left < 0) return "expired";
  if (isFrozen(m, now)) return "frozen";
  return left <= EXPIRING_WINDOW_DAYS ? "expiring" : "active";
}

/** True while the member may train (active, expiring or frozen). */
export function isCurrent(m: MembershipPeriod, now: number): boolean {
  const s = membershipStatus(m, now);
  return s === "active" || s === "expiring" || s === "frozen";
}

/**
 * First day of a renewal. Renewing early continues from the day after the current end, so the
 * member never loses days; renewing after expiry starts today.
 */
export function renewalFirstDay(current: Pick<MembershipPeriod, "endAt"> | null, now: number): number {
  const today = startOfDayIST(now);
  if (!current) return today;
  const next = current.endAt + DAY_MS;
  return next > today ? next : today;
}

/** Freeze for `days` from today; the end date moves out by the same number of days. */
export function freeze(m: MembershipPeriod, days: number, now: number): MembershipPeriod {
  if (!Number.isInteger(days) || days < 1 || days > MAX_FREEZE_DAYS) throw new Error(`Freeze must be 1-${MAX_FREEZE_DAYS} days`);
  if (membershipStatus(m, now) === "expired") throw new Error("Cannot freeze an expired membership");
  if (isFrozen(m, now)) throw new Error("Membership is already frozen");
  const from = startOfDayIST(now);
  return { ...m, frozenFrom: from, frozenUntil: from + days * DAY_MS, endAt: m.endAt + days * DAY_MS };
}

export function dues(price: Paise, paid: Paise): Paise {
  assertPaise(price, "price");
  assertPaise(paid, "paid");
  return Math.max(0, price - paid);
}
