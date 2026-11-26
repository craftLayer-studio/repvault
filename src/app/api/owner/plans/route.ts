import { getDb } from "@/server/db/client";
import { assertSameOrigin, bool, handle, int, optStr, readBody, str } from "@/server/http";
import { requireStaff } from "@/server/session";
import { savePlan } from "@/server/store/memberships";

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner"]);
    const body = await readBody(request);
    return savePlan(await getDb(), s.orgId, {
      id: optStr(body, "id", 64),
      name: str(body, "name", 40).trim(),
      durationDays: int(body, "durationDays", 1, 730),
      pricePaise: int(body, "pricePaise", 100, 10_000_000),
      gstBp: int(body, "gstBp", 0, 1800),
      active: body.active === undefined ? true : bool(body, "active"),
    });
  });
}
