import { eq } from "drizzle-orm";
import type { Db, Tx } from "../db/client";
import { orgs } from "../db/schema";
import { notFound } from "./errors";

export type Org = typeof orgs.$inferSelect;

export async function orgById(db: Db | Tx, orgId: string): Promise<Org> {
  const [org] = await db.select().from(orgs).where(eq(orgs.id, orgId));
  if (!org) throw notFound("Gym");
  return org;
}

export async function orgByCheckinToken(db: Db, token: string): Promise<Org> {
  const [org] = await db.select().from(orgs).where(eq(orgs.checkinToken, token));
  if (!org) throw notFound("Gym");
  return org;
}

export async function orgByTrialToken(db: Db, token: string): Promise<Org> {
  const [org] = await db.select().from(orgs).where(eq(orgs.trialToken, token));
  if (!org) throw notFound("Gym");
  return org;
}

/** Next GST invoice number for the org, e.g. "RV-2026-000123". Call inside a transaction. */
export async function nextInvoiceNo(tx: Tx, orgId: string, now: Date): Promise<string> {
  const { sql } = await import("drizzle-orm");
  const [row] = await tx
    .update(orgs)
    .set({ invoiceSeq: sql`${orgs.invoiceSeq} + 1` })
    .where(eq(orgs.id, orgId))
    .returning({ seq: orgs.invoiceSeq });
  return `RV-${now.getUTCFullYear()}-${String(row.seq).padStart(6, "0")}`;
}
