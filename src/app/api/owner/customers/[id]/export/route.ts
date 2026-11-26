import { getDb } from "@/server/db/client";
import { requireStaff } from "@/server/session";
import { StoreError } from "@/server/store/errors";
import { exportCustomer } from "@/server/store/member-page";

/** DPDP data export: one JSON file with everything held about the person. */
export async function GET(_request: Request, ctx: RouteContext<"/api/owner/customers/[id]/export">) {
  try {
    const s = await requireStaff(["owner"]);
    const { id } = await ctx.params;
    const data = await exportCustomer(await getDb(), s.orgId, id);
    if (!data) return Response.json({ error: "Member not found" }, { status: 404 });
    return new Response(JSON.stringify(data, null, 2), {
      headers: { "content-type": "application/json", "content-disposition": `attachment; filename="repvault-export-${id}.json"`, "cache-control": "no-store" },
    });
  } catch (err) {
    if (err instanceof StoreError) return Response.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
