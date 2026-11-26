import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberPage } from "@/components/MemberPage";
import { getDb } from "@/server/db/client";
import { memberPage } from "@/server/store/member-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My membership", robots: { index: false } };

export default async function MemberRoute({ params }: PageProps<"/m/[token]">) {
  const { token } = await params;
  const data = await memberPage(await getDb(), token).catch(() => null);
  if (!data) notFound();
  return <MemberPage token={token} data={data} />;
}
