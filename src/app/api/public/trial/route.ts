import { getDb } from "@/server/db/client";
import { bool, handle, optStr, personName, phone, readBody, str } from "@/server/http";
import { rememberMember } from "@/server/member-cookie";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { claimTrial } from "@/server/store/trials";
import { GOALS } from "@/domain";

/** Walk-in QR: claim a free trial pass. Consents arrive as two separate, default-off booleans. */
export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(`trial:${clientIp(request)}`, 6, 60_000);
    const body = await readBody(request);
    const goal = optStr(body, "goal", 40);
    const r = await claimTrial(await getDb(), {
      trialToken: str(body, "token", 64),
      name: personName(body),
      phone: phone(body),
      goal: goal && (GOALS as readonly string[]).includes(goal) ? goal : undefined,
      consentService: bool(body, "consentService"),
      consentMarketing: bool(body, "consentMarketing"),
    });
    await rememberMember(r.accessToken);
    return { gym: r.gym, name: r.name, code: r.code, validUntil: r.validUntil, whatsapp: r.whatsapp, memberPath: `/m/${r.accessToken}`, existing: r.existing };
  });
}
