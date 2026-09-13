"use client";

import { MiniKitProvider, useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import type { ReactNode } from "react";
import { railsEnv } from "@/lib/rails/env";

/**
 * Installs MiniKit with the Mini App id (LateKid) so `MiniKit.isInstalled()`
 * is true inside World App. IDKit uses the separate World ID app id. In a
 * normal browser the install reports failure and the app keeps running on
 * the mock adapters.
 */
export function WorldMiniKitProvider({ children }: { children: ReactNode }) {
  return <MiniKitProvider props={{ appId: railsEnv.minikitAppId || undefined }}>{children}</MiniKitProvider>;
}

export type WorldAppStatus = {
  /** `undefined` until the install effect has run. */
  installed: boolean | undefined;
  appId: string;
};

/** MiniKit install state for UI hints (for example "open in World App for the live wallet"). */
export function useWorldAppStatus(): WorldAppStatus {
  const { isInstalled } = useMiniKit();
  return { installed: isInstalled, appId: railsEnv.minikitAppId };
}
