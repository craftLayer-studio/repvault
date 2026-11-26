import { getDb } from "@/server/db/client";
import { BadRequest, handle, optStr, readBody, str } from "@/server/http";
import { rememberMember, rememberedMember } from "@/server/member-cookie";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { selfCheckIn } from "@/server/store/checkins";
import { normalizeIndianPhone } from "@/domain";

/** Entrance QR: check in by phone, or one tap for a remembered device. */
export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(`checkin:${clientIp(request)}`, 20, 60_000);
    const body = await readBody(request);
    const token = str(body, "token", 64);
    const raw = optStr(body, "phone", 20);
    let phone: string | undefined;
    if (raw) {
      phone = normalizeIndianPhone(raw) ?? undefined;
      if (!phone) throw new BadRequest("Enter a valid 10-digit Indian mobile number");
    }
    const accessToken = body.useDevice === true ? await rememberedMember() : undefined;
    if (!phone && !accessToken) throw new BadRequest("Enter your mobile number");
    const r = await selfCheckIn(await getDb(), { checkinToken: token, phone, accessToken });
    if (r.result === "not_found") return r;
    await rememberMember(r.accessToken);
    const { accessToken: _omit, ...rest } = r;
    void _omit;
    return rest;
  });
}
