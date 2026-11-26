import { getDb } from "@/server/db/client";
import { assertSameOrigin, handle } from "@/server/http";
import { requireStaff } from "@/server/session";
import { eraseCustomer } from "@/server/store/member-page";

export async function POST(request: Request, ctx: RouteContext<"/api/owner/customers/[id]/erase">) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner"]);
    const { id } = await ctx.params;
    return eraseCustomer(await getDb(), s.orgId, id);
  });
}
