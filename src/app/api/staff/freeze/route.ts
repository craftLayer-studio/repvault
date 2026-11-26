import { getDb } from "@/server/db/client";
import { assertSameOrigin, handle, int, readBody, str } from "@/server/http";
import { requireStaff } from "@/server/session";
import { freezeMembership } from "@/server/store/memberships";
import { MAX_FREEZE_DAYS } from "@/domain";

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner", "desk"]);
    const body = await readBody(request);
    return freezeMembership(await getDb(), s.orgId, str(body, "membershipId", 64), int(body, "days", 1, MAX_FREEZE_DAYS));
  });
}
