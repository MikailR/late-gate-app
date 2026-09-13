"use client";

import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { useDemoCamera, type CameraStatus } from "@/hooks/useDemoCamera";
import { railsEnv } from "@/lib/rails";
import { cn } from "@/lib/utils/cn";
import { useApp } from "@/state/AppProvider";
import { productShort } from "@/state/selectors";
import type { VerifyState } from "@/state/types";

const RING_CIRCUMFERENCE = 816;

/** Deadline build: IDKit stays wired but the default path is the honest stub. */
const STUB_MODE = railsEnv.worldVerifyMode === "stub";

/** How long the frozen selfie stays before the stub verify starts. */
const CAPTURE_LINGER_MS = 650;

type ViewfinderProps = {
  verify: VerifyState;
  camera: CameraStatus;
  snapshotUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

/** 260px viewfinder: hatch when idle, live camera or frozen frame in the demo step, ring while the proof is out, check once verified. */
function Viewfinder({ verify, camera, snapshotUrl, videoRef }: ViewfinderProps) {
  const pending = verify.status === "pending";
  const verified = verify.status === "verified";
  const showCamera = camera === "live" || camera === "requesting";
  const showSnapshot = camera === "captured" && snapshotUrl;
  return (
    <div className="relative mt-7 h-[260px] w-[260px]">
      <div className="viewfinder flex h-[260px] w-[260px] items-center justify-center overflow-hidden rounded-full border border-line font-mono text-[13px] text-muted">
        <video ref={videoRef} playsInline muted autoPlay className={cn("h-full w-full -scale-x-100 object-cover", !showCamera && "hidden")} />
        {showSnapshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={snapshotUrl} alt="" className={cn("h-full w-full object-cover transition-[filter,opacity] duration-500", (pending || verified) && "opacity-60 grayscale")} />
        )}
        {!showCamera && !showSnapshot && (verify.status === "idle" || verify.status === "failed") && (STUB_MODE ? "Demo selfie · orbLegacy stub" : "World ID · Sandbox")}
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
      {camera === "live" && <div className="pointer-events-none absolute inset-4 rounded-full border-2 border-dashed border-white/70" aria-hidden="true" />}
      {verified && (
        <div className="absolute inset-0 flex items-center justify-center text-[64px] text-gate drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] animate-pop" aria-hidden="true">
          ✓
        </div>
      )}
    </div>
  );
}

type Copy = { headline: string; note: string; cta: string };

