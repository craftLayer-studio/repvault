"use client";

import NextLink from "next/link";
import type { ReactNode } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { ToastViewport } from "@astryxdesign/core/Toast";
import { defaultThemeSlug, themeModes, themes } from "../astryx-themes";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Theme theme={themes[defaultThemeSlug]} mode={themeModes[defaultThemeSlug] ?? "system"}>
      <LinkProvider component={NextLink}>
        <ToastViewport position="bottomEnd" maxVisible={3}>
          {children}
        </ToastViewport>
      </LinkProvider>
    </Theme>
  );
}
