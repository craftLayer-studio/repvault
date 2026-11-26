import { redirect } from "next/navigation";
import { currentStaff } from "./session";
import type { StaffSession } from "./store/auth";

export const HOME_FOR_ROLE: Record<StaffSession["role"], string> = { owner: "/owner", desk: "/desk", trainer: "/pt" };

/** For staff pages: redirect to /login when signed out, or to the role's home when not allowed. */
export async function requirePageStaff(roles: readonly StaffSession["role"][]): Promise<StaffSession> {
  const s = await currentStaff();
  if (!s) redirect("/login");
  if (!roles.includes(s.role)) redirect(HOME_FOR_ROLE[s.role]);
  return s;
}
