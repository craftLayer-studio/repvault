import { getDb } from "@/server/db/client";
import { assertSameOrigin, handle, oneOf, readBody } from "@/server/http";
import { requireStaff } from "@/server/session";
import { moveLead } from "@/server/store/roster";

export async function POST(request: Request, ctx: RouteContext<"/api/staff/leads/[id]">) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner", "desk"]);
    const { id } = await ctx.params;
    const body = await readBody(request);
    return moveLead(await getDb(), s.orgId, id, oneOf(body, "stage", ["contacted", "visited", "lost"] as const));
  });
}
