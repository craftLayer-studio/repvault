import { getDb } from "@/server/db/client";
import { resetDb, seedDemo } from "@/server/db/seed";
import { assertSameOrigin, handle } from "@/server/http";
import { clearSessionCookie, requireStaff } from "@/server/session";
import { StoreError } from "@/server/store/errors";
import { orgById } from "@/server/store/org";

/** Wipe and reseed the demo gym. Only for the demo org's owner. */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const s = await requireStaff(["owner"]);
    const db = await getDb();
    if (!(await orgById(db, s.orgId)).isDemo) throw new StoreError(403, "Only the demo gym can be reset");
    await resetDb(db);
    await seedDemo(db);
    await clearSessionCookie();
    return { ok: true };
  });
}
