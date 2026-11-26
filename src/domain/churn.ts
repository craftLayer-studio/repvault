import { DAY_MS } from "./time";

/**
 * Rule-based churn flags (AGENTS.md decision: explainable rules in the MVP, ML later).
 *  - no_visit_7d: no check-in in the last 7 days.
 *  - frequency_drop: visits in the last 7 days are at most half the member's own weekly average
 *    over the 4 weeks before that (only when that baseline is at least 2 visits a week).
 *  - new_member_low: in their first 30 days (and at least 14 days in) with fewer than 4 visits.
 */
export type ChurnRule = "no_visit_7d" | "frequency_drop" | "new_member_low";

export const CHURN_RULE_LABELS: Record<ChurnRule, string> = {
  no_visit_7d: "No visit in 7+ days",
  frequency_drop: "Visits down 50%+ vs usual",
  new_member_low: "New member, under 4 visits",
};

export interface ChurnInput {
  /** Epoch ms when the member first joined (first membership start). */
  memberSince: number;
  /** Check-in times, any order. */
  checkIns: readonly number[];
  now: number;
}

export interface ChurnAssessment {
  rules: ChurnRule[];
  lastVisitAt: number | null;
  daysSinceLastVisit: number | null;
  visitsLast7: number;
  weeklyBaseline: number;
  /** Higher is more urgent; used to sort the at-risk list. */
  score: number;
}

export function assessChurn({ memberSince, checkIns, now }: ChurnInput): ChurnAssessment {
  const past = checkIns.filter((t) => t <= now);
  const lastVisitAt = past.length ? Math.max(...past) : null;
  const daysSinceLastVisit = lastVisitAt == null ? null : Math.floor((now - lastVisitAt) / DAY_MS);
  const tenureDays = Math.floor((now - memberSince) / DAY_MS);
  const visitsLast7 = past.filter((t) => t > now - 7 * DAY_MS).length;
  const prior = past.filter((t) => t <= now - 7 * DAY_MS && t > now - 35 * DAY_MS).length;
  const weeklyBaseline = prior / 4;

  const rules: ChurnRule[] = [];
  const idleDays = daysSinceLastVisit ?? tenureDays;
  if (idleDays >= 7 && tenureDays >= 7) rules.push("no_visit_7d");
  if (tenureDays >= 35 && weeklyBaseline >= 2 && visitsLast7 <= weeklyBaseline / 2) rules.push("frequency_drop");
  if (tenureDays >= 14 && tenureDays < 30 && past.filter((t) => t >= memberSince).length < 4) rules.push("new_member_low");

  const score = rules.length * 100 + Math.min(idleDays, 60);
  return { rules, lastVisitAt, daysSinceLastVisit, visitsLast7, weeklyBaseline, score };
}
