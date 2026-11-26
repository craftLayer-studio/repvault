import { describe, expect, it } from "vitest";
import { buildUpiUri, isValidVpa } from "./upi";

describe("UPI intent", () => {
  it("builds a upi://pay link with amount in rupees", () => {
    const uri = buildUpiUri({ vpa: "ironpeak.demo@okdemo", payeeName: "Iron Peak Fitness", amount: 249900, note: "Renewal" });
    expect(uri.startsWith("upi://pay?")).toBe(true);
    const params = new URLSearchParams(uri.slice("upi://pay?".length));
    expect(params.get("pa")).toBe("ironpeak.demo@okdemo");
    expect(params.get("am")).toBe("2499.00");
    expect(params.get("cu")).toBe("INR");
    expect(params.get("tn")).toBe("Renewal");
    expect(uri).not.toContain("+");
  });

  it("validates VPAs and amounts", () => {
    expect(isValidVpa("name@bank")).toBe(true);
    expect(isValidVpa("no-at-sign")).toBe(false);
    expect(() => buildUpiUri({ vpa: "bad", payeeName: "x", amount: 100 })).toThrow();
    expect(() => buildUpiUri({ vpa: "a.b@bank", payeeName: "x", amount: 0 })).toThrow();
  });
});
