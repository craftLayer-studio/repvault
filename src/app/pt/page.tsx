import type { Metadata } from "next";
import { DAY_MS, startOfDayIST, startOfMonthIST } from "@/domain";
import { PtApp } from "@/components/PtApp";
import { StaffShell } from "@/components/StaffShell";
import { currentTime } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { requirePageStaff } from "@/server/pages";
import { orgById } from "@/server/store/org";
import { commissionReport, listPtSessions, listTrainers } from "@/server/store/pt";
import { listMembers } from "@/server/store/roster";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "PT sessions" };

export default async function PtPage() {
  const s = await requirePageStaff(["owner", "desk", "trainer"]);
  const db = await getDb();
  const now = currentTime();
  const today = startOfDayIST(now);
  const [org, sessions, trainers, members] = await Promise.all([
    orgById(db, s.orgId),
    listPtSessions(db, s.orgId, today - 7 * DAY_MS, today + 15 * DAY_MS, s.role === "trainer" ? s.staffId : undefined),
    listTrainers(db, s.orgId),
    listMembers(db, s.orgId, now),
  ]);
  const commissions = s.role === "owner" ? await commissionReport(db, s.orgId, startOfMonthIST(now), now + 15 * DAY_MS) : null;
  return (
    <StaffShell active="/pt" staff={s} gym={org.name} isDemo={org.isDemo}>
      <PtApp
        today={today}
        canBook={s.role !== "trainer"}
        sessions={sessions}
        trainers={trainers}
        members={members.filter((m) => m.membership && m.membership.status !== "expired").map((m) => ({ id: m.id, name: m.name }))}
        commissions={commissions}
      />
    </StaffShell>
  );
}
