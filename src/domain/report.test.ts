import { describe, expect, it } from "vitest";
import { attendanceTrend, hourlyHistogram, percentChange } from "./report";
import { DAY_MS, HOUR_MS, startOfDayIST } from "./time";

const now = Date.UTC(2026, 10, 25, 6, 0);
const today = startOfDayIST(now);

describe("reports", () => {
  it("buckets check-ins by IST day, zero-filled", () => {
    const t = attendanceTrend([today + HOUR_MS, today + 2 * HOUR_MS, today - DAY_MS + HOUR_MS, today - 30 * DAY_MS], now, 7);
    expect(t).toHaveLength(7);
    expect(t[6]).toEqual({ date: "2026-11-25", count: 2 });
    expect(t[5].count).toBe(1);
    expect(t[0].count).toBe(0);
  });
  it("builds an hourly histogram in IST", () => {
    const h = hourlyHistogram([today + 6 * HOUR_MS, today + 6 * HOUR_MS + 5, today + 18 * HOUR_MS]);
    expect(h[6]).toBe(2);
    expect(h[18]).toBe(1);
  });
  it("computes percent change", () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(5, 0)).toBeNull();
  });
});
