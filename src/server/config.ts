/** Public base URL used in QR codes and WhatsApp links. */
export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3142").replace(/\/$/, "");
}

export const SUPPORT_EMAIL = "repvault@craftlayer.store";
