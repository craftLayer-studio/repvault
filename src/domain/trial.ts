import { DAY_MS, startOfDayIST } from "./time";

export const TRIAL_DAYS = 1;
export const LEAD_STAGES = ["new", "contacted", "visited", "converted", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const GOALS = ["Weight loss", "Muscle gain", "General fitness", "Yoga & flexibility", "Sports / strength", "Other"] as const;

/** A trial pass covers whole IST days starting today. */
export function trialWindow(now: number, days = TRIAL_DAYS): { validFrom: number; validUntil: number } {
  const validFrom = startOfDayIST(now);
  return { validFrom, validUntil: validFrom + days * DAY_MS };
}

export function isTrialValid(p: { validFrom: number; validUntil: number }, now: number): boolean {
  return now >= p.validFrom && now < p.validUntil;
}

const ALLOWED: Record<LeadStage, LeadStage[]> = {
  new: ["contacted", "visited", "converted", "lost"],
  contacted: ["visited", "converted", "lost"],
  visited: ["contacted", "converted", "lost"],
  converted: [],
  lost: ["contacted"],
};

export function canMoveLead(from: LeadStage, to: LeadStage): boolean {
  return ALLOWED[from].includes(to);
}
