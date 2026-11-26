"use client";

// Scaffolded from the Astryx `settings` page pattern: grouped Sections with a dense Table.
import { useState } from "react";
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
import { TextInput } from "@astryxdesign/core/TextInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { useImperativeAlertDialog } from "@astryxdesign/core/AlertDialog";
import { addGst, formatINR, formatPhone } from "@/domain";
import { post } from "@/lib/client";
import { useAction } from "./useAction";

export type PlanRow = {
  id: string;
  name: string;
  durationDays: number;
  pricePaise: number;
  gstBp: number;
  active: boolean;
}

type Draft = { id?: string; name: string; durationDays: number; price: number; gstBp: number; active: boolean };

export function SettingsApp({
  org,
  plans,
  people,
}: {
  org: { name: string; city: string; address: string; upiVpa: string; whatsapp: string; isDemo: boolean; checkinUrl: string; trialUrl: string };
  plans: PlanRow[];
  people: { id: string; name: string; phone: string }[];
}) {
  const router = useRouter();
  const { notice, run } = useAction();
  const alert = useImperativeAlertDialog();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const person = people.find((p) => p.id === personId);

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={1}>Settings</Heading>
        <Text color="secondary">Plans, QR codes and data-protection tools.</Text>
      </VStack>
      {notice && <Banner status={notice.status} title={notice.text} />}

      <Grid columns={{ minWidth: 320, max: 2, repeat: "fit" }} gap={4}>
        <Card>
          <VStack gap={3}>
            <Heading level={3}>Gym</Heading>
            <MetadataList>
              <MetadataListItem label="Name">{org.name}</MetadataListItem>
              <MetadataListItem label="City">{org.city}</MetadataListItem>
              <MetadataListItem label="Address">{org.address}</MetadataListItem>
              <MetadataListItem label="UPI ID">{org.upiVpa}</MetadataListItem>
              <MetadataListItem label="WhatsApp">{formatPhone(org.whatsapp)}</MetadataListItem>
            </MetadataList>
          </VStack>
        </Card>
        <Card>
          <VStack gap={3}>
            <Heading level={3}>QR codes</Heading>
            <Text color="secondary">Print the sheet and stick it at the entrance: one code for member check-in, one for walk-in trials. The links contain random tokens that cannot be guessed.</Text>
            <Text type="code">{org.checkinUrl}</Text>
            <Text type="code">{org.trialUrl}</Text>
            <HStack gap={2}>
              <Button label="Open printable QR sheet" variant="primary" href="/owner/qr" />
            </HStack>
          </VStack>
        </Card>
      </Grid>

      <VStack gap={3}>
        <HStack hAlign="between" vAlign="center">
          <Heading level={2}>Membership plans</Heading>
          <Button label="Add plan" onClick={() => setDraft({ name: "", durationDays: 30, price: 1499, gstBp: 500, active: true })} />
        </HStack>
        {draft && (
          <Card>
            <VStack gap={4}>
              <Heading level={3}>{draft.id ? "Edit plan" : "New plan"}</Heading>
              <Grid columns={{ minWidth: 200, repeat: "fit" }} gap={3}>
                <TextInput label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                <NumberInput label="Duration" units="days" value={draft.durationDays} onChange={(v) => setDraft({ ...draft, durationDays: v })} min={1} max={730} isIntegerOnly />
                <NumberInput label="Price before GST" units="₹" value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} min={1} max={100000} />
                <Selector label="GST" options={[{ value: "0", label: "0%" }, { value: "500", label: "5%" }, { value: "1200", label: "12%" }, { value: "1800", label: "18%" }]} value={String(draft.gstBp)} onChange={(v) => v && setDraft({ ...draft, gstBp: Number(v) })} />
              </Grid>
              <Switch label="On sale" value={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
              <Text type="supporting" color="secondary">Total {formatINR(addGst(Math.round(draft.price * 100), draft.gstBp).total)} incl. GST. Confirm the GST rate for gym services with your CA.</Text>
              <HStack gap={2}>
                <Button
                  label="Save plan"
                  variant="primary"
                  clickAction={async () => {
                    const r = await run(() => post("/api/owner/plans", { id: draft.id, name: draft.name, durationDays: draft.durationDays, pricePaise: Math.round(draft.price * 100), gstBp: draft.gstBp, active: draft.active }), "Plan saved");
                    if (r) setDraft(null);
                  }}
                />
                <Button label="Cancel" variant="ghost" onClick={() => setDraft(null)} />
              </HStack>
            </VStack>
          </Card>
        )}
        <Table
          data={plans}
          idKey="id"
          columns={[
            { key: "name", header: "Plan" },
            { key: "durationDays", header: "Days" },
            { key: "pricePaise", header: "Price", renderCell: (p) => formatINR(p.pricePaise) },
            { key: "gstBp", header: "Total incl. GST", renderCell: (p) => `${formatINR(addGst(p.pricePaise, p.gstBp).total)} (${p.gstBp / 100}%)` },
            { key: "active", header: "Status", renderCell: (p) => (p.active ? <Badge label="On sale" variant="success" /> : <Badge label="Hidden" />) },
            { key: "id", header: "", renderCell: (p) => <Button label="Edit" size="sm" onClick={() => setDraft({ id: p.id, name: p.name, durationDays: p.durationDays, price: p.pricePaise / 100, gstBp: p.gstBp, active: p.active })} /> },
          ]}
        />
      </VStack>

      <VStack gap={3}>
        <Heading level={2}>Data protection (DPDP)</Heading>
        <Text color="secondary">When a member or lead asks, export everything held about them, or erase their personal data. Invoices stay for tax records but lose the name and phone.</Text>
        <HStack gap={2} wrap="wrap" vAlign="end">
          <Selector label="Person" options={people.map((p) => ({ value: p.id, label: `${p.name} · ${formatPhone(p.phone)}` }))} value={personId ?? undefined} onChange={setPersonId} hasSearch width={360} placeholder="Search a member or lead" />
          <Button label="Export data" isDisabled={!person} href={person ? `/api/owner/customers/${person.id}/export` : undefined} />
          <Button
            label="Erase personal data"
            variant="destructive"
            isDisabled={!person}
            onClick={() => {
              if (!person) return;
              alert.show({
                title: `Erase ${person.name}?`,
                description: "Name, phone and message text are removed and consents withdrawn. This cannot be undone.",
                actionLabel: "Erase",
                onAction: async () => {
                  await run(() => post(`/api/owner/customers/${person.id}/erase`), `${person.name}'s personal data erased`);
                  setPersonId(null);
                  alert.hide();
                },
              });
            }}
          />
        </HStack>
      </VStack>

      {org.isDemo && (
        <VStack gap={3}>
          <Heading level={2}>Demo</Heading>
          <HStack gap={2} vAlign="center" wrap="wrap">
            <Button
              label="Reset demo data"
              variant="destructive"
              onClick={() =>
                alert.show({
                  title: "Reset the demo gym?",
                  description: "All demo data is wiped and regenerated. You will be signed out.",
                  actionLabel: "Reset",
                  onAction: async () => {
                    await post("/api/demo/reset");
                    alert.hide();
                    router.push("/demo");
                  },
                })
              }
            />
            <Text type="supporting" color="secondary">Regenerates members, check-ins and leads relative to today.</Text>
          </HStack>
        </VStack>
      )}
      {alert.element}
    </VStack>
  );
}
