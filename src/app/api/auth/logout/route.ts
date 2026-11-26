import { handle } from "@/server/http";
import { clearSessionCookie } from "@/server/session";

export async function POST() {
  return handle(async () => {
    await clearSessionCookie();
    return { ok: true };
  });
}
