"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { WalletSheet } from "./WalletSheet";

/**
 * Full-bleed mobile column. On a phone it is the whole viewport; on wider
 * screens it stays a single centered column up to --app-max-w, so the app
 * still reads as a phone web app rather than a stretched desktop page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mx-auto flex min-h-dvh w-full max-w-[var(--app-max-w)] flex-col bg-phone text-ink shadow-[0_0_0_1px_var(--color-rule)]"
      style={{ "--header-h": "56px", "--app-max-w": "480px" } as React.CSSProperties}
    >
      <AppHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <WalletSheet />
    </div>
  );
}
