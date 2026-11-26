import { cookies } from "next/headers";
import { secureCookies } from "./config";

/** Remembers which member this phone belongs to, so the next entrance scan is one tap. */
export const MEMBER_COOKIE = "rv_member";

export async function rememberMember(accessToken: string): Promise<void> {
  (await cookies()).set(MEMBER_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: 180 * 24 * 60 * 60,
  });
}

export async function rememberedMember(): Promise<string | undefined> {
  return (await cookies()).get(MEMBER_COOKIE)?.value;
}

export async function forgetMember(): Promise<void> {
  (await cookies()).delete(MEMBER_COOKIE);
}
