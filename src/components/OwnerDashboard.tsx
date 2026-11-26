"use client";

// Scaffolded from the Astryx `dashboard` template: headline tiles, then charts, then tables.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Divider } from "@astryxdesign/core/Divider";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Icon } from "@astryxdesign/core/Icon";
import { Link } from "@astryxdesign/core/Link";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Table } from "@astryxdesign/core/Table";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { CHURN_RULE_LABELS, formatDateIST, formatINR, formatPhone, waMeLink, type ChurnRule, type DayCount } from "@/domain";
import { post } from "@/lib/client";
import { useAction } from "./useAction";

export type DashboardData = {
  gym: string;
  activeMembers: number;
  expiringIn7: { id: string; name: string; phone: string; planName: string; daysToExpiry: number; endAt: number }[];
  recentlyExpired: number;
  duesTotal: number;
  revenue: { month: number; prevMonthToDate: number; change: number | null; today: number };
  attendance: { trend: DayCount[]; today: number; thisWeek: number; lastWeek: number; change: number | null; hourly: number[] };
  leads: { last30: number; converted: number; open: number };
  atRisk: { id: string; name: string; phone: string; rules: ChurnRule[]; daysSinceLastVisit: number | null; planName: string; daysToExpiry: number; lastAction: string | null; lastActionAt: number | null }[];
  atRiskCount: number;
  messages: { sent: number; skipped: number };
}

function MetricCard({ label, value, note, change }: { label: string; value: string; note: string; change?: number | null }) {
  return (
    <Card>
      <VStack gap={2}>
        <Heading level={4} accessibilityLevel={3}>
          {label}
        </Heading>
        <HStack gap={2} vAlign="center">
          <Heading level={2} accessibilityLevel={4}>
            {value}
          </Heading>
          {change != null && (
            <HStack gap={1} vAlign="center">
              <Icon icon={change >= 0 ? ArrowUpIcon : ArrowDownIcon} size="xsm" color={change >= 0 ? "success" : "error"} />
              <Text color="secondary">{Math.abs(change)}%</Text>
            </HStack>
          )}
        </HStack>
        <Text type="supporting" color="secondary">
          {note}
        </Text>
      </VStack>
    </Card>
  );
}

const shortDay = (key: string) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const hourLabel = (h: number) => `${((h + 11) % 12) + 1} ${h < 12 ? "am" : "pm"}`;

