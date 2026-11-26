"use client";

// Front desk: Astryx `table-filter` page pattern (filter bar over a dense Table) with tabs.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Table } from "@astryxdesign/core/Table";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { TextInput } from "@astryxdesign/core/TextInput";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { CONSENT_TEXT, formatDateIST, formatINR, formatPhone, formatTimeIST, waMeLink, type LeadStage, type MembershipStatus } from "@/domain";
import { post } from "@/lib/client";
import { STATUS_BADGE } from "./MemberPage";
import { PaymentFields, SellPanel, type PayMode, type PlanOption } from "./SellPanel";
import { useAction } from "./useAction";

export type DeskMember = {
  id: string;
  name: string;
  phone: string;
  lastVisitAt: number | null;
  membership: { id: string; planName: string; status: MembershipStatus; endAt: number; daysToExpiry: number; duesPaise: number } | null;
}
export type DeskLead = {
  id: string;
  name: string;
  phone: string;
  goal: string | null;
  stage: LeadStage;
  createdAt: number;
  trialCode: string | null;
  trialUntil: number | null;
  trialUsed: boolean;
  consent: { service: boolean; marketing: boolean };
}
export type DeskVisit = {
  id: string;
  at: number;
  method: "self_qr" | "desk" | "trial";
  name: string;
  kind: "lead" | "member";
}

const STAGE: Record<LeadStage, { label: string; variant: "info" | "warning" | "success" | "neutral" | "error" }> = {
  new: { label: "New", variant: "info" },
  contacted: { label: "Contacted", variant: "neutral" },
  visited: { label: "Trial visited", variant: "warning" },
  converted: { label: "Converted", variant: "success" },
  lost: { label: "Lost", variant: "error" },
};
const METHOD = { self_qr: "Entrance QR", desk: "Desk", trial: "Trial pass" } as const;

type Panel = { kind: "sell"; id: string; name: string; renew: boolean } | { kind: "pay"; id: string; name: string; dues: number } | { kind: "freeze"; id: string; name: string } | null;

