import { getDb } from "@/server/db/client";
import { assertSameOrigin, BadRequest, bool, handle, int, oneOf, optStr, personName, phone, readBody, str } from "@/server/http";
import { requireStaff } from "@/server/session";
import { sellMembership } from "@/server/store/memberships";

/** Sell a plan to a lead/member, or register a new member at the desk. Price comes from the plan. */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner", "desk"]);
    const body = await readBody(request);
    const customerId = optStr(body, "customerId", 64);
    let newCustomer;
    if (!customerId) {
      if (typeof body.newCustomer !== "object" || body.newCustomer === null) throw new BadRequest("Pick a member or enter a new one");
      const n = body.newCustomer as Record<string, unknown>;
      newCustomer = { name: personName(n), phone: phone(n), consentService: bool(n, "consentService"), consentMarketing: bool(n, "consentMarketing") };
    }
    return sellMembership(await getDb(), {
      orgId: s.orgId,
      staffId: s.staffId,
      customerId,
      newCustomer,
      planId: str(body, "planId", 64),
      paidPaise: int(body, "paidPaise", 0, 100_000_000),
      mode: oneOf(body, "mode", ["upi", "cash", "card"] as const),
    });
  });
}
