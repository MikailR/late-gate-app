"use client";

import { useEffect } from "react";

type DemoEntryHandlers = {
  onDemo: () => void;
  onExpiredPreview: () => void;
};

/**
 * Hidden demo entry points via the URL hash, read on load and on change:
 *   #demo     lands on the flight form with UA837 SFO to NRT filled in
 *   #expired  previews the On time / Expired settlement screen
 * There is no in-app toggle; reviewers share the link with the hash.
 */
export function useDemoEntry({ onDemo, onExpiredPreview }: DemoEntryHandlers) {
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#demo") onDemo();
      else if (hash === "#expired") onExpiredPreview();
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [onDemo, onExpiredPreview]);
}
