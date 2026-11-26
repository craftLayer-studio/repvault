import { getDb } from "@/server/db/client";
import { BadRequest, handle } from "@/server/http";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { customerByAccessToken } from "@/server/store/customers";
import { freeSlots } from "@/server/store/pt";
import { parseIstDateKey } from "@/domain";

export async function GET(request: Request, ctx: RouteContext<"/api/public/member/[token]/slots">) {
  return handle(async () => {
    rateLimit(`slots:${clientIp(request)}`, 60, 60_000);
    const { token } = await ctx.params;
    const url = new URL(request.url);
    const day = parseIstDateKey(url.searchParams.get("date") ?? "");
    const trainerId = url.searchParams.get("trainerId");
    if (day == null || !trainerId) throw new BadRequest("date and trainerId are required");
    const db = await getDb();
    const c = await customerByAccessToken(db, token);
    return { slots: await freeSlots(db, c.orgId, trainerId, day) };
  });
}