export function DeskApp({ gym, visits, members, leads, plans }: { gym: string; visits: DeskVisit[]; members: DeskMember[]; leads: DeskLead[]; plans: PlanOption[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("live");
  const { notice, run } = useAction();
  const [panel, setPanel] = useState<Panel>(null);

  // Live view: re-fetch server data every 10 seconds.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(t);
  }, [router]);

  const openLeads = leads.filter((l) => l.stage !== "lost" && l.stage !== "converted");
  const checkIn = (m: { id: string; name: string }) =>
    run(() => post<{ result: string }>("/api/staff/checkin", { customerId: m.id }), (r) =>
      r.result === "checked_in" ? `${m.name} checked in` : r.result === "already" ? `${m.name} was already checked in` : `${m.name} cannot check in: membership expired. Renew first.`,
    );

  const panelView = panel && (
    <>
      {panel.kind === "sell" && (
        <SellPanel
          title={`${panel.renew ? "Renew" : "Sell a plan to"} ${panel.name}`}
          plans={plans}
          onCancel={() => setPanel(null)}
          onSubmit={async (planId, paidPaise, mode) => {
            const r = await run(() => post<{ invoiceNo: string | null }>("/api/staff/sell", { customerId: panel.id, planId, paidPaise, mode }), (x) => `Plan sold to ${panel.name}${x.invoiceNo ? `. Invoice ${x.invoiceNo}` : ""}`);
            if (r) setPanel(null);
          }}
        />
      )}
      {panel.kind === "pay" && <PayPanel name={panel.name} dues={panel.dues} onCancel={() => setPanel(null)} onSubmit={async (amountPaise, mode) => { const r = await run(() => post<{ invoiceNo: string }>("/api/staff/payment", { membershipId: panel.id, amountPaise, mode }), (x) => `Payment recorded. Invoice ${x.invoiceNo}`); if (r) setPanel(null); }} />}
      {panel.kind === "freeze" && <FreezePanel name={panel.name} onCancel={() => setPanel(null)} onSubmit={async (days) => { const r = await run(() => post("/api/staff/freeze", { membershipId: panel.id, days }), `Membership frozen for ${days} days; end date moved out`); if (r) setPanel(null); }} />}
    </>
  );

  return (
    <VStack gap={5}>
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <VStack gap={1}>
          <Heading level={1}>Front desk</Heading>
          <Text color="secondary">{gym} · live, refreshes every 10 seconds</Text>
        </VStack>
        <HStack gap={2}>
          <Badge label={`${visits.length} in today`} variant="success" />
          <Badge label={`${openLeads.length} open leads`} variant="info" />
        </HStack>
      </HStack>
      {notice && <Banner status={notice.status} title={notice.text} />}
      {panelView}
      <TabList value={tab} onChange={setTab} hasDivider>
        <Tab value="live" label="Live attendance" />
        <Tab value="members" label="Members" />
        <Tab value="leads" label={`Walk-in leads (${openLeads.length})`} />
        <Tab value="new" label="New member" />
      </TabList>

      {tab === "live" && (
        <Table
          data={visits}
          idKey="id"
          emptyState={<EmptyState title="No check-ins yet today" description="Members appear here the moment they scan the entrance QR." isCompact />}
          columns={[
            { key: "at", header: "Time", renderCell: (v) => formatTimeIST(v.at) },
            { key: "name", header: "Name" },
            { key: "kind", header: "Type", renderCell: (v) => (v.kind === "lead" ? <Badge label="Trial" variant="warning" /> : <Badge label="Member" />) },
            { key: "method", header: "Via", renderCell: (v) => METHOD[v.method] },
          ]}
        />
      )}
      {tab === "members" && <MembersTab members={members} onCheckIn={checkIn} setPanel={setPanel} />}
      {tab === "leads" && (
        <Table
          data={leads}
          idKey="id"
          emptyState={<EmptyState title="No walk-in leads yet" description="Leads appear when someone claims a trial on the walk-in QR." isCompact />}
          columns={[
            { key: "name", header: "Lead", renderCell: (l) => <VStack gap={0}><Text type="label">{l.name}</Text><Text type="supporting" color="secondary">{formatPhone(l.phone)}</Text></VStack> },
            { key: "goal", header: "Goal", renderCell: (l) => l.goal ?? "—" },
            { key: "stage", header: "Stage", renderCell: (l) => <Badge {...STAGE[l.stage]} /> },
            { key: "trialCode", header: "Trial", renderCell: (l) => <VStack gap={0}><Text>{l.trialCode ?? "—"}</Text><Text type="supporting" color="secondary">{l.trialUntil ? `${formatDateIST(l.trialUntil - 1)}${l.trialUsed ? " · used" : ""}` : ""}</Text></VStack> },
            { key: "consent", header: "WhatsApp opt-in", renderCell: (l) => <Text type="supporting">{[l.consent.service && "Updates", l.consent.marketing && "Offers"].filter(Boolean).join(", ") || "None"}</Text> },
            {
              key: "id",
              header: "Actions",
              renderCell: (l) =>
                l.stage === "converted" ? null : (
                  <HStack gap={1} wrap="wrap">
                    <Button label="Sell plan" size="sm" variant="primary" onClick={() => setPanel({ kind: "sell", id: l.id, name: l.name, renew: false })} />
                    <Button label="WhatsApp" size="sm" href={waMeLink(l.phone, `Hi ${l.name.split(" ")[0]}, this is ${gym}. How was your trial?`)} target="_blank" rel="noopener noreferrer" />
                    {l.stage !== "contacted" && l.stage !== "lost" && <Button label="Contacted" size="sm" variant="ghost" clickAction={() => run(() => post(`/api/staff/leads/${l.id}`, { stage: "contacted" }), `${l.name} marked contacted`).then(() => undefined)} />}
                    {l.stage !== "lost" && <Button label="Lost" size="sm" variant="ghost" clickAction={() => run(() => post(`/api/staff/leads/${l.id}`, { stage: "lost" }), `${l.name} marked lost`).then(() => undefined)} />}
                  </HStack>
                ),
            },
          ]}
        />
      )}
      {tab === "new" && <NewMemberForm plans={plans} onDone={() => setTab("members")} run={run} />}
    </VStack>
  );
}