function sandboxCopy(verify: VerifyState): Copy {
  switch (verify.status) {
    case "pending":
      return {
        headline: "Checking proof.",
        note: verify.path === "orbLegacy" ? "ORBLEGACY STUB PATH · POST /api/world/verify" : "SANDBOX PROOF · IDKIT → POST /api/world/verify",
        cta: "Checking proof…",
      };
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

/** Demo selfie copy. Never claims a live Sandbox or production Selfie Check proof. */
function stubCopy(verify: VerifyState, camera: CameraStatus): Copy {
  if (verify.status === "pending") return { headline: "Checking.", note: "ORBLEGACY STUB · POST /api/world/verify", cta: "Checking…" };
  if (verify.status === "verified") return { headline: "Verified.", note: "ORBLEGACY STUB PATH · POST /api/world/verify", cta: "Verified" };
  if (verify.status === "failed") return { headline: "Could not verify.", note: verify.error?.toUpperCase() ?? "TRY AGAIN", cta: "Try again" };
  switch (camera) {
    case "requesting":
      return { headline: "Allow the camera.", note: "DEMO SELFIE · SANDBOX APP UNAVAILABLE · ORBLEGACY STUB", cta: "Waiting for camera…" };
    case "live":
      return { headline: "Look at the camera.", note: "DEMO SELFIE · PHOTO STAYS ON THIS DEVICE", cta: "Capture" };
    case "captured":
      return { headline: "Got it.", note: "DEMO SELFIE · ORBLEGACY STUB · POST /api/world/verify", cta: "Checking…" };
    case "denied":
      return { headline: "Camera is off.", note: "NO CAMERA PERMISSION · DEMO CAPTURE STILL GOES TO THE STUB VERIFY", cta: "Use demo capture" };
    case "unavailable":
      return { headline: "No camera here.", note: "DEMO CAPTURE · ORBLEGACY STUB · POST /api/world/verify", cta: "Use demo capture" };
    default:
      return { headline: "Confirm it’s you.", note: "DEMO SELFIE · SANDBOX APP NOT ENROLLED · NOT PRODUCTION SELFIE CHECK", cta: "Take a selfie (demo)" };
  }
}

/**
 * Step 1 of 2.
 * Stub mode (deadline build): demo selfie in the viewfinder, then the orbLegacy
 * stub path through POST /api/world/verify. Sandbox mode: real IDKit first.
 * Either way only a returned worldSession marks this verified.
 */
export function VerifyScreen() {
  const { state, actions } = useApp();
  const { verify } = state;
  const camera = useDemoCamera();
  const verifyStarted = useRef(false);
  const busy = verify.status === "pending" || verify.status === "verified";

  const startStubVerify = useCallback(() => {
    if (verifyStarted.current) return;
    verifyStarted.current = true;
    void actions.verifyWithWorld("orbLegacy");
  }, [actions]);

  // After the frame freezes, give it a beat and hand off to the stub verify.
  useEffect(() => {
    if (!STUB_MODE || camera.status !== "captured") return;
    const id = setTimeout(startStubVerify, CAPTURE_LINGER_MS);
    return () => clearTimeout(id);
  }, [camera.status, startStubVerify]);

  useEffect(() => {
    if (verify.status === "failed") verifyStarted.current = false;
  }, [verify.status]);

  const copy = STUB_MODE ? stubCopy(verify, camera.status) : sandboxCopy(verify);

  const onPrimary = () => {
    if (!STUB_MODE) {
      void actions.verifyWithWorld("sandbox");
      return;
    }
    if (verify.status === "failed") {
      startStubVerify();
      return;
    }
    switch (camera.status) {
      case "idle":
        void camera.start();
        return;
      case "live":
        camera.capture();
        return;
      case "denied":
      case "unavailable":
        startStubVerify();
        return;
      default:
        return;
    }
  };

  const primaryDisabled = busy || camera.status === "requesting" || (STUB_MODE && camera.status === "captured");

  return (
    <Screen label="Selfie" gap="lg" className="items-center pt-5">
      <div className="self-stretch font-mono text-[13px] text-muted">STEP 1 OF 2 · {productShort(state.product)}</div>
      <Viewfinder verify={verify} camera={camera.status} snapshotUrl={camera.snapshotUrl} videoRef={camera.videoRef} />
      <div className="flex flex-col gap-3 px-2 text-center" aria-live="polite">
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">{copy.headline}</h1>
        <div className="font-mono text-[11px] tracking-[0.14em] text-muted">PHOTO NOT STORED</div>
        <div className={cn("font-mono text-[10px] leading-[1.6] tracking-[0.08em] opacity-80", verify.status === "failed" ? "text-stamp" : "text-muted")}>{copy.note}</div>
      </div>
      <ScreenFooter className="self-stretch">
        <Button onClick={onPrimary} disabled={primaryDisabled}>
          {copy.cta}
        </Button>
        {!busy && STUB_MODE && camera.status === "live" && (
          <button type="button" onClick={startStubVerify} className="mt-3 block min-h-11 w-full text-center font-mono text-[11px] text-muted underline">
            Skip the photo, use demo capture ›
          </button>
        )}
        {!busy && !STUB_MODE && (
          <button type="button" onClick={() => void actions.verifyWithWorld("orbLegacy")} className="mt-3 block min-h-11 w-full text-center font-mono text-[11px] text-muted underline">
            Sandbox not issuing? orbLegacy stub path ›
          </button>
        )}
        {!busy && STUB_MODE && camera.status !== "live" && (
          <div className="mt-3 text-center font-mono text-[10px] leading-[1.5] tracking-[0.06em] text-faint">
            Production Selfie Check is gated by World. This is the orbLegacy stub path.
          </div>
        )}
      </ScreenFooter>
    </Screen>
  );
}
