"use client";

// Mobile-first public page frame, from the Astryx `contact-form` template (centered Section).
import type { ReactNode } from "react";
import { Center } from "@astryxdesign/core/Center";
import { Section } from "@astryxdesign/core/Section";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Icon } from "@astryxdesign/core/Icon";
import { BoltIcon } from "@heroicons/react/24/solid";

export function PublicFrame({ gym, isDemo, children }: { gym: string; isDemo: boolean; children: ReactNode }) {
  return (
    <Center role="main" axis="horizontal">
      <VStack hAlign="center" width="100%">
        <Section width="100%" maxWidth={520} padding={4} paddingBlock={6} variant="transparent">
          <VStack gap={5}>
            <HStack gap={2} vAlign="center" hAlign="between">
              <HStack gap={2} vAlign="center">
                <Icon icon={BoltIcon} size="md" color="accent" />
                <Text type="label">{gym}</Text>
              </HStack>
              {isDemo && <Badge label="Demo" variant="warning" />}
            </HStack>
            {children}
            <Text type="supporting" color="secondary" justify="center">
              Powered by RepVault · no app needed
            </Text>
          </VStack>
        </Section>
      </VStack>
    </Center>
  );
}
