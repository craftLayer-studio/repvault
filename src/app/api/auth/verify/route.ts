import { getDb } from "@/server/db/client";
import { BadRequest, handle, phone, readBody, str } from "@/server/http";
import { HOME_FOR_ROLE } from "@/server/pages";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { setSessionCookie } from "@/server/session";
import { verifyOtp } from "@/server/store/auth";

export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(`verify:${clientIp(request)}`, 20, 10 * 60_000);
    const body = await readBody(request);
    const code = str(body, "code", 6);
    if (!/^\d{6}$/.test(code)) throw new BadRequest("Enter the 6-digit code");
    const s = await verifyOtp(await getDb(), phone(body), code);
    await setSessionCookie(s);
    return { role: s.role, name: s.name, next: HOME_FOR_ROLE[s.role] };
  });
}
