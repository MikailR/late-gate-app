"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { useLatestRef } from "@/hooks/useLatestRef";
import { DEMO_LATE_MINUTES } from "@/lib/config/constants";
import { centsToUsd, usdToCents } from "@/lib/domain/pricing";
import type { Hex } from "@/lib/domain/types";
import { getRails, railsEnv, vaultAddress, WalletAdapterError, WorldProofError, WorldSandboxUnavailableError } from "@/lib/rails";
import type { AppAction } from "./actions";
import { createInitialState } from "./initialState";
import { checkPoolAmount, poolMoveCapUsd } from "./poolMath";
import { appReducer } from "./reducer";
import { buildCurrentStub, selectFlightKey, selectPremiumUsd, selectWalletConnected } from "./selectors";
import type { AppState, PoolMoveKind, Screen, VerifyPath } from "./types";

/** How long the Verified check stays on screen before Pay. */
const VERIFIED_LINGER_MS = 900;

/** Traveler-facing message for a failed wallet command; generic for anything unexpected. */
function walletErrorCopy(error: unknown, fallback: string): string {
  return error instanceof WalletAdapterError ? error.message : fallback;
}

export type AppActions = {
  navigate: (screen: Screen) => void;
  restart: () => void;
  startDemo: () => void;
  previewExpired: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  verifyWithWorld: (path: VerifyPath) => Promise<void>;
  pay: () => Promise<void>;
  followStub: () => void;
  saveStub: () => void;
  settleCurrentStub: (estMinutesLate: number) => Promise<void>;
  refreshPool: () => Promise<void>;
  setPoolMax: (kind: PoolMoveKind) => void;
  submitPoolMove: (kind: PoolMoveKind) => Promise<void>;
  dispatch: (action: AppAction) => void;
};

