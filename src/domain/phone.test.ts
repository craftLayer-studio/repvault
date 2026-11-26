import { describe, expect, it } from "vitest";
import { formatPhone, maskPhone, normalizeIndianPhone, waMeLink } from "./phone";

describe("phone", () => {
  it("normalises Indian mobile formats to E.164", () => {
    for (const v of ["98765 43210", "+91-98765-43210", "09876543210", "919876543210", "+919876543210"]) {
      expect(normalizeIndianPhone(v)).toBe("+919876543210");
    }
  });
  it("rejects landlines, short numbers and junk", () => {
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("5876543210")).toBeNull();
    expect(normalizeIndianPhone("abc")).toBeNull();
  });
  it("formats, masks and links", () => {
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
    expect(maskPhone("+919876543210")).toBe("+91 ••••• •3210");
    expect(waMeLink("+919876543210", "Hi there")).toBe("https://wa.me/919876543210?text=Hi%20there");
  });
});
