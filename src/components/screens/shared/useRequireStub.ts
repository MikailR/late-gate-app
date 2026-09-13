"use client";

import { useEffect } from "react";
import type { OwnedStub } from "@/lib/domain/types";
import { useApp } from "@/state/AppProvider";

/**
 * Screens that print the current stub cannot render without one (for
 * example after a hard reload lands on #expired with an empty drawer).
 * Sends the traveler home instead of crashing.
 */
export function useRequireStub(): OwnedStub | null {
  const { state, actions } = useApp();
  const stub = state.currentStub;
  useEffect(() => {
    if (!stub) actions.navigate("stubs");
  }, [stub, actions]);
  return stub;
}
