import { getDb } from "@/server/db/client";
import { handle, num, readBody, str } from "@/server/http";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { memberBookPt } from "@/server/store/pt";

export async function POST(request: Request, ctx: RouteContext<"/api/public/member/[token]/pt">) {
  return handle(async () => {
    rateLimit(`pt:${clientIp(request)}`, 10, 60_000);
    const { token } = await ctx.params;
    const body = await readBody(request);
    return memberBookPt(await getDb(), token, str(body, "trainerId", 64), num(body, "startsAt"));
  });
}
