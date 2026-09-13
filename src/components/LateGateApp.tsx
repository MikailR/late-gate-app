"use client";

import { useDemoEntry } from "@/hooks/useDemoEntry";
import { AppProvider, useApp } from "@/state/AppProvider";
import { AppShell } from "./layout/AppShell";
import { WorldMiniKitProvider } from "./providers/WorldMiniKitProvider";
import { ScreenRouter } from "./screens/ScreenRouter";

function LateGateAppInner() {
  const { actions } = useApp();
  useDemoEntry({ onDemo: actions.startDemo, onExpiredPreview: actions.previewExpired });
  return (
    <AppShell>
      <ScreenRouter />
    </AppShell>
  );
}

/**
 * Client root. MiniKit installs first so `MiniKit.isInstalled()` is answered
 * inside World App; all demo state lives in AppProvider; screens switch in place.
 */
export function LateGateApp() {
  return (
    <WorldMiniKitProvider>
      <AppProvider>
        <LateGateAppInner />
      </AppProvider>
    </WorldMiniKitProvider>
  );
}
