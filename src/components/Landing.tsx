"use client";

// Scaffolded from the Astryx `centered-hero` template; frame kept, content replaced.
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Divider } from "@astryxdesign/core/Divider";
import { Link } from "@astryxdesign/core/Link";
import { Table } from "@astryxdesign/core/Table";
import { rtlStyles } from "@astryxdesign/core/utils";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import {
  QrCodeIcon,
  UserPlusIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const FEATURES = [
  { icon: QrCodeIcon, title: "Entrance QR check-in", body: "Members scan the wall QR with their phone camera. No app, no fingerprint scanner, no biometric data. Live attendance on the desk screen." },
  { icon: UserPlusIcon, title: "Walk-in trial QR", body: "Walk-ins claim a free trial pass in 30 seconds. Their phone lands in your lead list with DPDP-compliant, opt-in consent." },
  { icon: BellAlertIcon, title: "Renewal reminders with UPI", body: "WhatsApp reminders at 7, 3 and 0 days before expiry, and after, each with a one-tap UPI payment link. Each reminder goes once." },
  { icon: ExclamationTriangleIcon, title: "Churn-risk list", body: "Members who stop showing up are flagged every morning: 7 days absent, visits halved, or a slow first month. Nudge in one tap." },
  { icon: CalendarDaysIcon, title: "PT session booking", body: "Members book trainers from their phone; the desk sees the schedule; commissions are worked out from completed sessions." },
  { icon: ChartBarIcon, title: "Owner dashboard", body: "Active members, who expires this week, revenue this month and the attendance trend, on one screen." },
];

const PRICING = [
  { id: "starter", plan: "Starter", members: "Up to 150 members", month: "₹999", year: "₹9,999" },
  { id: "growth", plan: "Growth", members: "Up to 500 members", month: "₹1,999", year: "₹19,999" },
  { id: "pro", plan: "Pro", members: "Unlimited, 2 branches", month: "₹3,499", year: "₹34,999" },
];

export default function Landing() {
  return (
    <Layout
      height="auto"
      content={
        <LayoutContent role="main" padding={6}>
          <VStack gap={10}>
            <VStack gap={6} hAlign="center">
              <VStack gap={3} hAlign="center">
                <Badge label="For Indian gyms, yoga and fitness studios" variant="info" />
                <Heading level={1} type="display-2" justify="center" textWrap="balance">
                  Scan in. Show up. Renew on time.
                </Heading>
                <Text type="large" color="secondary" justify="center" textWrap="balance">
                  RepVault is the QR-first member engine for independent gyms: check-in at the door, free-trial leads from
                  walk-ins, WhatsApp renewal reminders with UPI links, and a morning list of members about to quit.
                </Text>
              </VStack>
              <HStack gap={3} wrap="wrap" hAlign="center">
                <Button
                  label="Try the demo"
                  variant="primary"
                  size="lg"
                  href="/demo"
                  endContent={<Icon icon={ArrowRightIcon} size="sm" color="inherit" xstyle={rtlStyles.mirror} />}
                />
                <Button label="Staff sign in" variant="secondary" size="lg" href="/login" />
              </HStack>
              <Text type="supporting" color="secondary" justify="center">
                The demo runs on a fictional gym with sample data. WhatsApp messages and payments are simulated.
              </Text>
            </VStack>

            <Grid columns={{ minWidth: 280, repeat: "fit" }} gap={4}>
                {FEATURES.map((f) => (
                  <Card key={f.title}>
                    <VStack gap={3}>
                      <Icon icon={f.icon} size="lg" color="accent" />
                      <Heading level={3}>{f.title}</Heading>
                      <Text color="secondary">{f.body}</Text>
                    </VStack>
                  </Card>
                ))}
            </Grid>

            <Divider />

            <VStack gap={4}>
              <Heading level={2}>How it works</Heading>
              <Grid columns={{ minWidth: 220, repeat: "fit" }} gap={4}>
                {[
                  ["1. Print two QR codes", "One for member check-in, one for walk-in trials. Stick them at the entrance."],
                  ["2. Members scan", "First scan asks for their phone number. After that, one tap. Expired members see a renew link."],
                  ["3. Reminders go out", "Renewal and dues reminders go on WhatsApp with a UPI link, only to members who opted in."],
                  ["4. You act each morning", "See who expires this week, who has gone quiet, and which walk-ins to call."],
                ].map(([t, b]) => (
                  <VStack key={t} gap={1}>
                    <Text type="label">{t}</Text>
                    <Text color="secondary">{b}</Text>
                  </VStack>
                ))}
              </Grid>
            </VStack>

            <VStack gap={4}>
              <Heading level={2}>Pricing</Heading>
              <Table
                data={PRICING}
                idKey="id"
                columns={[
                  { key: "plan", header: "Plan" },
                  { key: "members", header: "Members" },
                  { key: "month", header: "Per month" },
                  { key: "year", header: "Per year" },
                ]}
              />
              <Text type="supporting" color="secondary">
                Prices exclude 18% GST on the software fee. Planned pricing; RepVault is in MVP.
              </Text>
            </VStack>

            <Divider />
            <VStack gap={2} hAlign="center">
              <Text color="secondary" justify="center">
                A CraftLayer product. Questions: <Link href="mailto:repvault@craftlayer.store">repvault@craftlayer.store</Link> · Licensing:{" "}
                <Link href="mailto:licensing@craftlayer.store">licensing@craftlayer.store</Link>
              </Text>
              <Link href="https://craftlayer.store" isExternalLink>
                craftlayer.store
              </Link>
            </VStack>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
