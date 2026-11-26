import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrialForm } from "@/components/TrialForm";
import { getDb } from "@/server/db/client";
import { orgByTrialToken } from "@/server/store/org";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Free trial pass", robots: { index: false } };

export default async function TrialPage({ params }: PageProps<"/t/[token]">) {
  const { token } = await params;
  const org = await orgByTrialToken(await getDb(), token).catch(() => null);
  if (!org) notFound();
  return <TrialForm gym={org.name} city={org.city} isDemo={org.isDemo} token={token} checkinPath={`/c/${org.checkinToken}`} />;
}
