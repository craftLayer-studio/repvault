import { getDb } from "@/server/db/client";
import { handle, phone, readBody } from "@/server/http";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { requestOtp } from "@/server/store/auth";

export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(`otp:${clientIp(request)}`, 10, 10 * 60_000);
    return requestOtp(await getDb(), phone(await readBody(request)));
  });
}
