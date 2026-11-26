import { describe, expect, it } from "vitest";
import { assessChurn } from "./churn";
import { DAY_MS } from "./time";

const now = Date.UTC(2026, 10, 25, 6, 0);
const daysAgo = (...d: number[]) => d.map((n) => now - n * DAY_MS);

describe("churn rules", () => {
  it("does not flag a regular", () => {
    const visits = daysAgo(1, 2, 4, 6, 8, 9, 11, 13, 15, 16, 18, 20, 22, 23, 25, 27, 29, 30, 32, 34);
    const a = assessChurn({ memberSince: now - 120 * DAY_MS, checkIns: visits, now });
    expect(a.rules).toEqual([]);
    expect(a.visitsLast7).toBe(4);
  });

  it("flags 7+ idle days", () => {
    const a = assessChurn({ memberSince: now - 120 * DAY_MS, checkIns: daysAgo(9, 12, 15), now });
    expect(a.rules).toContain("no_visit_7d");
    expect(a.daysSinceLastVisit).toBe(9);
  });

  it("flags a drop against the member's own baseline", () => {
    // 4 visits a week for weeks 2-5, then one visit this week.
    const prior = Array.from({ length: 16 }, (_, i) => 8 + Math.floor(i * 1.7));
    const a = assessChurn({ memberSince: now - 200 * DAY_MS, checkIns: daysAgo(2, ...prior), now });
    expect(a.weeklyBaseline).toBe(4);
    expect(a.rules).toEqual(["frequency_drop"]);
  });

  it("flags a new member who has barely come", () => {
    const a = assessChurn({ memberSince: now - 20 * DAY_MS, checkIns: daysAgo(18, 3), now });
    expect(a.rules).toEqual(["new_member_low"]);
  });

  it("gives brand-new members a grace period", () => {
    const a = assessChurn({ memberSince: now - 3 * DAY_MS, checkIns: [], now });
    expect(a.rules).toEqual([]);
  });

  it("ranks more rules and longer absences higher", () => {
    const idle = assessChurn({ memberSince: now - 20 * DAY_MS, checkIns: daysAgo(19), now });
    const mild = assessChurn({ memberSince: now - 120 * DAY_MS, checkIns: daysAgo(8), now });
    expect(idle.score).toBeGreaterThan(mild.score);
  });
});
