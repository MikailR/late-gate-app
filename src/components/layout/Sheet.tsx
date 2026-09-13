"use client";

import { useEffect, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  children: ReactNode;
};

/**
 * Bottom sheet. Fixed to the viewport, capped at the app column width so it
 * lines up with the header on wide screens. Escape and backdrop tap close it.
 */
export function Sheet({ open, onClose, label, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="absolute bottom-0 flex w-full max-w-[var(--app-max-w)] flex-col gap-3.5 rounded-t-2xl border-t border-rule bg-paper px-6 pt-4 pb-[calc(32px+env(safe-area-inset-bottom))] animate-sheet-up"
      >
        <div className="h-1 w-9 self-center rounded-sm bg-rule" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
