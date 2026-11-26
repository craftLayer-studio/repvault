import { DAY_MS, istDateKey, startOfDayIST } from "./time";

export interface DayCount {
  date: string;
  count: number;
}

/** Check-ins per IST day for the last `days` days, oldest first, including today. */
export function attendanceTrend(checkIns: readonly number[], now: number, days = 14): DayCount[] {
  const today = startOfDayIST(now);
  const first = today - (days - 1) * DAY_MS;
  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) counts.set(istDateKey(first + i * DAY_MS), 0);
  for (const t of checkIns) {
    if (t < first || t > now) continue;
    const k = istDateKey(t);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].map(([date, count]) => ({ date, count }));
}

/** Check-ins per IST hour of day (0-23) — the "peak hours" heatmap row. */
export function hourlyHistogram(checkIns: readonly number[]): number[] {
  const out = new Array<number>(24).fill(0);
  for (const t of checkIns) out[Math.floor((t - startOfDayIST(t)) / 3_600_000)]++;
  return out;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
