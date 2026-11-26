import { getDb } from "@/server/db/client";
import { assertSameOrigin, handle, num, readBody, str } from "@/server/http";
import { requireStaff } from "@/server/session";
import { bookPt } from "@/server/store/pt";

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner", "desk"]);
    const body = await readBody(request);
    return bookPt(await getDb(), { orgId: s.orgId, trainerId: str(body, "trainerId", 64), customerId: str(body, "customerId", 64), startsAt: num(body, "startsAt"), via: "desk" });
  });
}
