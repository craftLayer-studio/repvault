"use client";

// Scaffolded from the Astryx `login-card` template; frame kept, content replaced.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Center } from "@astryxdesign/core/Center";
import { VStack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { Divider } from "@astryxdesign/core/Divider";
import { Link } from "@astryxdesign/core/Link";
import { Icon } from "@astryxdesign/core/Icon";
import { BoltIcon } from "@heroicons/react/24/solid";
import { formatPhone } from "@/domain";
import { post } from "@/lib/client";

export function LoginForm({ demoStaff }: { demoStaff: { label: string; phone: string }[] }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(p = phone) {
    setError(null);
    try {
      const r = await post<{ demoOtp?: string }>("/api/auth/otp", { phone: p });
      setDemoOtp(r.demoOtp ?? null);
      setStep("code");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function verify() {
    setError(null);
    try {
      const r = await post<{ next: string }>("/api/auth/verify", { phone, code });
      router.push(r.next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Center role="main" axis="both" padding={6}>
      <VStack gap={4} hAlign="center" width="100%" maxWidth={420}>
        <VStack gap={2} hAlign="center">
          <Icon icon={BoltIcon} size="lg" color="accent" />
          <Text type="body" weight="bold" size="lg">
            RepVault
          </Text>
        </VStack>
        <Card padding={8} width="100%">
          <VStack gap={4} hAlign="stretch">
            <VStack gap={1} hAlign="center">
              <Heading level={2} accessibilityLevel={1}>
                Staff sign in
              </Heading>
              <Text color="secondary" size="sm">
                Owner, front desk and trainers sign in with phone and a one-time code.
              </Text>
            </VStack>
            {error && <Banner status="error" title={error} />}
            {step === "phone" ? (
              <>
                <TextInput label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={phone} onChange={setPhone} onEnter={() => void sendCode()} size="lg" />
                <Button label="Send code" variant="primary" size="lg" clickAction={() => sendCode()} />
              </>
            ) : (
              <>
                {demoOtp ? (
                  <Banner status="warning" title={`Demo code: ${demoOtp}`} description="Shown on screen because this is the demo. A live gym would get it by SMS." />
                ) : (
                  <Banner status="info" title="If this number belongs to staff, a code has been sent." />
                )}
                <TextInput label="6-digit code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={setCode} onEnter={() => void verify()} size="lg" hasAutoFocus />
                <Button label="Sign in" variant="primary" size="lg" clickAction={verify} />
                <Button label="Use a different number" variant="ghost" onClick={() => { setStep("phone"); setCode(""); setDemoOtp(null); }} />
              </>
            )}
            {demoStaff.length > 0 && step === "phone" && (
              <>
                <Divider label="Demo staff" />
                <VStack gap={2} hAlign="stretch">
                  {demoStaff.map((s) => (
                    <Button
                      key={s.phone}
                      label={`${s.label} · ${formatPhone(s.phone)}`}
                      variant="secondary"
                      clickAction={async () => {
                        setPhone(s.phone);
                        await sendCode(s.phone);
                      }}
                    />
                  ))}
                </VStack>
              </>
            )}
          </VStack>
        </Card>
        <Text type="supporting" color="secondary" justify="center">
          <Link href="/" type="supporting">RepVault home</Link> · <Link href="/demo" type="supporting">Demo guide</Link>
        </Text>
      </VStack>
    </Center>
  );
}
