import { describe, expect, it } from "vitest";
import { renewalText, TEMPLATE_CATEGORY, trialPassText } from "./messages";

const endAt = Date.UTC(2026, 11, 1, 18, 30);

describe("message templates", () => {
  it("uses the first name and formats rupees", () => {
    const t = renewalText({ stage: "T-7", name: "Neha Kulkarni", gym: "Demo Gym", plan: "Monthly", endAt, amount: 199900, link: "https://x/m/abc" });
    expect(t).toContain("Hi Neha,");
    expect(t).toContain("₹1,999");
    expect(t).toContain("https://x/m/abc");
  });
  it("marks win-back as marketing and includes an opt-out", () => {
    expect(TEMPLATE_CATEGORY["renewal_T+10"]).toBe("marketing");
    const t = renewalText({ stage: "T+10", name: "Rahul", gym: "G", plan: "Monthly", endAt, amount: 1, link: "l" });
    expect(t).toMatch(/STOP/);
  });
  it("builds a trial pass", () => {
    expect(trialPassText({ name: "Rahul Verma", gym: "G", code: "TRY-1234", validUntil: endAt })).toContain("TRY-1234");
  });
});
