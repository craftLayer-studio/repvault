"use client";

import { useState } from "react";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Selector } from "@astryxdesign/core/Selector";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Button } from "@astryxdesign/core/Button";
import { formatINR } from "@/domain";

export type PlanOption = {
  id: string;
  name: string;
  durationDays: number;
  totalPaise: number;
}

export type PayMode = "upi" | "cash" | "card";

export function PaymentFields({ maxPaise, amount, setAmount, mode, setMode }: { maxPaise: number; amount: number; setAmount: (n: number) => void; mode: PayMode; setMode: (m: PayMode) => void }) {
  return (
    <>
      <NumberInput label="Amount received" description={`Up to ${formatINR(maxPaise)}. Less than the total leaves dues.`} units="₹" value={amount} onChange={setAmount} min={0} max={maxPaise / 100} step={100} />
      <SegmentedControl label="Payment mode" value={mode} onChange={(v) => setMode(v as PayMode)}>
        <SegmentedControlItem value="upi" label="UPI" />
        <SegmentedControlItem value="cash" label="Cash" />
        <SegmentedControlItem value="card" label="Card" />
      </SegmentedControl>
    </>
  );
}

/** Pick a plan and take payment. The server recomputes the price; the amount here is only what was received. */
export function SellPanel({
  title,
  plans,
  onSubmit,
  onCancel,
}: {
  title: string;
  plans: PlanOption[];
  onSubmit: (planId: string, paidPaise: number, mode: PayMode) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const plan = plans.find((p) => p.id === planId);
  const [amount, setAmount] = useState(plan ? plan.totalPaise / 100 : 0);
  const [mode, setMode] = useState<PayMode>("upi");
  return (
    <Card>
      <VStack gap={4}>
        <Heading level={3}>{title}</Heading>
        <Selector
          label="Plan"
          options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${p.durationDays} days · ${formatINR(p.totalPaise)} incl. GST` }))}
          value={planId}
          onChange={(v) => {
            if (!v) return;
            setPlanId(v);
            const p = plans.find((x) => x.id === v);
            if (p) setAmount(p.totalPaise / 100);
          }}
        />
        {plan && <PaymentFields maxPaise={plan.totalPaise} amount={amount} setAmount={setAmount} mode={mode} setMode={setMode} />}
        <Text type="supporting" color="secondary">Renewals start the day after the current plan ends, so the member loses no days.</Text>
        <HStack gap={2}>
          <Button label="Confirm" variant="primary" clickAction={() => onSubmit(planId, Math.round(amount * 100), mode).then(() => undefined)} />
          <Button label="Cancel" variant="ghost" onClick={onCancel} />
        </HStack>
      </VStack>
    </Card>
  );
}
