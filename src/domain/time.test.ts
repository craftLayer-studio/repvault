import { describe, expect, it } from "vitest";
import { calendarDaysBetween, istDateKey, parseIstDateKey, startOfDayIST, startOfMonthIST } from "./time";

describe("IST time helpers", () => {
  // 2026-11-25 20:00 UTC is 26 Nov 01:30 IST.
  const lateNight = Date.UTC(2026, 10, 25, 20, 0);
  it("finds the IST calendar day", () => {
    expect(istDateKey(lateNight)).toBe("2026-11-26");
    expect(startOfDayIST(lateNight)).toBe(Date.UTC(2026, 10, 25, 18, 30));
  });
  it("counts calendar days, not 24h blocks", () => {
    const a = Date.UTC(2026, 10, 25, 18, 0); // 23:30 IST on 25th
    const b = Date.UTC(2026, 10, 25, 19, 0); // 00:30 IST on 26th
    expect(calendarDaysBetween(a, b)).toBe(1);
    expect(calendarDaysBetween(b, a)).toBe(-1);
  });
  it("parses date keys and month starts", () => {
    expect(parseIstDateKey("2026-11-26")).toBe(Date.UTC(2026, 10, 25, 18, 30));
    expect(parseIstDateKey("26/11/2026")).toBeNull();
    expect(istDateKey(startOfMonthIST(lateNight))).toBe("2026-11-01");
  });
});
