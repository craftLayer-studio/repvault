import type { Metadata } from "next";
import { OwnerDashboard } from "@/components/OwnerDashboard";
import { StaffShell } from "@/components/StaffShell";
import { getDb } from "@/server/db/client";
import { requirePageStaff } from "@/server/pages";
import { ownerDashboard } from "@/server/store/dashboard";
import { orgById } from "@/server/store/org";
import { atRiskMembers } from "@/server/store/roster";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Owner dashboard" };

export default async function OwnerPage() {
  const s = await requirePageStaff(["owner"]);
  const db = await getDb();
  const [org, d, risk] = await Promise.all([orgById(db, s.orgId), ownerDashboard(db, s.orgId), atRiskMembers(db, s.orgId)]);
  return (
    <StaffShell active="/owner" staff={s} gym={org.name} isDemo={org.isDemo}>
      <OwnerDashboard
        d={{
          ...d,
          gym: org.name,
          atRisk: risk.slice(0, 15).map((r) => ({ id: r.id, name: r.name, phone: r.phone, rules: r.rules, daysSinceLastVisit: r.daysSinceLastVisit, planName: r.planName, daysToExpiry: r.daysToExpiry, lastAction: r.lastAction, lastActionAt: r.lastActionAt })),
        }}
      />
    </StaffShell>
  );
}
