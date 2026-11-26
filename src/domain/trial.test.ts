import { describe, expect, it } from "vitest";
import { canMoveLead, isTrialValid, trialWindow } from "./trial";
import { DAY_MS, istDateKey } from "./time";

const now = Date.UTC(2026, 10, 25, 6, 0);

describe("trial pass", () => {
  it("is valid for the rest of today (IST)", () => {
    const w = trialWindow(now);
    expect(istDateKey(w.validFrom)).toBe("2026-11-25");
    expect(isTrialValid(w, now)).toBe(true);
    expect(isTrialValid(w, now + DAY_MS)).toBe(false);
  });
  it("guards lead stage moves", () => {
    expect(canMoveLead("new", "contacted")).toBe(true);
    expect(canMoveLead("converted", "new")).toBe(false);
    expect(canMoveLead("lost", "contacted")).toBe(true);
  });
});
