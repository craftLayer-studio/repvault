import { describe, expect, it } from "vitest";
import { assertSameOrigin, BadRequest, int, personName, phone } from "./http";
import { rateLimit } from "./rate-limit";
import { decodeSession, encodeSession } from "./session";

describe("input parsing", () => {
  it("normalises phones and rejects bad ones", () => {
    expect(phone({ phone: "98765 43210" })).toBe("+919876543210");
    expect(() => phone({ phone: "12345" })).toThrow(BadRequest);
  });
  it("validates names and integers", () => {
    expect(personName({ name: "  Neha   Kulkarni " })).toBe("Neha Kulkarni");
    expect(() => personName({ name: "N" })).toThrow();
    expect(() => int({ n: 1.5 }, "n", 0, 10)).toThrow();
    expect(int({ n: 3 }, "n", 0, 10)).toBe(3);
  });
  it("blocks cross-site origins", () => {
    const ok = new Request("http://gym.test/api", { method: "POST", headers: { origin: "http://gym.test", host: "gym.test" } });
    const bad = new Request("http://gym.test/api", { method: "POST", headers: { origin: "https://evil.test", host: "gym.test" } });
    expect(() => assertSameOrigin(ok)).not.toThrow();
    expect(() => assertSameOrigin(bad)).toThrow(/Cross-site/);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit per window", () => {
    for (let i = 0; i < 3; i++) rateLimit("t:key", 3, 1000, 0);
    expect(() => rateLimit("t:key", 3, 1000, 10)).toThrow(/Too many/);
    expect(() => rateLimit("t:key", 3, 1000, 2000)).not.toThrow();
  });
});

describe("session cookie", () => {
  const s = { staffId: "stf_1", orgId: "org_1", role: "desk" as const, name: "Pooja" };
  it("round-trips and rejects tampering and expiry", () => {
    const v = encodeSession(s, 0);
    expect(decodeSession(v, 1000)).toEqual(s);
    const [payload, mac] = v.split(".");
    const forged = Buffer.from(JSON.stringify({ ...s, role: "owner", exp: 9e9 })).toString("base64url");
    expect(decodeSession(`${forged}.${mac}`, 1000)).toBeNull();
    expect(decodeSession(`${payload}.${mac}`, 13 * 3600 * 1000)).toBeNull();
  });
});
