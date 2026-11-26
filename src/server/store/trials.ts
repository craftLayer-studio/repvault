import { and, desc, eq, gte } from "drizzle-orm";
import { DAY_MS, isTrialValid, trialPassText, trialWindow } from "@/domain";
import type { Db } from "../db/client";
import { customers, trialPasses } from "../db/schema";
import { customerByPhone, messageCustomer, recordConsent } from "./customers";
import { StoreError } from "./errors";
import { newId, newToken, trialCode } from "./ids";
import { orgByTrialToken } from "./org";

export interface ClaimTrialInput {
  trialToken: string;
  name: string;
  phone: string;
  goal?: string;
  consentService: boolean;
  consentMarketing: boolean;
}

/** One free trial per phone number per gym every 90 days. */
export const TRIAL_COOLDOWN_DAYS = 90;

export async function claimTrial(db: Db, input: ClaimTrialInput, nowMs = Date.now()) {
  const now = new Date(nowMs);
  const org = await orgByTrialToken(db, input.trialToken);
  return db.transaction(async (tx) => {
    let customer = await customerByPhone(tx, org.id, input.phone);
    if (customer?.kind === "member") {
      throw new StoreError(409, "This number already has a membership here. Use the check-in QR instead.");
    }
    if (customer) {
      const [last] = await tx
        .select()
        .from(trialPasses)
        .where(and(eq(trialPasses.orgId, org.id), eq(trialPasses.customerId, customer.id), gte(trialPasses.createdAt, new Date(nowMs - TRIAL_COOLDOWN_DAYS * DAY_MS))))
        .orderBy(desc(trialPasses.createdAt))
        .limit(1);
      if (last && isTrialValid({ validFrom: last.validFrom.getTime(), validUntil: last.validUntil.getTime() }, nowMs)) {
        return { gym: org.name, name: customer.name, code: last.code, validUntil: last.validUntil.getTime(), whatsapp: "duplicate" as const, accessToken: customer.accessToken, existing: true };
      }
      if (last) throw new StoreError(409, "This number has already used a free trial recently. Ask at the desk about plans.");
    } else {
      [customer] = await tx
        .insert(customers)
        .values({
          id: newId("cus"),
          orgId: org.id,
          phone: input.phone,
          name: input.name,
          kind: "lead",
          leadStage: "new",
          source: "trial_qr",
          goal: input.goal ?? null,
          accessToken: newToken(),
          createdAt: now,
        })
        .returning();
    }
    await recordConsent(tx, org.id, customer.id, { service: input.consentService, marketing: input.consentMarketing }, "qr_web", now);
    const w = trialWindow(nowMs);
    const code = trialCode();
    await tx.insert(trialPasses).values({ id: newId("trl"), orgId: org.id, customerId: customer.id, code, validFrom: new Date(w.validFrom), validUntil: new Date(w.validUntil), createdAt: now });
    const whatsapp = await messageCustomer(
      tx,
      org,
      customer,
      { template: "trial_pass", category: "utility", body: trialPassText({ name: customer.name, gym: org.name, code, validUntil: w.validUntil }) },
      now,
    );
    return { gym: org.name, name: customer.name, code, validUntil: w.validUntil, whatsapp, accessToken: customer.accessToken, existing: false };
  });
}
