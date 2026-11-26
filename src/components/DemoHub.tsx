"use client";

// Scaffolded from the Astryx `contact-form` frame (centered Section); content replaced.
import Image from "next/image";
import { Center } from "@astryxdesign/core/Center";
import { Section } from "@astryxdesign/core/Section";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Table } from "@astryxdesign/core/Table";
import { formatPhone } from "@/domain";

export type DemoHubProps = {
  gym: string;
  checkin: { path: string; qr: string };
  trial: { path: string; qr: string };
  members: { name: string; phone: string; path: string; why: string }[];
  staff: { role: string; name: string; phone: string }[];
}

export function DemoHub({ gym, checkin, trial, members, staff }: DemoHubProps) {
  return (
    <Center role="main" axis="horizontal">
      <VStack hAlign="center" width="100%">
        <Section width="100%" maxWidth={1000} padding={6} paddingBlock={10} variant="transparent">
          <VStack gap={8}>
            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <Badge label="Demo" variant="warning" />
                <Text color="secondary">{gym} is a fictional gym in Indore with sample members.</Text>
              </HStack>
              <Heading level={1}>Try RepVault</Heading>
              <Text color="secondary">
                Open the QR pages on your phone (or scan the codes), then sign in as staff to watch check-ins and leads arrive
                live. WhatsApp messages land in the simulated outbox under Messages; UPI payments are simulated.
              </Text>
            </VStack>

            <Grid columns={{ minWidth: 280, repeat: "fit" }} gap={4}>
              {[
                { title: "1. Entrance QR: member check-in", body: "Try a member phone from the table below, or one that is not a member.", ...checkin },
                { title: "2. Walk-in QR: free trial pass", body: "Enter any 10-digit mobile number. Consents start unticked.", ...trial },
              ].map((q) => (
                <Card key={q.title}>
                  <VStack gap={3} hAlign="center">
                    <Heading level={3}>{q.title}</Heading>
                    <Image src={q.qr} alt={`QR code for ${q.title}`} width={180} height={180} unoptimized />
                    <Text type="supporting" color="secondary" justify="center">
                      {q.body}
                    </Text>
                    <Button label="Open on this device" variant="primary" href={q.path} />
                  </VStack>
                </Card>
              ))}
            </Grid>

            <VStack gap={3}>
              <Heading level={2}>3. Member pages (from WhatsApp links)</Heading>
              <Text color="secondary">Each member gets a private link to renew by UPI, book PT and manage consent.</Text>
              <Table
                data={members}
                idKey="path"
                columns={[
                  { key: "why", header: "Case" },
                  { key: "name", header: "Member" },
                  { key: "phone", header: "Phone (use at check-in)", renderCell: (m) => formatPhone(m.phone) },
                  { key: "path", header: "", renderCell: (m) => <Button label={`Open ${m.name.split(" ")[0]}'s page`} size="sm" href={m.path} /> },
                ]}
              />
            </VStack>

            <VStack gap={3}>
              <Heading level={2}>4. Staff sign-in</Heading>
              <Banner status="info" title="Demo OTP" description="Sign in with a phone below. The one-time code is shown on screen in demo mode instead of being sent by SMS." />
              <Table
                data={staff}
                idKey="phone"
                columns={[
                  { key: "role", header: "Role" },
                  { key: "name", header: "Name" },
                  { key: "phone", header: "Phone", renderCell: (s) => formatPhone(s.phone) },
                ]}
              />
              <HStack gap={3}>
                <Button label="Go to staff sign-in" variant="primary" href="/login" />
                <Button label="Back to home" variant="ghost" href="/" />
              </HStack>
            </VStack>
          </VStack>
        </Section>
      </VStack>
    </Center>
  );
}
