import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { DEMO } from "@/server/db/seed";
import { HOME_FOR_ROLE } from "@/server/pages";
import { currentStaff } from "@/server/session";
import { isDemoMode } from "@/server/store/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff sign in" };

export default async function LoginPage() {
  const s = await currentStaff();
  if (s) redirect(HOME_FOR_ROLE[s.role]);
  const demoStaff = isDemoMode()
    ? [
        { label: `Owner: ${DEMO.owner.name}`, phone: DEMO.owner.phone },
        { label: `Front desk: ${DEMO.desk.name}`, phone: DEMO.desk.phone },
        { label: `Trainer: ${DEMO.trainers[0].name}`, phone: DEMO.trainers[0].phone },
      ]
    : [];
  return <LoginForm demoStaff={demoStaff} />;
}
