import { getDb } from "@/server/db/client";
import { BadRequest, handle, optStr, readBody } from "@/server/http";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { customerByAccessToken } from "@/server/store/customers";
import { simulateMemberPayment } from "@/server/store/memberships";
import { orgById } from "@/server/store/org";

/**
 * Demo only: stands in for the payment-gateway webhook after the member pays by UPI.
 * Refused for non-demo gyms, where staff confirm UPI payments at the desk.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/public/member/[token]/pay">) {
  return handle(async () => {
    rateLimit(`pay:${clientIp(request)}`, 10, 60_000);
    const { token } = await ctx.params;
    const body = await readBody(request);
    const db = await getDb();
    const c = await customerByAccessToken(db, token);
    if (!(await orgById(db, c.orgId)).isDemo) throw new BadRequest("Payment confirmation needs a payment gateway; ask the desk to record it.");
    await simulateMemberPayment(db, token, optStr(body, "planId", 64) ?? null);
    return { ok: true };
  });
}
