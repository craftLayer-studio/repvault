"use client";

// Scaffolded from the Astryx `detail-page` template; reduced to a mobile single column.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { Switch } from "@astryxdesign/core/Switch";
import { Selector } from "@astryxdesign/core/Selector";
import { List, ListItem } from "@astryxdesign/core/List";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import {
  CONSENT_TEXT,
  DAY_MS,
  formatDateIST,
  formatDateTimeIST,
  formatINR,
  formatTimeIST,
  istDateKey,
  type ConsentPurpose,
  type MembershipStatus,
} from "@/domain";
import { get, post } from "@/lib/client";
import { PublicFrame } from "./PublicFrame";

export type MemberPageData = {
  gym: { name: string; city: string; isDemo: boolean; whatsapp: string };
  member: { name: string; kind: "lead" | "member"; phoneLast4: string };
  membership: { planName: string; endAt: number; status: MembershipStatus; daysToExpiry: number; duesPaise: number } | null;
  renewsTo: number | null;
  duesUpi: string | null;
  plans: { id: string; name: string; durationDays: number; totalPaise: number; upi: string }[];
  visitsLast30: number;
  pt: { id: string; startsAt: number; status: string; trainer: string }[];
  trainers: { id: string; name: string; ptRatePaise: number }[];
  consent: Record<ConsentPurpose, boolean>;
  today: number;
}

export const STATUS_BADGE: Record<MembershipStatus, { label: string; variant: "success" | "warning" | "error" | "info" | "neutral" }> = {
  active: { label: "Active", variant: "success" },
  expiring: { label: "Expiring soon", variant: "warning" },
  frozen: { label: "Frozen", variant: "info" },
  expired: { label: "Expired", variant: "error" },
  upcoming: { label: "Starts soon", variant: "neutral" },
};

export function MemberPage({ token, data }: { token: string; data: MemberPageData }) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ status: "success" | "error"; text: string } | null>(null);
  const m = data.membership;
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setNotice(null);
    try {
      await fn();
      setNotice({ status: "success", text: ok });
      router.refresh();
    } catch (e) {
      setNotice({ status: "error", text: (e as Error).message });
    }
  };

  return (
    <PublicFrame gym={data.gym.name} isDemo={data.gym.isDemo}>
      <VStack gap={1}>
        <Heading level={1}>Hi {data.member.name.split(" ")[0]}</Heading>
        <Text color="secondary">Your {data.gym.name} page · phone ending {data.member.phoneLast4}</Text>
      </VStack>
      {notice && <Banner status={notice.status} title={notice.text} />}

      {m ? (
        <Card>
          <VStack gap={3}>
            <HStack hAlign="between" vAlign="center">
              <Heading level={2}>{m.planName}</Heading>
              <Badge {...STATUS_BADGE[m.status]} />
            </HStack>
            <MetadataList>
              <MetadataListItem label={m.status === "expired" ? "Ended on" : "Valid till"}>{formatDateIST(data.renewsTo ?? m.endAt)}</MetadataListItem>
              {m.status !== "expired" && <MetadataListItem label="Days left">{String(m.daysToExpiry)}</MetadataListItem>}
              <MetadataListItem label="Visits in 30 days">{String(data.visitsLast30)}</MetadataListItem>
              {m.duesPaise > 0 && <MetadataListItem label="Balance due">{formatINR(m.duesPaise)}</MetadataListItem>}
            </MetadataList>
            {data.renewsTo && <Text type="supporting" color="secondary">Renewed: your next plan continues from {formatDateIST(m.endAt + DAY_MS)}.</Text>}
            {m.duesPaise > 0 && data.duesUpi && (
              <HStack gap={2} wrap="wrap">
                <Button label={`Pay ${formatINR(m.duesPaise)} by UPI`} variant="primary" href={data.duesUpi} />
                {data.gym.isDemo && <Button label="Demo: mark as paid" variant="ghost" clickAction={() => act(() => post(`/api/public/member/${token}/pay`, {}), "Payment received. Receipt sent on WhatsApp.")} />}
              </HStack>
            )}
          </VStack>
        </Card>
      ) : (
        <Banner status="info" title="No membership yet" description="Pick a plan below to join. Pay by any UPI app." />
      )}

      <VStack gap={3}>
        <Heading level={2}>{m ? "Renew" : "Join"}</Heading>
        <Text type="supporting" color="secondary">
          Prices include GST. Paying opens your UPI app (GPay, PhonePe, Paytm, BHIM) with the amount filled in.
          {data.gym.isDemo ? " In the demo, use the demo button to simulate the payment going through." : " The desk confirms your payment."}
        </Text>
        <List hasDividers>
          {data.plans.map((p) => (
            <ListItem
              key={p.id}
              label={`${p.name} · ${formatINR(p.totalPaise)}`}
              description={`${p.durationDays} days`}
              endContent={
                <HStack gap={2}>
                  <Button label="Pay by UPI" size="sm" variant="primary" href={p.upi} />
                  {data.gym.isDemo && (
                    <Button label="Demo: paid" size="sm" variant="ghost" clickAction={() => act(() => post(`/api/public/member/${token}/pay`, { planId: p.id }), `${p.name} plan active. Receipt sent on WhatsApp.`)} />
                  )}
                </HStack>
              }
            />
          ))}
        </List>
      </VStack>

      {data.member.kind === "member" && data.trainers.length > 0 && <PtBooking token={token} data={data} onBooked={(t) => act(async () => undefined, t)} />}

      <Divider />
      <VStack gap={3}>
        <Heading level={2}>WhatsApp preferences</Heading>
        {(["service", "marketing"] as const).map((p) => (
          <Switch
            key={p}
            label={p === "service" ? "Membership updates" : "Offers and challenges"}
            description={CONSENT_TEXT[p]}
            value={data.consent[p]}
            onChange={(v) => void act(() => post(`/api/public/member/${token}/consent`, { purpose: p, granted: v }), v ? "Opted in." : "Opted out. You will not get these messages.")}
          />
        ))}
        <Text type="supporting" color="secondary">
          To get a copy of your data or have it deleted, ask the desk or write to repvault@craftlayer.store.
        </Text>
      </VStack>
    </PublicFrame>
  );
}

