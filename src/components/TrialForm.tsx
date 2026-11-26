"use client";

// Scaffolded from the Astryx `contact-form` template (lead capture); frame kept, content replaced.
import { useState } from "react";
import { VStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { CONSENT_TEXT, formatDateIST, GOALS, NOTICE_VERSION } from "@/domain";
import { post } from "@/lib/client";
import { PublicFrame } from "./PublicFrame";

interface Pass {
  gym: string;
  name: string;
  code: string;
  validUntil: number;
  whatsapp: "sent" | "skipped" | "duplicate";
  memberPath: string;
  existing: boolean;
}

export function TrialForm(props: { gym: string; city: string; isDemo: boolean; token: string; checkinPath: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState<string | null>(null);
  const [consentService, setConsentService] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pass, setPass] = useState<Pass | null>(null);

  async function submit() {
    setError(null);
    try {
      setPass(await post<Pass>("/api/public/trial", { token: props.token, name, phone, goal: goal ?? undefined, consentService, consentMarketing }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (pass) {
    return (
      <PublicFrame gym={props.gym} isDemo={props.isDemo}>
        <Banner status="success" title={pass.existing ? "Here is your trial pass again" : `You're in, ${pass.name.split(" ")[0]}!`} />
        <Card>
          <VStack gap={2} hAlign="center">
            <Text type="supporting" color="secondary">Free trial pass</Text>
            <Heading level={1} type="display-2">{pass.code}</Heading>
            <Text>Valid today, {formatDateIST(pass.validUntil - 1)}</Text>
          </VStack>
        </Card>
        <Text color="secondary">
          {pass.whatsapp === "sent"
            ? "We have also sent this pass to your WhatsApp (simulated in the demo)."
            : pass.whatsapp === "skipped"
              ? "You did not opt in to WhatsApp updates, so keep this screen open or take a screenshot."
              : "Show this code at the desk."}
        </Text>
        <Button label="Check in with this pass" variant="primary" size="lg" href={props.checkinPath} />
        <Button label="See plans and prices" variant="secondary" href={pass.memberPath} />
      </PublicFrame>
    );
  }

  return (
    <PublicFrame gym={props.gym} isDemo={props.isDemo}>
      <VStack gap={2}>
        <Heading level={1}>Free 1-day trial</Heading>
        <Text color="secondary">Train today at {props.gym}, {props.city}. No payment, no sales pitch at the door.</Text>
      </VStack>
      {error && <Banner status="error" title={error} />}
      <VStack gap={4}>
        <TextInput label="Your name" autoComplete="name" value={name} onChange={setName} isRequired size="lg" />
        <TextInput label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={phone} onChange={setPhone} isRequired size="lg" />
        <Selector label="Your goal" options={[...GOALS]} value={goal ?? undefined} onChange={setGoal} isOptional placeholder="Pick one" />
        <VStack gap={3}>
          <Text type="label">WhatsApp updates (optional, untick any time)</Text>
          <CheckboxInput label={CONSENT_TEXT.service} value={consentService} onChange={setConsentService} />
          <CheckboxInput label={CONSENT_TEXT.marketing} value={consentMarketing} onChange={setConsentMarketing} />
        </VStack>
        <Collapsible trigger="Privacy notice (DPDP Act 2023)" defaultIsOpen={false}>
          <Text type="supporting" color="secondary">
            {props.gym} collects your name, mobile number and goal to issue your trial pass and record your visit. WhatsApp
            messages are sent only for the purposes you tick above, and you can withdraw consent at any time from the link
            in any message or by asking the desk. Your data is not sold. To see or delete your data, ask the gym or write to
            repvault@craftlayer.store. Notice version {NOTICE_VERSION}.
          </Text>
        </Collapsible>
        <Button label="Get my trial pass" variant="primary" size="lg" width="100%" clickAction={submit} />
      </VStack>
    </PublicFrame>
  );
}
