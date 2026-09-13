"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Ref that always holds the latest value, updated synchronously after commit.
 * Lets long-lived callbacks (async flows, intervals) read fresh state without
 * being recreated on every render, and without writing refs during render.
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
