import { describe, expect, it } from "vitest";
import { daysToExpiry, dues, freeze, isCurrent, membershipStatus, periodFor, renewalFirstDay } from "./membership";
import { DAY_MS, istDateKey } from "./time";

const now = Date.UTC(2026, 10, 25, 6, 0); // 25 Nov 2026, 11:30 IST

describe("membership period", () => {
  it("covers whole IST days, end inclusive", () => {
    const p = periodFor(30, now);
    expect(istDateKey(p.startAt)).toBe("2026-11-25");
    expect(istDateKey(p.endAt)).toBe("2026-12-24");
    expect(daysToExpiry(p, now)).toBe(29);
  });

  it("derives status from days to expiry", () => {
    const p = periodFor(30, now);
    expect(membershipStatus(p, now)).toBe("active");
    expect(membershipStatus(p, now + 22 * DAY_MS)).toBe("expiring");
    expect(membershipStatus(p, now + 29 * DAY_MS)).toBe("expiring");
    expect(membershipStatus(p, now + 30 * DAY_MS)).toBe("expired");
    expect(membershipStatus(p, now - DAY_MS)).toBe("upcoming");
    expect(isCurrent(p, now + 29 * DAY_MS)).toBe(true);
    expect(isCurrent(p, now + 30 * DAY_MS)).toBe(false);
  });

  it("renews early from the day after the current end, late from today", () => {
    const p = periodFor(30, now);
    expect(istDateKey(renewalFirstDay(p, now + 25 * DAY_MS))).toBe("2026-12-25");
    expect(istDateKey(renewalFirstDay(p, now + 40 * DAY_MS))).toBe(istDateKey(now + 40 * DAY_MS));
    expect(istDateKey(renewalFirstDay(null, now))).toBe("2026-11-25");
  });

  it("freezes and pushes the end date out", () => {
    const p = periodFor(30, now);
    const f = freeze(p, 10, now + DAY_MS);
    expect(f.endAt - p.endAt).toBe(10 * DAY_MS);
    expect(membershipStatus(f, now + 2 * DAY_MS)).toBe("frozen");
    expect(membershipStatus(f, now + 12 * DAY_MS)).toBe("active");
    expect(() => freeze(f, 5, now + 2 * DAY_MS)).toThrow(/already frozen/);
    expect(() => freeze(p, 0, now)).toThrow();
    expect(() => freeze(p, 5, now + 60 * DAY_MS)).toThrow(/expired/);
  });

  it("computes dues and never goes negative", () => {
    expect(dues(250000, 100000)).toBe(150000);
    expect(dues(250000, 300000)).toBe(0);
  });
});
