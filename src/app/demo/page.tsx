import type { Metadata } from "next";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { DemoHub } from "@/components/DemoHub";
import { appUrl } from "@/server/config";
import { getDb } from "@/server/db/client";
import { DEMO } from "@/server/db/seed";
import { qrDataUri } from "@/server/qr";
import { demoLinks } from "@/server/store/demo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Demo" };

export default async function DemoPage() {
  const links = await demoLinks(await getDb());
  if (!links) return <EmptyState title="No demo data" description="Run pnpm db:seed to create the demo gym." />;
  return (
    <DemoHub
      gym={links.gym}
      checkin={{ path: links.checkinPath, qr: await qrDataUri(appUrl() + links.checkinPath) }}
      trial={{ path: links.trialPath, qr: await qrDataUri(appUrl() + links.trialPath) }}
      members={links.members}
      staff={[
        { role: "Owner", name: DEMO.owner.name, phone: DEMO.owner.phone },
        { role: "Front desk", name: DEMO.desk.name, phone: DEMO.desk.phone },
        ...DEMO.trainers.map((t) => ({ role: "Trainer", name: t.name, phone: t.phone })),
      ]}
    />
  );
}
