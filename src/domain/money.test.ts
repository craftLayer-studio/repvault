import { describe, expect, it } from "vitest";
import { addGst, formatINR, percentOf, rupees } from "./money";

describe("money", () => {
  it("formats paise with Indian grouping", () => {
    expect(formatINR(123456789)).toBe("₹12,34,567.89");
    expect(formatINR(50000)).toBe("₹500");
    expect(formatINR(0)).toBe("₹0");
  });
  it("converts rupees and percentages without floats leaking", () => {
    expect(rupees(19.99)).toBe(1999);
    expect(percentOf(10000, 5)).toBe(500);
  });
  it("adds GST in basis points, rounded to the paisa", () => {
    expect(addGst(100000, 500)).toEqual({ base: 100000, gst: 5000, total: 105000 });
    expect(addGst(99900, 1800)).toEqual({ base: 99900, gst: 17982, total: 117882 });
  });
});
