import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "ghost" | "muted";
type ButtonSize = "lg" | "md";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Dims and disables without changing the label. */
  faded?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Foreground is set explicitly per variant (and re-asserted on hover /
 * active / disabled) so a filled gate-blue CTA is always white-on-blue.
 */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-gate text-white hover:bg-[#1B47AD] hover:text-white active:text-white disabled:text-white/90",
  ghost: "bg-transparent border border-ink text-ink hover:bg-paper",
  /** Disabled-looking but still readable, used for Not for sale. */
  muted: "bg-cream text-stamp",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  lg: "min-h-[58px] px-5 py-4 text-[17px]",
  md: "min-h-[52px] px-4 py-[15px] text-[15px]",
};

/** Full-width action button. 58px tall in `lg` so it is an easy thumb target. */
export function Button({ variant = "primary", size = "lg", faded = false, className, disabled, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || faded}
      className={cn(
        "w-full rounded-lg text-center font-medium leading-tight transition-[transform,opacity,background-color] duration-150",
        "active:scale-[0.98] disabled:active:scale-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gate",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        faded && "opacity-45",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
