import { formatINR, type Paise } from "./money";
import { formatDateIST } from "./time";
import type { ReminderStage } from "./reminders";

/**
 * WhatsApp message bodies. In production these map to Meta-approved templates; here they are
 * plain text written to the outbox by the simulated adapter.
 */
export type TemplateId =
  | "trial_pass"
  | "welcome"
  | "renewal_T-7"
  | "renewal_T-3"
  | "renewal_T-0"
  | "renewal_T+3"
  | "renewal_T+10"
  | "dues"
  | "payment_receipt"
  | "missed_you"
  | "pt_booked"
  | "trial_followup";

export const TEMPLATE_CATEGORY: Record<TemplateId, "utility" | "marketing"> = {
  trial_pass: "utility",
  welcome: "utility",
  "renewal_T-7": "utility",
  "renewal_T-3": "utility",
  "renewal_T-0": "utility",
  "renewal_T+3": "utility",
  "renewal_T+10": "marketing",
  dues: "utility",
  payment_receipt: "utility",
  missed_you: "marketing",
  pt_booked: "utility",
  trial_followup: "marketing",
};

const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export function trialPassText(p: { name: string; gym: string; code: string; validUntil: number }): string {
  return `Hi ${first(p.name)}, your free trial pass at ${p.gym} is ready. Pass code ${p.code}, valid till ${formatDateIST(p.validUntil - 1)}. Show this at the desk. Reply STOP to opt out.`;
}

export function welcomeText(p: { name: string; gym: string; plan: string; endAt: number }): string {
  return `Welcome to ${p.gym}, ${first(p.name)}! Your ${p.plan} membership runs till ${formatDateIST(p.endAt)}. Scan the entrance QR to check in.`;
}

export function renewalText(p: { stage: ReminderStage; name: string; gym: string; plan: string; endAt: number; amount: Paise; link: string }): string {
  const n = first(p.name);
  const date = formatDateIST(p.endAt);
  switch (p.stage) {
    case "T-7":
      return `Hi ${n}, your ${p.plan} at ${p.gym} ends on ${date}. Renew for ${formatINR(p.amount)} in one tap: ${p.link}`;
    case "T-3":
      return `Hi ${n}, 3 days left on your ${p.gym} membership (ends ${date}). Renew now so your streak continues: ${p.link}`;
    case "T-0":
      return `Hi ${n}, your ${p.gym} membership ends today. Renew for ${formatINR(p.amount)}: ${p.link}`;
    case "T+3":
      return `Hi ${n}, your ${p.gym} membership ended on ${date}. We have kept your spot. Renew here: ${p.link}`;
    case "T+10":
      return `Hi ${n}, we miss you at ${p.gym}! Come back this week and restart with ${p.plan}: ${p.link}. Reply STOP to opt out of offers.`;
  }
}

export function duesText(p: { name: string; gym: string; amount: Paise; link: string }): string {
  return `Hi ${first(p.name)}, a balance of ${formatINR(p.amount)} is pending on your ${p.gym} membership. Pay by UPI here: ${p.link}`;
}

export function receiptText(p: { name: string; gym: string; amount: Paise; invoiceNo: string; endAt: number }): string {
  return `Thanks ${first(p.name)}! ${formatINR(p.amount)} received by ${p.gym}. Invoice ${p.invoiceNo}. Membership valid till ${formatDateIST(p.endAt)}.`;
}

export function missedYouText(p: { name: string; gym: string; link: string }): string {
  return `Hi ${first(p.name)}, we missed you at ${p.gym} this week! Your trainer has kept a slot for you. Book or check your plan: ${p.link}. Reply STOP to opt out.`;
}

export function ptBookedText(p: { name: string; trainer: string; when: string; gym: string }): string {
  return `Hi ${first(p.name)}, your PT session with ${p.trainer} at ${p.gym} is booked for ${p.when}.`;
}

export function trialFollowupText(p: { name: string; gym: string; plan: string; amount: Paise; link: string }): string {
  return `Hi ${first(p.name)}, hope you enjoyed your trial at ${p.gym}! Join with ${p.plan} for ${formatINR(p.amount)} this week: ${p.link}. Reply STOP to opt out.`;
}
