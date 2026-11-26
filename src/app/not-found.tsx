import { Center } from "@astryxdesign/core/Center";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Button } from "@astryxdesign/core/Button";

export default function NotFound() {
  return (
    <Center role="main" axis="both" padding={6}>
      <EmptyState title="Page not found" description="This QR code or link is not valid. Ask the gym desk for help." actions={<Button label="RepVault home" href="/" />} />
    </Center>
  );
}
