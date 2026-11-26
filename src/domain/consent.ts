/**
 * DPDP Act 2023 consent. Two separate purposes, each opted into with its own unticked box.
 * Records are append-only; the latest record for a purpose decides.
 */
export type ConsentPurpose = "service" | "marketing";
export type ConsentChannel = "qr_web" | "member_page" | "desk";

export const CONSENT_PURPOSES: readonly ConsentPurpose[] = ["service", "marketing"];
export const NOTICE_VERSION = "2026-11-v1";

export const CONSENT_TEXT: Record<ConsentPurpose, string> = {
  service:
    "Send me WhatsApp updates about my trial, membership, renewals, payments and bookings.",
  marketing: "Send me offers, challenges and news from this gym on WhatsApp. I can stop these any time.",
};

export interface ConsentRecordLike {
  purpose: ConsentPurpose;
  granted: boolean;
  at: number;
}

export function hasConsent(records: readonly ConsentRecordLike[], purpose: ConsentPurpose): boolean {
  let latest: ConsentRecordLike | null = null;
  for (const r of records) {
    if (r.purpose === purpose && (!latest || r.at >= latest.at)) latest = r;
  }
  return latest?.granted ?? false;
}

/** Message category to the consent it needs. Utility messages need "service"; marketing needs "marketing". */
export function purposeFor(category: "utility" | "marketing"): ConsentPurpose {
  return category === "utility" ? "service" : "marketing";
}
