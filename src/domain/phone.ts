/**
 * Indian mobile numbers, stored in E.164 (+91XXXXXXXXXX). Accepts common typed forms:
 * "98765 43210", "+91-98765-43210", "09876543210", "919876543210".
 */
export function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  let local: string;
  if (/^\+91\d{10}$/.test(digits)) local = digits.slice(3);
  else if (/^91\d{10}$/.test(digits)) local = digits.slice(2);
  else if (/^0\d{10}$/.test(digits)) local = digits.slice(1);
  else if (/^\d{10}$/.test(digits)) local = digits;
  else return null;
  if (!/^[6-9]/.test(local)) return null;
  return `+91${local}`;
}

/** "+919876543210" -> "+91 98765 43210" */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** "+919876543210" -> "+91 ••••• •3210" for public screens. */
export function maskPhone(e164: string): string {
  return `+91 ••••• •${e164.slice(-4)}`;
}

/** wa.me click-to-chat link (free, opens WhatsApp with the text filled in; the user still taps send). */
export function waMeLink(e164: string, text: string): string {
  return `https://wa.me/${e164.replace("+", "")}?text=${encodeURIComponent(text)}`;
}
