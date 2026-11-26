import type { Metadata, Viewport } from "next";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://repvault.craftlayer.store"),
  title: { default: "RepVault: QR check-in and renewals for gyms", template: "%s | RepVault" },
  description:
    "QR check-in, walk-in trial leads, WhatsApp renewal reminders with UPI links, churn alerts and PT booking for Indian gyms and studios.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
