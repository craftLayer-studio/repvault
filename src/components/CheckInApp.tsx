"use client";

import { useState } from "react";
import { VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { formatDateIST, formatINR, type MembershipStatus } from "@/domain";
import { post } from "@/lib/client";
import { PublicFrame } from "./PublicFrame";

type Result =
  | { result: "checked_in" | "already"; kind: "member"; firstName: string; status: MembershipStatus; daysToExpiry: number; planName: string; duesPaise: number; memberUrl: string }
  | { result: "checked_in" | "already"; kind: "trial"; firstName: string; trialCode: string }
  | { result: "expired"; firstName: string; planName: string | null; endAt: number | null; memberUrl: string }
  | { result: "not_found" };

const path = (url: string) => new URL(url).pathname;

export function CheckInApp(props: { gym: string; isDemo: boolean; token: string; trialPath: string; rememberedName: string | null }) {
  const [phone, setPhone] = useState("");
  const [remembered, setRemembered] = useState(props.rememberedName);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkIn(useDevice: boolean) {
    setError(null);
    try {
      setResult(await post<Result>("/api/public/checkin", useDevice ? { token: props.token, useDevice: true } : { token: props.token, phone }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (result) {
    return (
      <PublicFrame gym={props.gym} isDemo={props.isDemo}>
        <ResultView r={result} trialPath={props.trialPath} />
        <Button label="Done" variant="ghost" onClick={() => setResult(null)} />
      </PublicFrame>
    );
  }

  return (
    <PublicFrame gym={props.gym} isDemo={props.isDemo}>
      <VStack gap={2}>
        <Heading level={1}>Check in</Heading>
        <Text color="secondary">Scan, tap, train. Your visit is logged for your streak and the gym&apos;s attendance.</Text>
      </VStack>
      {error && <Banner status="error" title={error} />}
      {remembered ? (
        <VStack gap={3}>
          <Button label={`Check in as ${remembered}`} variant="primary" size="lg" width="100%" clickAction={() => checkIn(true)} />
          <Button label="Not you? Use another number" variant="ghost" onClick={() => setRemembered(null)} />
        </VStack>
      ) : (
        <VStack gap={3}>
          <TextInput label="Mobile number" description="The number you gave at the desk" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={phone} onChange={setPhone} onEnter={() => void checkIn(false)} size="lg" />
          <Button label="Check in" variant="primary" size="lg" width="100%" clickAction={() => checkIn(false)} />
          <Text type="supporting" color="secondary">
            This phone will remember you for one-tap check-in next time.
          </Text>
        </VStack>
      )}
      <Button label="New here? Get a free trial pass" variant="secondary" href={props.trialPath} />
    </PublicFrame>
  );
}

function ResultView({ r, trialPath }: { r: Result; trialPath: string }) {
  if (r.result === "not_found") {
    return (
      <VStack gap={3}>
        <Banner status="warning" title="We could not find a membership for this number" description="Check the number, ask at the desk, or claim a free trial." />
        <Button label="Get a free trial pass" variant="primary" href={trialPath} />
      </VStack>
    );
  }
  if (r.result === "expired") {
    return (
      <VStack gap={3}>
        <Banner
          status="error"
          title={`Hi ${r.firstName}, your ${r.planName ? `${r.planName} membership` : "pass"} has ended`}
          description={r.endAt ? `It ended on ${formatDateIST(r.endAt)}. Renew in a minute by UPI and you are in.` : "Ask at the desk about plans."}
        />
        <Button label="Renew now" variant="primary" size="lg" href={path(r.memberUrl)} />
      </VStack>
    );
  }
  const title = r.result === "already" ? `You're already checked in, ${r.firstName}` : `Welcome, ${r.firstName}! You're checked in.`;
  if (r.kind === "trial") {
    return <Banner status="success" title={title} description={`Free trial pass ${r.trialCode}. Enjoy your session and say hi at the desk.`} />;
  }
  return (
    <VStack gap={3}>
      <Banner status="success" title={title} />
      <Card>
        <MetadataList>
          <MetadataListItem label="Plan">{r.planName}</MetadataListItem>
          <MetadataListItem label="Valid for">{r.daysToExpiry === 0 ? "Last day today" : `${r.daysToExpiry} more days`}</MetadataListItem>
          {r.status === "frozen" && <MetadataListItem label="Status">Frozen</MetadataListItem>}
        </MetadataList>
      </Card>
      {r.daysToExpiry <= 7 && (
        <Banner status="warning" title="Your membership ends soon" description="Renew early and keep your streak. Extra days carry over." endContent={<Button label="Renew" size="sm" href={path(r.memberUrl)} />} />
      )}
      {r.duesPaise > 0 && (
        <Banner status="warning" title={`${formatINR(r.duesPaise)} pending`} description="Clear your balance by UPI." endContent={<Button label="Pay" size="sm" href={path(r.memberUrl)} />} />
      )}
    </VStack>
  );
}
