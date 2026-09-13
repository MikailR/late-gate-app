"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLatestRef } from "@/hooks/useLatestRef";
import { DEMO_LATE_MINUTES, DEMO_LIVE_START_MINUTES, DEMO_LIVE_STEP_MINUTES, DEMO_LIVE_TICK_MS } from "@/lib/config/constants";

const SETTLE_AFTER_MS = 900;
const SKIP_SETTLE_MS = 500;

type LiveTrackerOptions = {
  estMinutesLate: number;
  onTick: (estMinutesLate: number) => void;
  onSettle: (estMinutesLate: number) => void;
  targetMinutesLate?: number;
};

/**
 * Demo tracker: the estimate climbs a few minutes per tick until it reaches
 * the target, then the worker is asked to settle.
 * TODO(rails): replace the interval with polling a policy status endpoint.
 */
export function useLiveTracker({ estMinutesLate, onTick, onSettle, targetMinutesLate = DEMO_LATE_MINUTES }: LiveTrackerOptions) {
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const estRef = useLatestRef(estMinutesLate);
  const settledRef = useRef(false);

  const stop = useCallback(() => {
    if (interval.current) clearInterval(interval.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    interval.current = null;
    settleTimer.current = null;
  }, []);

  const settle = useCallback(
    (afterMs: number) => {
      if (settledRef.current) return;
      settledRef.current = true;
      settleTimer.current = setTimeout(() => onSettle(targetMinutesLate), afterMs);
    },
    [onSettle, targetMinutesLate],
  );

  useEffect(() => {
    onTick(DEMO_LIVE_START_MINUTES);
    interval.current = setInterval(() => {
      const next = Math.min(estRef.current + DEMO_LIVE_STEP_MINUTES, targetMinutesLate);
      onTick(next);
      if (next >= targetMinutesLate) {
        if (interval.current) clearInterval(interval.current);
        interval.current = null;
        settle(SETTLE_AFTER_MS);
      }
    }, DEMO_LIVE_TICK_MS);
    return stop;
    // Runs once per mount: the screen is keyed, so re-opening a stub restarts it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skipAhead = useCallback(() => {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
    onTick(targetMinutesLate);
    settle(SKIP_SETTLE_MS);
  }, [onTick, settle, targetMinutesLate]);

  return { skipAhead, targetMinutesLate };
}
