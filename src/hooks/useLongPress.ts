"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Fires `onLongPress` after the pointer has been held for `delayMs`.
 * Cancels on release, leave or scroll so ordinary taps never trigger it.
 */
export function useLongPress(onLongPress: () => void, delayMs: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    cancel();
    timer.current = setTimeout(() => {
      timer.current = null;
      onLongPress();
    }, delayMs);
  }, [cancel, delayMs, onLongPress]);

  useEffect(() => cancel, [cancel]);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (event: React.SyntheticEvent) => event.preventDefault(),
  };
}
