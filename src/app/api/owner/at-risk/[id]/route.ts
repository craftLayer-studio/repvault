import { getDb } from "@/server/db/client";
import { assertSameOrigin, handle, oneOf, optStr, readBody } from "@/server/http";
import { requireStaff } from "@/server/session";
import { logRiskAction, nudgeAtRisk } from "@/server/store/automations";

export async function POST(request: Request, ctx: RouteContext<"/api/owner/at-risk/[id]">) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner", "desk"]);
    const { id } = await ctx.params;
    const body = await readBody(request);
    const action = oneOf(body, "action", ["nudge", "call", "dismissed"] as const);
    const db = await getDb();
    if (action === "nudge") return nudgeAtRisk(db, s.orgId, id, s.staffId);
    return logRiskAction(db, s.orgId, id, action, optStr(body, "note", 300), s.staffId);
  });
}
