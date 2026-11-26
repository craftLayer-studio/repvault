import { describe, expect, it } from "vitest";
import { reminderKey, reminderStage } from "./reminders";

describe("renewal reminder schedule", () => {
  it("maps days to expiry to stages", () => {
    expect(reminderStage(10)).toBeNull();
    expect(reminderStage(7)?.stage).toBe("T-7");
    expect(reminderStage(5)?.stage).toBe("T-7");
    expect(reminderStage(3)?.stage).toBe("T-3");
    expect(reminderStage(0)?.stage).toBe("T-0");
    expect(reminderStage(-1)).toBeNull();
    expect(reminderStage(-3)?.stage).toBe("T+3");
    expect(reminderStage(-12)?.stage).toBe("T+10");
    expect(reminderStage(-12)?.category).toBe("marketing");
    expect(reminderStage(-45)).toBeNull();
  });
  it("builds dedupe keys", () => {
    expect(reminderKey("m1", "T-3")).toBe("renewal:m1:T-3");
  });
});
