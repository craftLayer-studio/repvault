import { type Paise } from "./money";
import { DAY_MS, HOUR_MS, MINUTE_MS, startOfDayIST } from "./time";

/** PT sessions are one hour, on the hour, between these IST hours. */
export const PT_OPEN_HOUR = 6;
export const PT_CLOSE_HOUR = 21;
export const PT_SESSION_MINUTES = 60;
export const PT_MAX_DAYS_AHEAD = 14;

export interface BookedSlot {
  startsAt: number;
  trainerId: string;
  customerId: string;
  status: "booked" | "done" | "cancelled" | "no_show";
}

/** Start times (epoch ms) of every slot on the IST day containing `day`. */
export function daySlots(day: number): number[] {
  const start = startOfDayIST(day);
  const out: number[] = [];
  for (let h = PT_OPEN_HOUR; h < PT_CLOSE_HOUR; h++) out.push(start + h * HOUR_MS);
  return out;
}

export function availableSlots(day: number, trainerId: string, booked: readonly BookedSlot[], now: number): number[] {
  const taken = new Set(booked.filter((b) => b.trainerId === trainerId && b.status !== "cancelled").map((b) => b.startsAt));
  return daySlots(day).filter((t) => t > now + 30 * MINUTE_MS && !taken.has(t));
}

export type SlotProblem = "not_on_grid" | "in_past" | "too_far" | "trainer_busy" | "member_busy";

export function checkSlot(
  startsAt: number,
  trainerId: string,
  customerId: string,
  booked: readonly BookedSlot[],
  now: number,
): SlotProblem | null {
  if (!daySlots(startsAt).includes(startsAt)) return "not_on_grid";
  if (startsAt <= now + 30 * MINUTE_MS) return "in_past";
  if (startsAt > startOfDayIST(now) + (PT_MAX_DAYS_AHEAD + 1) * DAY_MS) return "too_far";
  const live = booked.filter((b) => b.status !== "cancelled" && b.startsAt === startsAt);
  if (live.some((b) => b.trainerId === trainerId)) return "trainer_busy";
  if (live.some((b) => b.customerId === customerId)) return "member_busy";
  return null;
}

export const SLOT_PROBLEM_TEXT: Record<SlotProblem, string> = {
  not_on_grid: "Pick a listed one-hour slot",
  in_past: "That slot has already started or is too soon",
  too_far: `Book up to ${PT_MAX_DAYS_AHEAD} days ahead`,
  trainer_busy: "Trainer is already booked then",
  member_busy: "Member already has a session then",
};

/** Commission in paise for completed sessions, rate in basis points. */
export function commission(sessions: readonly { pricePaise: Paise; status: BookedSlot["status"] }[], rateBp: number): Paise {
  return sessions
    .filter((s) => s.status === "done")
    .reduce((sum, s) => sum + Math.round((s.pricePaise * rateBp) / 10_000), 0);
}
