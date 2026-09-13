"use client";

import Image from "next/image";
import { BackLink } from "@/components/ui/BackLink";
import { Screen, ScreenTitle } from "@/components/ui/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AIRLINE_GROUPS, AIRLINES } from "@/lib/data/airlines";
import type { Airline } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";
import { useApp } from "@/state/AppProvider";

function AirlineTile({ airline, selected, onPick }: { airline: Airline; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "relative flex min-h-[118px] flex-col items-center justify-center gap-3 rounded-[14px] border bg-paper px-3.5 pt-6 pb-[18px]",
        "shadow-[0_1px_2px_rgba(26,26,26,0.04),0_4px_14px_rgba(26,26,26,0.05)] transition-[transform,box-shadow,border-color,background] duration-150",
        "active:scale-[0.98] active:bg-cream",
        selected ? "border-gate bg-wash shadow-[0_0_0_1px_var(--color-gate),0_4px_14px_rgba(31,79,191,0.12)]" : "border-line",
      )}
    >
      <span
        className={cn(
          "absolute top-2.5 right-2.5 rounded px-1.5 py-[3px] font-mono text-[10px] font-bold leading-none tracking-[0.1em]",
          selected ? "bg-gate text-white" : "bg-cream text-muted",
        )}
      >
        {airline.code}
      </span>
      <Image src={airline.logo} alt="" width={56} height={40} className="h-10 w-14 object-contain" unoptimized />
      <span className="text-center text-sm font-semibold leading-[1.2] tracking-[-0.01em]">{airline.name}</span>
    </button>
  );
}

/** Step 1. Real carriers on polished tiles, grouped U.S. and international. */
export function AirlineScreen() {
  const { state, actions } = useApp();

  return (
    <Screen label="Pick airline" gap="lg">
      <BackLink onClick={() => actions.navigate("stubs")}>MY STUBS</BackLink>
      <ScreenTitle step="STEP 1">Which airline?</ScreenTitle>
      {AIRLINE_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-3">
          <SectionLabel>{group.label}</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {group.codes.map((code) => (
              <AirlineTile
                key={code}
                airline={AIRLINES[code]}
                selected={state.flight.airline === code}
                onPick={() => actions.dispatch({ type: "PICK_AIRLINE", airline: code })}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="pb-[calc(28px+env(safe-area-inset-bottom))]" />
    </Screen>
  );
}
