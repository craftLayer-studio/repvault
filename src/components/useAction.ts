"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Notice = { status: "success" | "error" | "info" | "warning"; text: string; description?: string } | null;

/** Run a mutation, show the outcome as a banner, and refresh server data. */
export function useAction() {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  async function run<T>(fn: () => Promise<T>, ok: string | ((r: T) => string)): Promise<T | undefined> {
    setNotice(null);
    try {
      const r = await fn();
      setNotice({ status: "success", text: typeof ok === "function" ? ok(r) : ok });
      router.refresh();
      return r;
    } catch (e) {
      setNotice({ status: "error", text: (e as Error).message });
      return undefined;
    }
  }
  return { notice, setNotice, run };
}