function MembersTab({ members, onCheckIn, setPanel }: { members: DeskMember[]; onCheckIn: (m: DeskMember) => unknown; setPanel: (p: Panel) => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, "");
    return members.filter((m) => {
      if (s && !m.name.toLowerCase().includes(s) && !(digits.length >= 3 && m.phone.includes(digits))) return false;
      const st = m.membership?.status;
      if (filter === "expiring") return st === "expiring";
      if (filter === "expired") return st === "expired";
      if (filter === "dues") return (m.membership?.duesPaise ?? 0) > 0;
      if (filter === "active") return st === "active" || st === "expiring" || st === "frozen";
      return true;
    });
  }, [members, q, filter]);
  return (
    <VStack gap={4}>
      <HStack gap={3} wrap="wrap" vAlign="end">
        <TextInput label="Search" isLabelHidden placeholder="Search name or phone" startIcon="search" value={q} onChange={setQ} hasClear width={320} />
        <SegmentedControl label="Filter members" value={filter} onChange={setFilter}>
          <SegmentedControlItem value="all" label="All" />
          <SegmentedControlItem value="active" label="Active" />
          <SegmentedControlItem value="expiring" label="Expiring" />
          <SegmentedControlItem value="expired" label="Expired" />
          <SegmentedControlItem value="dues" label="Dues" />
        </SegmentedControl>
      </HStack>
      <Table
        data={rows}
        idKey="id"
        density="compact"
        hasHover
        emptyState={<EmptyState title="No members match" isCompact />}
        columns={[
          { key: "name", header: "Member", renderCell: (m) => <VStack gap={0}><Text type="label">{m.name}</Text><Text type="supporting" color="secondary">{formatPhone(m.phone)}</Text></VStack> },
          { key: "membership", header: "Plan", renderCell: (m) => m.membership?.planName ?? "—" },
          { key: "id", header: "Status", renderCell: (m) => (m.membership ? <Badge {...STATUS_BADGE[m.membership.status]} /> : <Badge label="No plan" />) },
          { key: "phone", header: "Valid till", renderCell: (m) => (m.membership ? `${formatDateIST(m.membership.endAt)}${m.membership.status !== "expired" ? ` (${m.membership.daysToExpiry}d)` : ""}` : "—") },
          { key: "lastVisitAt", header: "Last visit", renderCell: (m) => (m.lastVisitAt ? formatDateIST(m.lastVisitAt) : "Never") },
          { key: "dues", header: "Dues", renderCell: (m) => ((m.membership?.duesPaise ?? 0) > 0 ? <Text color="accent">{formatINR(m.membership!.duesPaise)}</Text> : "—") },
          {
            key: "actions",
            header: "Actions",
            renderCell: (m) => (
              <HStack gap={1} wrap="wrap">
                <Button label="Check in" size="sm" variant="primary" clickAction={async () => void (await onCheckIn(m))} isDisabled={m.membership?.status === "expired"} />
                <Button label={m.membership ? "Renew" : "Sell plan"} size="sm" onClick={() => setPanel({ kind: "sell", id: m.id, name: m.name, renew: !!m.membership })} />
                {m.membership && m.membership.duesPaise > 0 && <Button label="Take payment" size="sm" onClick={() => setPanel({ kind: "pay", id: m.membership!.id, name: m.name, dues: m.membership!.duesPaise })} />}
                {m.membership && (m.membership.status === "active" || m.membership.status === "expiring") && <Button label="Freeze" size="sm" variant="ghost" onClick={() => setPanel({ kind: "freeze", id: m.membership!.id, name: m.name })} />}
              </HStack>
            ),
          },
        ]}
      />
    </VStack>
  );
}

function PayPanel({ name, dues, onSubmit, onCancel }: { name: string; dues: number; onSubmit: (amountPaise: number, mode: PayMode) => Promise<unknown>; onCancel: () => void }) {
  const [amount, setAmount] = useState(dues / 100);
  const [mode, setMode] = useState<PayMode>("upi");
  return (
    <Card>
      <VStack gap={4}>
        <Heading level={3}>Take payment from {name}</Heading>
        <PaymentFields maxPaise={dues} amount={amount} setAmount={setAmount} mode={mode} setMode={setMode} />
        <HStack gap={2}>
          <Button label="Record payment" variant="primary" clickAction={() => onSubmit(Math.round(amount * 100), mode).then(() => undefined)} />
          <Button label="Cancel" variant="ghost" onClick={onCancel} />
        </HStack>
      </VStack>
    </Card>
  );
}

function FreezePanel({ name, onSubmit, onCancel }: { name: string; onSubmit: (days: number) => Promise<unknown>; onCancel: () => void }) {
  const [days, setDays] = useState(7);
  return (
    <Card>
      <VStack gap={4}>
        <Heading level={3}>Freeze {name}&apos;s membership</Heading>
        <NumberInput label="Days" description="For travel or injury. The end date moves out by the same number of days." value={days} onChange={setDays} min={1} max={30} isIntegerOnly hasNumberSteppers />
        <HStack gap={2}>
          <Button label="Freeze" variant="primary" clickAction={() => onSubmit(days).then(() => undefined)} />
          <Button label="Cancel" variant="ghost" onClick={onCancel} />
        </HStack>
      </VStack>
    </Card>
  );
}

function NewMemberForm({ plans, onDone, run }: { plans: PlanOption[]; onDone: () => void; run: ReturnType<typeof useAction>["run"] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <Grid columns={{ minWidth: 320, max: 2, repeat: "fit" }} gap={4}>
      <Card>
        <VStack gap={4}>
          <Heading level={3}>Member details</Heading>
          <TextInput label="Name" value={name} onChange={setName} isRequired />
          <TextInput label="Mobile number" type="tel" inputMode="tel" value={phone} onChange={setPhone} isRequired />
          <Text type="label">Consent (ask the member; leave unticked if they say no)</Text>
          <CheckboxInput label={CONSENT_TEXT.service} value={service} onChange={setService} />
          <CheckboxInput label={CONSENT_TEXT.marketing} value={marketing} onChange={setMarketing} />
        </VStack>
      </Card>
      <SellPanel
        key={key}
        title="Plan and payment"
        plans={plans}
        onCancel={() => { setName(""); setPhone(""); setService(false); setMarketing(false); setKey((k) => k + 1); }}
        onSubmit={async (planId, paidPaise, mode) => {
          const r = await run(
            () => post<{ invoiceNo: string | null }>("/api/staff/sell", { newCustomer: { name, phone, consentService: service, consentMarketing: marketing }, planId, paidPaise, mode }),
            (x) => `${name} added${x.invoiceNo ? `. Invoice ${x.invoiceNo}` : ""}`,
          );
          if (r) onDone();
        }}
      />
    </Grid>
  );
}
