import { getDb } from "@/server/db/client";
import { BadRequest, handle } from "@/server/http";
import { requireStaff } from "@/server/session";
import { freeSlots } from "@/server/store/pt";
import { parseIstDateKey } from "@/domain";

export async function GET(request: Request) {
  return handle(async () => {
    const s = await requireStaff(["owner", "desk"]);
    const url = new URL(request.url);
    const day = parseIstDateKey(url.searchParams.get("date") ?? "");
    const trainerId = url.searchParams.get("trainerId");
    if (day == null || !trainerId) throw new BadRequest("date and trainerId are required");
    return { slots: await freeSlots(await getDb(), s.orgId, trainerId, day) };
  });
}
