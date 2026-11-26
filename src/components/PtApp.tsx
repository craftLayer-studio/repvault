"use client";

import { useEffect, useState } from "react";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Selector } from "@astryxdesign/core/Selector";
import { Table } from "@astryxdesign/core/Table";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { DAY_MS, formatDateIST, formatDateTimeIST, formatINR, formatTimeIST, istDateKey } from "@/domain";
import { get, post } from "@/lib/client";
import { useAction } from "./useAction";

export type PtSessionRow = {
  id: string;
  startsAt: number;
  status: "booked" | "done" | "cancelled" | "no_show";
  pricePaise: number;
  member: string;
  trainer: string;
  via: "member_page" | "desk";
}
export type CommissionRow = {
  trainerId: string;
  name: string;
  commissionBp: number;
  done: number;
  booked: number;
  revenuePaise: number;
  commissionPaise: number;
}

const STATUS = {
  booked: { label: "Booked", variant: "info" },
  done: { label: "Done", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  no_show: { label: "No-show", variant: "error" },
} as const;

export function PtApp({
  today,
  canBook,
  sessions,
  trainers,
  members,
  commissions,
}: {
  today: number;
  canBook: boolean;
  sessions: PtSessionRow[];
  trainers: { id: string; name: string; ptRatePaise: number }[];
  members: { id: string; name: string }[];
  commissions: CommissionRow[] | null;
}) {
  const { notice, run } = useAction();
  const upcoming = sessions.filter((s) => s.startsAt >= today);
  const past = sessions.filter((s) => s.startsAt < today).reverse();
  const setStatus = (s: PtSessionRow, status: "done" | "no_show" | "cancelled") =>
    run(() => post(`/api/staff/pt/${s.id}`, { status }), `Session with ${s.member} marked ${STATUS[status].label.toLowerCase()}`).then(() => undefined);

  const columns = [
    { key: "startsAt" as const, header: "When", renderCell: (s: PtSessionRow) => formatDateTimeIST(s.startsAt) },
    { key: "member" as const, header: "Member" },
    { key: "trainer" as const, header: "Trainer" },
    { key: "via" as const, header: "Booked via", renderCell: (s: PtSessionRow) => (s.via === "member_page" ? "Member's phone" : "Desk") },
    { key: "status" as const, header: "Status", renderCell: (s: PtSessionRow) => <Badge {...STATUS[s.status]} /> },
    {
      key: "id" as const,
      header: "",
      renderCell: (s: PtSessionRow) =>
        s.status === "booked" ? (
          <HStack gap={1}>
            <Button label="Done" size="sm" variant="primary" clickAction={() => setStatus(s, "done")} />
            <Button label="No-show" size="sm" clickAction={() => setStatus(s, "no_show")} />
            <Button label="Cancel" size="sm" variant="ghost" clickAction={() => setStatus(s, "cancelled")} />
          </HStack>
        ) : null,
    },
  ];

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={1}>PT sessions</Heading>
        <Text color="secondary">One-hour sessions, 6 am to 9 pm. Members can also book from their own page.</Text>
      </VStack>
      {notice && <Banner status={notice.status} title={notice.text} />}
      {canBook && <BookPanel today={today} trainers={trainers} members={members} run={run} />}
      <VStack gap={3}>
        <Heading level={2}>Upcoming</Heading>
        <Table data={upcoming} idKey="id" density="compact" columns={columns} emptyState={<EmptyState title="No sessions booked" isCompact />} />
      </VStack>
      <VStack gap={3}>
        <Heading level={2}>Last 7 days</Heading>
        <Table data={past} idKey="id" density="compact" columns={columns} emptyState={<EmptyState title="No recent sessions" isCompact />} />
      </VStack>
      {commissions && (
        <VStack gap={3}>
          <Heading level={2}>Trainer commission, this month</Heading>
          <Table
            data={commissions}
            idKey="trainerId"
            columns={[
              { key: "name", header: "Trainer" },
              { key: "done", header: "Sessions done" },
              { key: "booked", header: "Still booked" },
              { key: "revenuePaise", header: "PT revenue", renderCell: (c) => formatINR(c.revenuePaise) },
              { key: "commissionBp", header: "Rate", renderCell: (c) => `${c.commissionBp / 100}%` },
              { key: "commissionPaise", header: "Commission owed", renderCell: (c) => <Text weight="bold">{formatINR(c.commissionPaise)}</Text> },
            ]}
          />
          <Text type="supporting" color="secondary">Only sessions marked done count. No-shows and cancellations earn no commission.</Text>
        </VStack>
      )}
    </VStack>
  );
}

function BookPanel({ today, trainers, members, run }: { today: number; trainers: { id: string; name: string; ptRatePaise: number }[]; members: { id: string; name: string }[]; run: ReturnType<typeof useAction>["run"] }) {
  const days = Array.from({ length: 14 }, (_, i) => today + i * DAY_MS);
  const [trainerId, setTrainerId] = useState(trainers[0]?.id ?? "");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [day, setDay] = useState(istDateKey(today));
  const [slots, setSlots] = useState<number[] | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!trainerId) return;
    let live = true;
    get<{ slots: number[] }>(`/api/staff/pt/slots?trainerId=${encodeURIComponent(trainerId)}&date=${day}`)
      .then((r) => live && setSlots(r.slots))
      .catch(() => live && setSlots([]));
    return () => {
      live = false;
    };
  }, [trainerId, day, tick]);

  if (!trainers.length) return null;
  return (
    <Card>
      <VStack gap={4}>
        <Heading level={3}>Book a session</Heading>
        <Grid columns={{ minWidth: 220, repeat: "fit" }} gap={3}>
          <Selector label="Trainer" options={trainers.map((t) => ({ value: t.id, label: `${t.name} · ${formatINR(t.ptRatePaise)}` }))} value={trainerId} onChange={(v) => v && (setSlots(null), setTrainerId(v))} />
          <Selector label="Member" options={members.map((m) => ({ value: m.id, label: m.name }))} value={memberId ?? undefined} onChange={setMemberId} hasSearch placeholder="Search member" />
          <Selector label="Day" options={days.map((d) => ({ value: istDateKey(d), label: formatDateIST(d) }))} value={day} onChange={(v) => v && (setSlots(null), setDay(v))} />
        </Grid>
        <HStack gap={2} wrap="wrap">
          {slots === null ? (
            <Text color="secondary">Loading slots…</Text>
          ) : slots.length === 0 ? (
            <Text color="secondary">No free slots that day.</Text>
          ) : (
            slots.map((s) => (
              <Button
                key={s}
                label={formatTimeIST(s)}
                size="sm"
                isDisabled={!memberId}
                tooltip={memberId ? undefined : "Pick a member first"}
                clickAction={async () => {
                  const r = await run(() => post("/api/staff/pt", { trainerId, customerId: memberId, startsAt: s }), `Booked for ${formatDateTimeIST(s)}`);
                  if (r) setTick((t) => t + 1);
                }}
              />
            ))
          )}
        </HStack>
      </VStack>
    </Card>
  );
}
