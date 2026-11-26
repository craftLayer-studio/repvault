import { getDb } from "@/server/db/client";
import { assertSameOrigin, handle } from "@/server/http";
import { requireStaff } from "@/server/session";
import { runDailyAutomations } from "@/server/store/automations";

/** Run today's reminders now (a daily cron would call the same use case). */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner"]);
    return runDailyAutomations(await getDb(), s.orgId);
  });
}
