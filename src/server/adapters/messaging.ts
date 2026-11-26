import type { Tx } from "../db/client";
import { outbox } from "../db/schema";
import { newId } from "../store/ids";

export interface OutgoingMessage {
  orgId: string;
  customerId: string | null;
  to: string;
  template: string;
  category: "utility" | "marketing";
  body: string;
  dedupeKey?: string;
  /** False when the recipient has not opted in for this category; the message is logged, not sent. */
  allowed: boolean;
}

export interface MessagingAdapter {
  readonly name: string;
  /** Returns false if a message with the same dedupe key was already recorded. */
  sendWhatsApp(tx: Tx, msg: OutgoingMessage, now: Date): Promise<boolean>;
}

/**
 * Simulated WhatsApp: writes to the outbox table, which the owner sees under Messages.
 * A real adapter (Meta Cloud API or a BSP) would send here and then record the same row.
 */
export const simulatedWhatsApp: MessagingAdapter = {
  name: "simulated",
  async sendWhatsApp(tx, msg, now) {
    const rows = await tx
      .insert(outbox)
      .values({
        id: newId("msg"),
        orgId: msg.orgId,
        customerId: msg.customerId,
        channel: "whatsapp",
        toAddress: msg.to,
        template: msg.template,
        category: msg.category,
        body: msg.body,
        status: msg.allowed ? "sent" : "skipped_no_consent",
        dedupeKey: msg.dedupeKey ?? null,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: outbox.id });
    return rows.length > 0;
  },
};

export function messaging(): MessagingAdapter {
  return simulatedWhatsApp;
}