export function OwnerDashboard({ d }: { d: DashboardData }) {
  const { notice, run } = useAction();
  const peak = d.attendance.hourly.map((count, hour) => ({ id: String(hour), hour, count })).filter((h) => h.hour >= 5 && h.hour <= 22);
  const maxPeak = Math.max(1, ...peak.map((p) => p.count));
  const chart = d.attendance.trend.map((t) => ({ day: shortDay(t.date), visits: t.count }));

  return (
    <VStack gap={6}>
      <VisuallyHidden as="h1">Owner dashboard</VisuallyHidden>
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <VStack gap={1}>
          <Heading level={2} accessibilityLevel={2}>
            Good morning
          </Heading>
          <Text color="secondary">{d.gym}: who to renew, who to rescue, which walk-ins to call.</Text>
        </VStack>
        <Button
          label="Send today's reminders"
          variant="primary"
          clickAction={async () => {
            await run(
              () => post<{ sent: number; skippedNoConsent: number; alreadySent: number }>("/api/owner/automations"),
              (r) => `${r.sent} WhatsApp reminders sent, ${r.skippedNoConsent} skipped (no consent), ${r.alreadySent} already sent earlier.`,
            );
          }}
        />
      </HStack>
      {notice && <Banner status={notice.status} title={notice.text} endContent={<Link href="/owner/messages">View messages</Link>} />}

      <Grid gap={4} columns={{ minWidth: 220, max: 4, repeat: "fit" }}>
        <MetricCard label="Active members" value={String(d.activeMembers)} note={`${d.recentlyExpired} expired in the last 30 days`} />
        <MetricCard label="Expiring in 7 days" value={String(d.expiringIn7.length)} note="Renewal reminders go at T-7, T-3 and T-0" />
        <MetricCard label="Revenue this month" value={formatINR(d.revenue.month)} change={d.revenue.change} note={`vs same days last month · ${formatINR(d.revenue.today)} today`} />
        <MetricCard label="Check-ins today" value={String(d.attendance.today)} change={d.attendance.change} note={`${d.attendance.thisWeek} this week vs ${d.attendance.lastWeek} last week`} />
        <MetricCard label="At risk" value={String(d.atRiskCount)} note="Members flagged by churn rules" />
        <MetricCard label="Dues outstanding" value={formatINR(d.duesTotal)} note="Part-paid memberships" />
        <MetricCard label="Trial leads, 30 days" value={String(d.leads.last30)} note={`${d.leads.converted} converted · ${d.leads.open} open`} />
        <MetricCard label="WhatsApp, 7 days" value={String(d.messages.sent)} note={`${d.messages.skipped} held back for lack of consent`} />
      </Grid>

      <Divider />
      <Grid gap={4} columns={{ minWidth: 320, max: 2, repeat: "fit" }}>
        <Card>
          <VStack gap={4}>
            <Heading level={4} accessibilityLevel={3}>
              Attendance, last 14 days
            </Heading>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} interval={1} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "var(--color-background-muted)" }} contentStyle={{ background: "var(--color-background-surface)", border: "none", borderRadius: "var(--radius-container)" }} />
                <Bar dataKey="visits" name="Check-ins" fill="var(--color-accent)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </VStack>
        </Card>
        <Card>
          <VStack gap={3}>
            <Heading level={4} accessibilityLevel={3}>
              Peak hours, last 4 weeks
            </Heading>
            <Table
              data={peak}
              idKey="id"
              density="compact"
              dividers="none"
              columns={[
                { key: "hour", header: "Hour", renderCell: (p) => hourLabel(p.hour) },
                { key: "count", header: "Check-ins", renderCell: (p) => <ProgressBar label={`${hourLabel(p.hour)}: ${p.count} check-ins`} isLabelHidden value={p.count} max={maxPeak} /> },
              ]}
            />
          </VStack>
        </Card>
      </Grid>

      <Divider />
      <Grid gap={4} columns={{ minWidth: 360, max: 2, repeat: "fit" }}>
        <Card>
          <VStack gap={4}>
            <HStack hAlign="between" vAlign="center">
              <Heading level={4} accessibilityLevel={3}>
                Expiring in 7 days
              </Heading>
              <Link href="/desk">Open front desk</Link>
            </HStack>
            <Table
              data={d.expiringIn7}
              idKey="id"
              density="compact"
              emptyState={<EmptyState title="Nobody expires this week" isCompact />}
              columns={[
                { key: "name", header: "Member", renderCell: (m) => <VStack gap={0}><Text type="label">{m.name}</Text><Text type="supporting" color="secondary">{m.planName}</Text></VStack> },
                { key: "endAt", header: "Ends", renderCell: (m) => (m.daysToExpiry === 0 ? <Badge label="Today" variant="error" /> : `${formatDateIST(m.endAt)} (${m.daysToExpiry}d)`) },
                { key: "phone", header: "", renderCell: (m) => <Button label="WhatsApp" size="sm" href={waMeLink(m.phone, `Hi ${m.name.split(" ")[0]}, your ${d.gym} membership ends on ${formatDateIST(m.endAt)}. Shall I renew it for you?`)} target="_blank" rel="noopener noreferrer" /> },
              ]}
            />
          </VStack>
        </Card>
        <Card>
          <VStack gap={4}>
            <Heading level={4} accessibilityLevel={3}>
              At-risk members
            </Heading>
            <Table
              data={d.atRisk}
              idKey="id"
              density="compact"
              emptyState={<EmptyState title="No one at risk right now" isCompact />}
              columns={[
                { key: "name", header: "Member", renderCell: (r) => <VStack gap={0}><Text type="label">{r.name}</Text><Text type="supporting" color="secondary">{formatPhone(r.phone)}</Text></VStack> },
                {
                  key: "rules",
                  header: "Why",
                  renderCell: (r) => (
                    <VStack gap={1}>
                      {r.rules.map((x) => <Text key={x} type="supporting">{CHURN_RULE_LABELS[x]}</Text>)}
                      <Text type="supporting" color="secondary">{r.daysSinceLastVisit == null ? "Never visited" : `Last visit ${r.daysSinceLastVisit}d ago`}{r.lastAction ? ` · ${r.lastAction === "whatsapp" ? "nudged" : r.lastAction === "call" ? "called" : r.lastAction} ${formatDateIST(r.lastActionAt!)}` : ""}</Text>
                    </VStack>
                  ),
                },
                {
                  key: "id",
                  header: "Act",
                  renderCell: (r) => (
                    <HStack gap={1} wrap="wrap">
                      <Button label="Nudge" size="sm" variant="primary" tooltip="Send the 'missed you' WhatsApp (needs offers opt-in)" clickAction={async () => void (await run(() => post<{ result: string }>(`/api/owner/at-risk/${r.id}`, { action: "nudge" }), (x) => (x.result === "sent" ? `Nudge sent to ${r.name}` : x.result === "skipped" ? `${r.name} has not opted in to offers; logged, not sent. Try a call.` : `Already nudged ${r.name} today`)))} />
                      <Button label="Call" size="sm" href={`tel:${r.phone}`} onClick={() => void post(`/api/owner/at-risk/${r.id}`, { action: "call" })} />
                      <Button label="Dismiss" size="sm" variant="ghost" clickAction={async () => void (await run(() => post(`/api/owner/at-risk/${r.id}`, { action: "dismissed" }), `${r.name} hidden for 7 days`))} />
                    </HStack>
                  ),
                },
              ]}
            />
          </VStack>
        </Card>
      </Grid>
    </VStack>
  );
}
