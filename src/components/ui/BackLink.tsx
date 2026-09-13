import type { ReactNode } from "react";

type BackLinkProps = {
  onClick: () => void;
  children: ReactNode;
};

/** Chevron + mono label. Negative margin keeps the 44px hit area without pushing the layout. */
export function BackLink({ onClick, children }: BackLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-2 -my-2 flex min-h-11 items-center gap-2.5 self-start px-2 py-2 text-sm text-muted active:opacity-70"
    >
      <span className="text-lg leading-none" aria-hidden="true">
        ‹
      </span>
      <span className="font-mono text-[13px]">{children}</span>
    </button>
  );
}
