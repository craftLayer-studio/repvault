import type { Metadata } from "next";
import { QrSheet } from "@/components/QrSheet";
import { appUrl } from "@/server/config";
import { getDb } from "@/server/db/client";
import { requirePageStaff } from "@/server/pages";
import { qrDataUri } from "@/server/qr";
import { orgById } from "@/server/store/org";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "QR sheet" };

export default async function QrPage() {
  const s = await requirePageStaff(["owner"]);
  const org = await orgById(await getDb(), s.orgId);
  const checkin = `${appUrl()}/c/${org.checkinToken}`;
  const trial = `${appUrl()}/t/${org.trialToken}`;
  return (
    <QrSheet
      gym={org.name}
      codes={[
        { title: "Members: scan to check in", subtitle: "One tap after your first scan", qr: await qrDataUri(checkin), url: checkin },
        { title: "New here? Free trial pass", subtitle: "Scan, enter your number, train today", qr: await qrDataUri(trial), url: trial },
      ]}
    />
  );
}