type AppContextValue = { state: AppState; actions: AppActions };

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => createInitialState());
  // Async flows read the freshest state without re-creating callbacks on every render.
  const stateRef = useLatestRef(state);
  const rails = useMemo(() => getRails(), []);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const connectWallet = useCallback(async () => {
    const { wallet } = stateRef.current;
    if (wallet.status !== "disconnected") return;
    dispatch({ type: "WALLET_CONNECTING" });
    try {
      const account = await rails.wallet.connect();
      // A failed balance read must not undo a successful sign-in; show zero and let the sheet explain.
      let balanceCents = 0;
      try {
        balanceCents = await rails.wallet.getUsdcBalanceCents(account.address);
      } catch (error) {
        console.error("[late-gate] balance read failed", error);
      }
      dispatch({ type: "WALLET_CONNECTED", address: account.address, usdcBalance: centsToUsd(balanceCents), live: rails.isLive() });
    } catch (error) {
      console.error("[late-gate] wallet connect failed", error);
      dispatch({ type: "WALLET_FAILED", error: walletErrorCopy(error, "Wallet did not connect. Try again.") });
    }
  }, [rails, stateRef]);

  const disconnectWallet = useCallback(async () => {
    try {
      await rails.wallet.disconnect();
    } finally {
      dispatch({ type: "WALLET_DISCONNECTED" });
    }
  }, [rails]);

  /**
   * Sandbox path: run IDKit, forward the proof unchanged, wait for a worldSession.
   * orbLegacy path: stub nullifier, same endpoint. Only a returned session flips
   * the UI to verified; a proof alone never does.
   *
   * If Sandbox cannot start at all (no server-signed rp_context yet), the
   * request drops to the stub path and the receipt says so (`orbLegacy · stub`).
   */
  const verifyWithWorld = useCallback(
    async (path: VerifyPath) => {
      const current = stateRef.current;
      if (current.verify.status === "pending" || current.verify.status === "verified") return;
      const flightKey = selectFlightKey(current);
      dispatch({ type: "VERIFY_PENDING", path });
      try {
        let request: { flightKey: string; idkitResponse?: Awaited<ReturnType<typeof rails.worldId.requestProof>>; stubNullifier?: string };
        if (path === "sandbox") {
          try {
            request = { flightKey, idkitResponse: await rails.worldId.requestProof({ action: railsEnv.worldAction, signal: flightKey }) };
          } catch (error) {
            if (!(error instanceof WorldSandboxUnavailableError)) throw error;
            console.warn("[late-gate] sandbox unavailable, using orbLegacy stub path:", error.reason, error.message);
            dispatch({ type: "VERIFY_PENDING", path: "orbLegacy" });
            request = { flightKey, stubNullifier: `stub:${flightKey}` };
          }
        } else {
          request = { flightKey, stubNullifier: `stub:${flightKey}` };
        }
        const result = await rails.api.verifyWorld(request);
        if (!result.ok) {
          dispatch({ type: "VERIFY_FAILED", error: result.reason });
          return;
        }
        dispatch({ type: "VERIFY_SUCCESS", session: result });
        later(() => {
          if (stateRef.current.screen === "verify" && stateRef.current.verify.status === "verified") {
            dispatch({ type: "NAVIGATE", screen: "pay" });
          }
        }, VERIFIED_LINGER_MS);
      } catch (error) {
        console.error("[late-gate] world verify failed", error);
        const message = error instanceof WorldProofError ? error.message : "Sandbox could not issue a proof. Try again or use the orbLegacy stub path.";
        dispatch({ type: "VERIFY_FAILED", error: message });
      }
    },
    [rails, later, stateRef],
  );

  /** Wallet transfer first, then POST /api/tickets with the tx hash and world session. */
  const pay = useCallback(async () => {
    const current = stateRef.current;
    if (current.payment.status === "pending") return;
    if (!selectWalletConnected(current)) {
      await connectWallet();
      return;
    }
    const session = current.verify.session;
    if (!session) {
      dispatch({ type: "NAVIGATE", screen: "verify" });
      return;
    }
    const from = current.wallet.address as Hex;
    const amountCents = usdToCents(selectPremiumUsd(current));
    dispatch({ type: "PAY_PENDING" });
    try {
      const transfer = await rails.wallet.transferUsdc({ from, to: vaultAddress(), amountCents });
      const issued = await rails.api.issueTicket({
        flightKey: session.flightKey,
        worldSession: session.worldSession,
        product: current.product,
        minutesLate: current.minutesLate,
        travelerAddress: from,
        usdcTxHash: transfer.txHash,
      });
      if (!issued.ok) {
        dispatch({ type: "PAY_FAILED", error: issued.reason });
        return;
      }
      dispatch({ type: "STUB_ISSUED", stub: buildCurrentStub(current, issued.ticketNumber) });
    } catch (error) {
      console.error("[late-gate] pay failed", error);
      dispatch({ type: "PAY_FAILED", error: walletErrorCopy(error, "Payment did not go through. Nothing was charged.") });
    }
  }, [rails, connectWallet, stateRef]);

  const followStub = useCallback(() => {
    dispatch({ type: "SAVE_STUB" });
    const stub = stateRef.current.currentStub;
    if (stub) dispatch({ type: "OPEN_STUB", id: stub.id });
  }, [stateRef]);

  const saveStub = useCallback(() => {
    dispatch({ type: "SAVE_STUB" });
    dispatch({ type: "NAVIGATE", screen: "stubs" });
  }, []);

  /** The tracker reached its end: ask the worker how the stub settled. */
  const settleCurrentStub = useCallback(
    async (estMinutesLate: number) => {
      const stub = stateRef.current.currentStub;
      if (!stub) return;
      try {
        const tick = await rails.api.workerTick({ now: new Date().toISOString() });
        const settled = tick.settled.find((row) => row.ticketNumber === stub.ticketNumber);
        if (settled?.outcome === "EXPIRED") {
          dispatch({ type: "SETTLE_EXPIRED" });
          return;
        }
        dispatch({ type: "SETTLE_PAID", lateByMinutes: settled?.observedDelayMinutes ?? estMinutesLate ?? DEMO_LATE_MINUTES });
      } catch (error) {
        console.error("[late-gate] worker tick failed", error);
        dispatch({ type: "SETTLE_PAID", lateByMinutes: estMinutesLate });
      }
    },
    [rails, stateRef],
  );

  /** Pool-wide numbers (TVL, open stubs) come from the rails; the caller's position stays in the store during the demo. */
  const refreshPool = useCallback(async () => {
    try {
      const snapshot = await rails.api.getPool(stateRef.current.wallet.address ?? undefined);
      dispatch({ type: "POOL_SNAPSHOT", tvlUsd: centsToUsd(snapshot.tvlCents), openStubs: snapshot.openStubs });
    } catch (error) {
      console.error("[late-gate] pool snapshot failed", error);
    }
  }, [rails, stateRef]);

  const setPoolMax = useCallback((kind: PoolMoveKind) => {
    const { pool, wallet } = stateRef.current;
    const cap = poolMoveCapUsd(kind, pool, wallet);
    dispatch({ type: "POOL_SET_AMOUNT", amountInput: cap > 0 ? cap.toFixed(2) : "" });
  }, [stateRef]);

  const submitPoolMove = useCallback(
    async (kind: PoolMoveKind) => {
      const current = stateRef.current;
      if (current.pool.busy || !selectWalletConnected(current)) return;
      const check = checkPoolAmount(kind, current.pool.amountInput, current.pool, current.wallet);
      if (!check.ok) return;
      const address = current.wallet.address as Hex;
      const amountCents = usdToCents(check.amountUsd);
      dispatch({ type: "POOL_PENDING" });
      try {
        let txHash: Hex | null = null;
        const result =
          kind === "deposit"
            ? await (async () => {
                const transfer = await rails.wallet.transferUsdc({ from: address, to: vaultAddress(), amountCents });
                txHash = transfer.txHash;
                return rails.api.lpDeposit({ from: address, amountCents, role: "lp", txHash });
              })()
            : await rails.api.lpWithdraw({ to: address, amountCents, role: "lp" });
        if (!result.ok) {
          dispatch({ type: "POOL_FAILED", error: result.reason });
          return;
        }
        dispatch({ type: "POOL_MOVED", kind, amountUsd: check.amountUsd, txHash: result.txHash ?? txHash });
      } catch (error) {
        console.error("[late-gate] pool move failed", error);
        dispatch({ type: "POOL_FAILED", error: walletErrorCopy(error, "The transfer did not go through. Nothing moved.") });
      }
    },
    [rails, stateRef],
  );

  const actions = useMemo<AppActions>(
    () => ({
      navigate: (screen) => dispatch({ type: "NAVIGATE", screen }),
      restart: () => dispatch({ type: "RESTART", demo: false }),
      startDemo: () => dispatch({ type: "START_DEMO" }),
      previewExpired: () => dispatch({ type: "PREVIEW_EXPIRED" }),
      connectWallet,
      disconnectWallet,
      verifyWithWorld,
      pay,
      followStub,
      saveStub,
      settleCurrentStub,
      refreshPool,
      setPoolMax,
      submitPoolMove,
      dispatch,
    }),
    [connectWallet, disconnectWallet, verifyWithWorld, pay, followStub, saveStub, settleCurrentStub, refreshPool, setPoolMax, submitPoolMove],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside <AppProvider>.");
  return context;
}
