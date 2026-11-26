/** India Standard Time is UTC+5:30 all year (no daylight saving). */
export const IST_OFFSET_MINUTES = 330;
export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

/** Epoch ms of the most recent IST midnight at or before `now`. */
export function startOfDayIST(now: number): number {
  const offsetMs = IST_OFFSET_MINUTES * MINUTE_MS;
  return Math.floor((now + offsetMs) / DAY_MS) * DAY_MS - offsetMs;
}

/** Whole IST calendar days from a to b (b later is positive). */
export function calendarDaysBetween(a: number, b: number): number {
  return Math.round((startOfDayIST(b) - startOfDayIST(a)) / DAY_MS);
}

/** "2026-11-25" for the IST calendar day containing `at`. */
export function istDateKey(at: number): string {
  return new Date(at + IST_OFFSET_MINUTES * MINUTE_MS).toISOString().slice(0, 10);
}

/** Epoch ms of IST midnight for a "YYYY-MM-DD" key, or null if malformed. */
export function parseIstDateKey(key: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const ms = Date.parse(`${key}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return ms - IST_OFFSET_MINUTES * MINUTE_MS;
}

/** Epoch ms of the first instant of the IST calendar month containing `at`. */
export function startOfMonthIST(at: number): number {
  const key = istDateKey(at);
  return parseIstDateKey(`${key.slice(0, 7)}-01`)!;
}

export function formatDateIST(at: number): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(at);
}

export function formatTimeIST(at: number): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true }).format(at);
}

export function formatDateTimeIST(at: number): string {
  return `${formatDateIST(at)}, ${formatTimeIST(at)}`;
}
