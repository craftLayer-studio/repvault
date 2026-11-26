/** Public base URL used in QR codes and WhatsApp links. */
export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3142").replace(/\/$/, "");
}

export const SUPPORT_EMAIL = "repvault@craftlayer.store";

/** Cookies are Secure whenever the app is served over HTTPS. */
export const secureCookies = (): boolean => appUrl().startsWith("https://");
