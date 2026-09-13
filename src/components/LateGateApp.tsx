"use client";

import { useDemoEntry } from "@/hooks/useDemoEntry";
import { AppProvider, useApp } from "@/state/AppProvider";
import { AppShell } from "./layout/AppShell";
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

/** Client root. All demo state lives in AppProvider; screens are switched in place. */
export function LateGateApp() {
  return (
    <AppProvider>
      <LateGateAppInner />
    </AppProvider>
  );
}
