import { describe, expect, it } from "vitest";
import { hasConsent, purposeFor } from "./consent";

describe("consent", () => {
  it("defaults to no consent", () => {
    expect(hasConsent([], "service")).toBe(false);
  });
  it("uses the latest record per purpose", () => {
    const records = [
      { purpose: "marketing" as const, granted: true, at: 1 },
      { purpose: "service" as const, granted: true, at: 1 },
      { purpose: "marketing" as const, granted: false, at: 5 },
    ];
    expect(hasConsent(records, "marketing")).toBe(false);
    expect(hasConsent(records, "service")).toBe(true);
  });
  it("maps message categories to purposes", () => {
    expect(purposeFor("utility")).toBe("service");
    expect(purposeFor("marketing")).toBe("marketing");
  });
});
