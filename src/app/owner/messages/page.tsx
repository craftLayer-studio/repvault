import type { Metadata } from "next";
import { MessagesApp } from "@/components/MessagesApp";
import { StaffShell } from "@/components/StaffShell";
import { getDb } from "@/server/db/client";
import { requirePageStaff } from "@/server/pages";
import { listOutbox } from "@/server/store/automations";
import { orgById } from "@/server/store/org";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const s = await requirePageStaff(["owner"]);
  const db = await getDb();
  const [org, rows] = await Promise.all([orgById(db, s.orgId), listOutbox(db, s.orgId, 200)]);
  return (
    <StaffShell active="/owner/messages" staff={s} gym={org.name} isDemo={org.isDemo}>
      <MessagesApp rows={rows} />
    </StaffShell>
  );
}
