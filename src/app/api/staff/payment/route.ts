import { getDb } from "@/server/db/client";
import { assertSameOrigin, handle, int, oneOf, readBody, str } from "@/server/http";
import { requireStaff } from "@/server/session";
import { recordPayment } from "@/server/store/memberships";

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner", "desk"]);
    const body = await readBody(request);
    return recordPayment(await getDb(), {
      orgId: s.orgId,
      staffId: s.staffId,
      membershipId: str(body, "membershipId", 64),
      amountPaise: int(body, "amountPaise", 1, 100_000_000),
      mode: oneOf(body, "mode", ["upi", "cash", "card"] as const),
    });
  });
}
