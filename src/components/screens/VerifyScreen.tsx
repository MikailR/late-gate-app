"use client";

import { Button } from "@/components/ui/Button";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { cn } from "@/lib/utils/cn";
import { useApp } from "@/state/AppProvider";
import { productShort } from "@/state/selectors";
import type { VerifyState } from "@/state/types";

const RING_CIRCUMFERENCE = 816;

/** 260px viewfinder. Ring draws while the proof is out; the check lands once the rails answer. */
function Viewfinder({ verify }: { verify: VerifyState }) {
  const pending = verify.status === "pending";
  const verified = verify.status === "verified";
  return (
    <div className="relative mt-7 h-[260px] w-[260px]">
      <div className="viewfinder flex h-[260px] w-[260px] items-center justify-center rounded-full border border-line font-mono text-[13px] text-muted">
        {verify.status === "idle" || verify.status === "failed" ? "World ID · Sandbox" : ""}
      </div>
      {(pending || verified) && (
        <svg viewBox="0 0 264 264" className="absolute -inset-0.5 h-[264px] w-[264px] -rotate-90" aria-hidden="true">
          <circle
            cx="132"
            cy="132"
            r="130"
            fill="none"
            stroke="var(--color-gate)"
            strokeWidth="3"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={verified ? 0 : undefined}
            className={cn(pending && "animate-ring")}
            style={pending ? { animationIterationCount: "infinite", animationDuration: "1.4s" } : undefined}
          />
        </svg>
      )}
      {verified && (
        <div className="absolute inset-0 flex items-center justify-center text-[64px] text-gate animate-pop" aria-hidden="true">
          ✓
        </div>
      )}
    </div>
  );
}

function verifyCopy(verify: VerifyState): { headline: string; note: string; cta: string } {
  switch (verify.status) {
    case "pending":
      return { headline: "Checking proof.", note: "SANDBOX PROOF · POST /api/world/verify", cta: "Checking proof…" };
    case "verified":
      return {
        headline: "Verified.",
        note: verify.path === "orbLegacy" ? "ORBLEGACY STUB PATH · POST /api/world/verify" : "SANDBOX PROOF · POST /api/world/verify",
        cta: "Verified",
      };
    case "failed":
      return { headline: "Could not verify.", note: verify.error?.toUpperCase() ?? "TRY AGAIN", cta: "Try again" };
    default:
      return { headline: "Confirm it’s you.", note: "SANDBOX LIVE · PRODUCTION SELFIE CHECK WAITS ON WORLD FLAG", cta: "Verify with World (Sandbox)" };
  }
}

/**
 * Step 1 of 2. Sandbox IDKit is the live path; the result goes to
 * POST /api/world/verify and only a returned session marks this verified.
 */
export function VerifyScreen() {
  const { state, actions } = useApp();
  const { verify } = state;
  const copy = verifyCopy(verify);
  const busy = verify.status === "pending" || verify.status === "verified";

  return (
    <Screen label="Selfie" gap="lg" className="items-center pt-5">
      <div className="self-stretch font-mono text-[13px] text-muted">STEP 1 OF 2 · {productShort(state.product)}</div>
      <Viewfinder verify={verify} />
      <div className="flex flex-col gap-3 px-2 text-center" aria-live="polite">
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">{copy.headline}</h1>
        <div className="font-mono text-[11px] tracking-[0.14em] text-muted">PHOTO NOT STORED</div>
        <div className={cn("font-mono text-[10px] leading-[1.6] tracking-[0.08em] opacity-80", verify.status === "failed" ? "text-stamp" : "text-muted")}>{copy.note}</div>
      </div>
      <ScreenFooter className="self-stretch">
        <Button onClick={() => void actions.verifyWithWorld("sandbox")} disabled={busy}>
          {copy.cta}
        </Button>
        {!busy && (
          <button
            type="button"
            onClick={() => void actions.verifyWithWorld("orbLegacy")}
            className="mt-3 block min-h-11 w-full text-center font-mono text-[11px] text-muted underline"
          >
            Sandbox not issuing? orbLegacy stub path ›
          </button>
        )}
      </ScreenFooter>
    </Screen>
  );
}
