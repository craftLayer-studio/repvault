import { getDb } from "@/server/db/client";
import { assertSameOrigin, handle, readBody, str } from "@/server/http";
import { requireStaff } from "@/server/session";
import { deskCheckIn } from "@/server/store/checkins";

/** Front-desk tablet mode check-in. */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner", "desk"]);
    const body = await readBody(request);
    const r = await deskCheckIn(await getDb(), s.orgId, str(body, "customerId", 64));
    if ("accessToken" in r) {
      const { accessToken: _omit, ...rest } = r;
      void _omit;
      return rest;
    }
    return r;
  });
}
