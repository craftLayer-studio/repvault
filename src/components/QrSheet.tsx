"use client";

import Image from "next/image";
import { Center } from "@astryxdesign/core/Center";
import { Section } from "@astryxdesign/core/Section";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";

/** Printable sheet with the two entrance QR codes. */
export function QrSheet({ gym, codes }: { gym: string; codes: { title: string; subtitle: string; qr: string; url: string }[] }) {
  return (
    <Center role="main" axis="horizontal">
      <Section width="100%" maxWidth={900} padding={6} variant="transparent">
        <VStack gap={6}>
          <HStack hAlign="between" vAlign="center">
            <Button label="Back to settings" variant="ghost" href="/owner/settings" />
            <Button label="Print" variant="primary" onClick={() => window.print()} />
          </HStack>
          <Heading level={1} justify="center">{gym}</Heading>
          <Grid columns={{ minWidth: 300, max: 2, repeat: "fit" }} gap={6}>
            {codes.map((c) => (
              <Card key={c.title}>
                <VStack gap={3} hAlign="center">
                  <Heading level={2} justify="center">{c.title}</Heading>
                  <Text color="secondary" justify="center">{c.subtitle}</Text>
                  <Image src={c.qr} alt={`QR code: ${c.title}`} width={260} height={260} unoptimized />
                  <Text type="supporting" color="secondary" justify="center">Open your phone camera and point it at the code.</Text>
                </VStack>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Section>
    </Center>
  );
}
