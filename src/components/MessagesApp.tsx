"use client";

import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Table } from "@astryxdesign/core/Table";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { formatDateTimeIST, formatPhone } from "@/domain";
import { post } from "@/lib/client";
import { useAction } from "./useAction";

export type OutboxRow = {
  id: string;
  to: string;
  name: string | null;
  template: string;
  category: "utility" | "marketing";
  body: string;
  status: "sent" | "skipped_no_consent";
  createdAt: number;
}

export function MessagesApp({ rows }: { rows: OutboxRow[] }) {
  const { notice, run } = useAction();
  return (
    <VStack gap={5}>
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <VStack gap={1}>
          <Heading level={1}>WhatsApp outbox</Heading>
          <Text color="secondary">Simulated adapter: every message RepVault would send on WhatsApp is recorded here. Nothing leaves this server.</Text>
        </VStack>
        <Button
          label="Run today's reminders"
          variant="primary"
          clickAction={async () =>
            void (await run(() => post<{ sent: number; skippedNoConsent: number; alreadySent: number }>("/api/owner/automations"), (r) => `${r.sent} sent, ${r.skippedNoConsent} skipped (no consent), ${r.alreadySent} already sent.`))
          }
        />
      </HStack>
      {notice && <Banner status={notice.status} title={notice.text} />}
      <Banner
        status="info"
        title="Consent rules"
        description="Utility messages (trial pass, renewals, dues, receipts, PT bookings) need the member's 'updates' opt-in. Offers, win-backs and 'missed you' nudges need the separate 'offers' opt-in. Messages without consent are logged as skipped and never sent."
      />
      <Table
        data={rows}
        idKey="id"
        density="compact"
        verticalAlign="top"
        emptyState={<EmptyState title="No messages yet" description="Run today's reminders, or claim a trial on the walk-in QR." isCompact />}
        columns={[
          { key: "createdAt", header: "When", renderCell: (r) => formatDateTimeIST(r.createdAt) },
          { key: "to", header: "To", renderCell: (r) => <VStack gap={0}><Text type="label">{r.name ?? "—"}</Text><Text type="supporting" color="secondary">{r.to.startsWith("+") ? formatPhone(r.to) : r.to}</Text></VStack> },
          { key: "template", header: "Template", renderCell: (r) => <VStack gap={1}><Text type="code">{r.template}</Text><Badge label={r.category} variant={r.category === "marketing" ? "purple" : "neutral"} /></VStack> },
          { key: "body", header: "Message", renderCell: (r) => <Text type="supporting">{r.body}</Text> },
          { key: "status", header: "Status", renderCell: (r) => (r.status === "sent" ? <Badge label="Sent (simulated)" variant="success" /> : <Badge label="Skipped: no consent" variant="warning" />) },
        ]}
      />
    </VStack>
  );
}
