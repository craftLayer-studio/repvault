import { StoreError } from "./store/errors";

/** Fixed-window in-memory limiter for public QR endpoints. Per process; fine for one server. */
const windows = new Map<string, { start: number; count: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, nowMs = Date.now()): void {
  const w = windows.get(key);
  if (!w || nowMs - w.start >= windowMs) {
    windows.set(key, { start: nowMs, count: 1 });
    if (windows.size > 10_000) {
      for (const [k, v] of windows) if (nowMs - v.start >= windowMs) windows.delete(k);
    }
    return;
  }
  w.count++;
  if (w.count > limit) throw new StoreError(429, "Too many requests. Please wait a minute and try again.");
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
