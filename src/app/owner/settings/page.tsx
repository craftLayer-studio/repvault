import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { SettingsApp } from "@/components/SettingsApp";
import { StaffShell } from "@/components/StaffShell";
import { appUrl } from "@/server/config";
import { getDb } from "@/server/db/client";
import { customers } from "@/server/db/schema";
import { requirePageStaff } from "@/server/pages";
import { listPlans } from "@/server/store/memberships";
import { orgById } from "@/server/store/org";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const s = await requirePageStaff(["owner"]);
  const db = await getDb();
  const [org, plans, people] = await Promise.all([
    orgById(db, s.orgId),
    listPlans(db, s.orgId, true),
    db.select({ id: customers.id, name: customers.name, phone: customers.phone }).from(customers).where(eq(customers.orgId, s.orgId)).orderBy(asc(customers.name)),
  ]);
  return (
    <StaffShell active="/owner/settings" staff={s} gym={org.name} isDemo={org.isDemo}>
      <SettingsApp
        org={{ name: org.name, city: org.city, address: org.address, upiVpa: org.upiVpa, whatsapp: org.whatsapp, isDemo: org.isDemo, checkinUrl: `${appUrl()}/c/${org.checkinToken}`, trialUrl: `${appUrl()}/t/${org.trialToken}` }}
        plans={plans.map((p) => ({ id: p.id, name: p.name, durationDays: p.durationDays, pricePaise: p.pricePaise, gstBp: p.gstBp, active: p.active }))}
        people={people.filter((p) => !p.phone.startsWith("erased:"))}
      />
    </StaffShell>
  );
}