function PtBooking({ token, data, onBooked }: { token: string; data: MemberPageData; onBooked: (text: string) => void }) {
  const router = useRouter();
  const today = data.today;
  const days = Array.from({ length: 7 }, (_, i) => today + i * DAY_MS);
  const [trainerId, setTrainerId] = useState<string>(data.trainers[0].id);
  const [day, setDay] = useState<string>(istDateKey(days[0]));
  const [slots, setSlots] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    get<{ slots: number[] }>(`/api/public/member/${token}/slots?trainerId=${encodeURIComponent(trainerId)}&date=${day}`)
      .then((r) => live && setSlots(r.slots))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [token, trainerId, day]);

  const trainer = data.trainers.find((t) => t.id === trainerId)!;
  const upcoming = data.pt.filter((p) => p.status === "booked");
  return (
    <VStack gap={3}>
      <Divider />
      <Heading level={2}>Personal training</Heading>
      {upcoming.length > 0 && (
        <List hasDividers>
          {upcoming.map((p) => (
            <ListItem key={p.id} label={formatDateTimeIST(p.startsAt)} description={`with ${p.trainer}`} endContent={<Badge label="Booked" variant="success" />} />
          ))}
        </List>
      )}
      {error && <Banner status="error" title={error} />}
      <Selector label="Trainer" options={data.trainers.map((t) => ({ value: t.id, label: `${t.name} · ${formatINR(t.ptRatePaise)} per session` }))} value={trainerId} onChange={(v) => v && (setSlots(null), setTrainerId(v))} />
      <Selector label="Day" options={days.map((d) => ({ value: istDateKey(d), label: d === today ? `Today, ${formatDateIST(d)}` : formatDateIST(d) }))} value={day} onChange={(v) => v && (setSlots(null), setDay(v))} />
      <HStack gap={2} wrap="wrap">
        {slots === null ? (
          <Text color="secondary">Loading slots…</Text>
        ) : slots.length === 0 ? (
          <Text color="secondary">No free slots that day. Try another day or trainer.</Text>
        ) : (
          slots.map((s) => (
            <Button
              key={s}
              label={formatTimeIST(s)}
              size="sm"
              clickAction={async () => {
                setError(null);
                try {
                  await post(`/api/public/member/${token}/pt`, { trainerId, startsAt: s });
                  setSlots((x) => x?.filter((y) => y !== s) ?? null);
                  onBooked(`Booked with ${trainer.name} at ${formatDateTimeIST(s)}.`);
                  router.refresh();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
          ))
        )}
      </HStack>
    </VStack>
  );
}
