import QRCode from "qrcode";

/** Server-side SVG QR code as a data URI (no third-party QR service). */
export async function qrDataUri(text: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
