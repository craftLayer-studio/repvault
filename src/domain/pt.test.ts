import { describe, expect, it } from "vitest";
import { availableSlots, checkSlot, commission, daySlots } from "./pt";
import { DAY_MS, HOUR_MS, startOfDayIST } from "./time";

const now = Date.UTC(2026, 10, 25, 6, 0); // 11:30 IST
const tomorrow = startOfDayIST(now) + DAY_MS;

describe("PT booking", () => {
  it("lists hourly slots 6am-9pm IST", () => {
    const s = daySlots(tomorrow);
    expect(s).toHaveLength(15);
    expect(s[0]).toBe(tomorrow + 6 * HOUR_MS);
  });
  it("hides past and taken slots", () => {
    const today = availableSlots(now, "t1", [], now);
    expect(today[0]).toBe(startOfDayIST(now) + 13 * HOUR_MS); // 12:00 is under 30 min away? no: 12:00 is 30 min away, excluded
    const taken = availableSlots(tomorrow, "t1", [{ startsAt: tomorrow + 7 * HOUR_MS, trainerId: "t1", customerId: "c1", status: "booked" }], now);
    expect(taken).not.toContain(tomorrow + 7 * HOUR_MS);
    expect(taken).toHaveLength(14);
  });
  it("rejects clashes and bad times", () => {
    const at = tomorrow + 7 * HOUR_MS;
    const booked = [{ startsAt: at, trainerId: "t1", customerId: "c1", status: "booked" as const }];
    expect(checkSlot(at, "t1", "c2", booked, now)).toBe("trainer_busy");
    expect(checkSlot(at, "t2", "c1", booked, now)).toBe("member_busy");
    expect(checkSlot(at, "t2", "c2", booked, now)).toBeNull();
    expect(checkSlot(at + 1000, "t2", "c2", booked, now)).toBe("not_on_grid");
    expect(checkSlot(startOfDayIST(now) + 7 * HOUR_MS, "t2", "c2", [], now)).toBe("in_past");
    expect(checkSlot(tomorrow + 20 * DAY_MS + 7 * HOUR_MS, "t2", "c2", [], now)).toBe("too_far");
    expect(checkSlot(at, "t1", "c2", [{ ...booked[0], status: "cancelled" }], now)).toBeNull();
  });
  it("pays commission on completed sessions only", () => {
    const s = [
      { pricePaise: 80000, status: "done" as const },
      { pricePaise: 80000, status: "booked" as const },
      { pricePaise: 100000, status: "done" as const },
    ];
    expect(commission(s, 4000)).toBe(72000);
  });
});
