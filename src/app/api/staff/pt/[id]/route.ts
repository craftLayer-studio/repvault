import { getDb } from "@/server/db/client";
import { assertSameOrigin, handle, oneOf, readBody } from "@/server/http";
import { requireStaff } from "@/server/session";
import { setPtStatus } from "@/server/store/pt";

/** Mark a PT session done / no-show / cancelled. Trainers may only change their own sessions. */
export async function POST(request: Request, ctx: RouteContext<"/api/staff/pt/[id]">) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner", "desk", "trainer"]);
    const { id } = await ctx.params;
    const body = await readBody(request);
    const status = oneOf(body, "status", ["done", "cancelled", "no_show"] as const);
    return setPtStatus(await getDb(), s.orgId, id, status, s.role === "trainer" ? s.staffId : undefined);
  });
}
