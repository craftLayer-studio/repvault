/**
 * Renewal reminder schedule (product plan, "Renewal" journey): T-7, T-3, T-0 utility reminders,
 * T+3 overdue follow-up, T+10 win-back offer (marketing, opted-in members only).
 */
export type ReminderStage = "T-7" | "T-3" | "T-0" | "T+3" | "T+10";

export interface ReminderRule {
  stage: ReminderStage;
  /** Inclusive range of days-to-expiry in which this stage fires. */
  from: number;
  to: number;
  category: "utility" | "marketing";
}

export const REMINDER_RULES: readonly ReminderRule[] = [
  { stage: "T-7", from: 4, to: 7, category: "utility" },
  { stage: "T-3", from: 1, to: 3, category: "utility" },
  { stage: "T-0", from: 0, to: 0, category: "utility" },
  { stage: "T+3", from: -9, to: -3, category: "utility" },
  { stage: "T+10", from: -30, to: -10, category: "marketing" },
];

/** Which stage (if any) applies at this many days to expiry. Each stage is sent once per membership. */
export function reminderStage(daysToExpiry: number): ReminderRule | null {
  return REMINDER_RULES.find((r) => daysToExpiry >= r.from && daysToExpiry <= r.to) ?? null;
}

/** Stable key so a stage is never sent twice for the same membership. */
export function reminderKey(membershipId: string, stage: ReminderStage): string {
  return `renewal:${membershipId}:${stage}`;
}

/** Dues reminders go at most once per IST week per membership. */
export function duesReminderKey(membershipId: string, istWeekStartKey: string): string {
  return `dues:${membershipId}:${istWeekStartKey}`;
}
