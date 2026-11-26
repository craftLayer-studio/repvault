import { getDb } from "@/server/db/client";
import { BadRequest, handle, oneOf, readBody } from "@/server/http";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { memberSetConsent } from "@/server/store/member-page";
import { CONSENT_PURPOSES } from "@/domain";

/** Member opts in or out of a purpose from their own page. */
export async function POST(request: Request, ctx: RouteContext<"/api/public/member/[token]/consent">) {
  return handle(async () => {
    rateLimit(`consent:${clientIp(request)}`, 20, 60_000);
    const { token } = await ctx.params;
    const body = await readBody(request);
    if (typeof body.granted !== "boolean") throw new BadRequest("granted must be true or false");
    return memberSetConsent(await getDb(), token, oneOf(body, "purpose", CONSENT_PURPOSES), body.granted);
  });
}
