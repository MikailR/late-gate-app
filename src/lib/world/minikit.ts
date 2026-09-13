"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { hasWorldAppId, railsEnv } from "@/lib/rails/env";

/**
 * Thin runtime layer over MiniKit so the rest of the app never imports the
 * SDK directly. `MiniKitProvider` calls `MiniKit.install` on mount; these
 * helpers read the resulting state at call time.
 */

/** Inside World App with the bridge ready and an app id configured. */
export function isWorldAppLive(): boolean {
  if (typeof window === "undefined" || !hasWorldAppId()) return false;
  try {
    // isInstalled() warns to the console outside World App; skip it when the webview is not World App.
    return MiniKit.isInWorldApp() && MiniKit.isInstalled();
  } catch {
    return false;
  }
}

/** World App webview, regardless of whether MiniKit finished installing. */
export function isInsideWorldApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return MiniKit.isInWorldApp();
  } catch {
    return false;
  }
}

export function worldAppId(): `app_${string}` | null {
  return hasWorldAppId() ? (railsEnv.worldAppId as `app_${string}`) : null;
}

export { MiniKit };
