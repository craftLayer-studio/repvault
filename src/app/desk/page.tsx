import type { Metadata } from "next";
import { addGst } from "@/domain";
import { DeskApp } from "@/components/DeskApp";
import { StaffShell } from "@/components/StaffShell";
import { getDb } from "@/server/db/client";
import { requirePageStaff } from "@/server/pages";
import { todayAttendance } from "@/server/store/checkins";
import { listPlans } from "@/server/store/memberships";
import { orgById } from "@/server/store/org";
import { listLeads, listMembers } from "@/server/store/roster";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Front desk" };

export default async function DeskPage() {
  const s = await requirePageStaff(["owner", "desk"]);
  const db = await getDb();
  const [org, visits, members, leads, plans] = await Promise.all([orgById(db, s.orgId), todayAttendance(db, s.orgId), listMembers(db, s.orgId), listLeads(db, s.orgId), listPlans(db, s.orgId)]);
  return (
    <StaffShell active="/desk" staff={s} gym={org.name} isDemo={org.isDemo}>
      <DeskApp
        gym={org.name}
        visits={visits}
        members={members.map((m) => ({ id: m.id, name: m.name, phone: m.phone, lastVisitAt: m.lastVisitAt, membership: m.membership }))}
        leads={leads}
        plans={plans.map((p) => ({ id: p.id, name: p.name, durationDays: p.durationDays, totalPaise: addGst(p.pricePaise, p.gstBp).total }))}
      />
    </StaffShell>
  );
}
