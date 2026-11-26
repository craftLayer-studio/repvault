"use client";

// Scaffolded from the Astryx `shell-top-nav` template; frame kept, content replaced.
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@astryxdesign/core/AppShell";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Icon } from "@astryxdesign/core/Icon";
import { BoltIcon } from "@heroicons/react/24/solid";
import { post } from "@/lib/client";

export type Role = "owner" | "desk" | "trainer";

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/owner", label: "Dashboard", roles: ["owner"] },
  { href: "/desk", label: "Front desk", roles: ["owner", "desk"] },
  { href: "/pt", label: "PT sessions", roles: ["owner", "desk", "trainer"] },
  { href: "/owner/messages", label: "Messages", roles: ["owner"] },
  { href: "/owner/settings", label: "Settings", roles: ["owner"] },
];

const ROLE_LABEL: Record<Role, string> = { owner: "Owner", desk: "Front desk", trainer: "Trainer" };

export function StaffShell({
  active,
  staff,
  gym,
  isDemo,
  children,
}: {
  active: string;
  staff: { name: string; role: Role };
  gym: string;
  isDemo: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <AppShell
      contentPadding={6}
      variant="surface"
      height="auto"
      topNav={
        <TopNav
          label="RepVault staff"
          heading={
            <TopNavHeading
              logo={<Icon icon={BoltIcon} size="md" color="accent" />}
              heading="RepVault"
              subheading={gym}
              headingHref={NAV.find((n) => n.roles.includes(staff.role))?.href ?? "/"}
              headerEndContent={isDemo ? <Badge label="Demo" variant="warning" /> : undefined}
            />
          }
          startContent={
            <>
              {NAV.filter((n) => n.roles.includes(staff.role)).map((n) => (
                <TopNavItem key={n.href} label={n.label} href={n.href} isSelected={active === n.href} />
              ))}
            </>
          }
          endContent={
            <HStack gap={3} vAlign="center">
              <VStack gap={0}>
                <Text type="label">{staff.name}</Text>
                <Text type="supporting" color="secondary">
                  {ROLE_LABEL[staff.role]}
                </Text>
              </VStack>
              <Button
                label="Sign out"
                variant="ghost"
                size="sm"
                clickAction={async () => {
                  await post("/api/auth/logout");
                  router.push("/login");
                  router.refresh();
                }}
              />
            </HStack>
          }
        />
      }>
      <Center axis="horizontal">
        <VStack gap={6} width="100%" maxWidth={1280}>
          {children}
        </VStack>
      </Center>
    </AppShell>
  );
}
