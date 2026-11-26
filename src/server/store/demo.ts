import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { orgs } from "../db/schema";
import { atRiskMembers, listMembers } from "./roster";

/** Links for the demo hub: the demo gym's QR targets and a few member pages worth opening. */
export async function demoLinks(db: Db, nowMs = Date.now()) {
  const [org] = await db.select().from(orgs).where(eq(orgs.isDemo, true)).limit(1);
  if (!org) return null;
  const members = await listMembers(db, org.id, nowMs);
  const expiring = members.find((m) => m.membership?.status === "expiring");
  const expired = members.find((m) => m.membership?.status === "expired");
  const active = members.find((m) => m.membership?.status === "active");
  const risk = (await atRiskMembers(db, org.id, nowMs))[0];
  const pick = (m: { name: string; phone: string; accessToken: string } | undefined, why: string) =>
    m ? { name: m.name, phone: m.phone, path: `/m/${m.accessToken}`, why } : null;
  return {
    gym: org.name,
    checkinPath: `/c/${org.checkinToken}`,
    trialPath: `/t/${org.trialToken}`,
    members: [pick(active, "Active member"), pick(expiring, "Expiring this week"), pick(expired, "Expired"), pick(risk, "At risk of churn")].filter((x) => x !== null),
  };
}
