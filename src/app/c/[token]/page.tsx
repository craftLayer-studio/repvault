import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckInApp } from "@/components/CheckInApp";
import { getDb } from "@/server/db/client";
import { rememberedMember } from "@/server/member-cookie";
import { customerByAccessToken } from "@/server/store/customers";
import { orgByCheckinToken } from "@/server/store/org";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Check in", robots: { index: false } };

export default async function CheckInPage({ params }: PageProps<"/c/[token]">) {
  const { token } = await params;
  const db = await getDb();
  const org = await orgByCheckinToken(db, token).catch(() => null);
  if (!org) notFound();
  const access = await rememberedMember();
  const me = access ? await customerByAccessToken(db, access).catch(() => null) : null;
  return (
    <CheckInApp
      gym={org.name}
      isDemo={org.isDemo}
      token={token}
      trialPath={`/t/${org.trialToken}`}
      rememberedName={me && me.orgId === org.id ? me.name.split(" ")[0] : null}
    />
  );
}
