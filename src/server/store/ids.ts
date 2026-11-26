import { randomBytes, randomInt, randomUUID } from "node:crypto";

export const newId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

/** Unguessable URL-safe token (128 bits) for QR codes and member links. */
export const newToken = () => randomBytes(16).toString("base64url");

/** Short human code for trial passes, e.g. "TRY-4821". */
export const trialCode = () => `TRY-${randomInt(1000, 10000)}`;
