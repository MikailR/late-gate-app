"use client";

import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { WALLET_NETWORK_LABEL } from "@/lib/config/constants";
import { railsEnv } from "@/lib/rails";
import { formatUsdc, formatWholeUsd, truncateAddress } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { productShort, selectFlightLabel, selectPayoutUsd, selectPremiumUsd, selectWalletConnected } from "@/state/selectors";

/** Step 2 of 2. USDC on World Chain. The button connects the wallet first if needed. */
export function PayScreen() {
  const { state, actions } = useApp();
  const { wallet, verify, payment } = state;
  const connected = selectWalletConnected(state);
  const premium = selectPremiumUsd(state);
  const payout = selectPayoutUsd(state);

  const verifyLabel = verify.session ? (verify.session.stub ? "orbLegacy · stub" : "World ID · Sandbox") : "NOT VERIFIED";

  const payLabel =
    payment.status === "pending"
      ? "Printing…"
      : connected
        ? `Pay $${premium} USDC`
        : wallet.status === "connecting"
          ? "Connecting…"
          : "Connect wallet to pay";

  return (
    <Screen label="Payment" gap="md">
      <div className="font-mono text-[13px] text-muted">STEP 2 OF 2</div>
      <PaperCard serrated print printDurationMs={600}>
        <ReceiptRow label="STUB" value={`${productShort(state.product)} · ${state.minutesLate} minutes+`} />
        <ReceiptRule />
        <ReceiptRow label="FLIGHT" value={selectFlightLabel(state)} />
        <ReceiptRow label="WALLET" value={connected && wallet.address ? truncateAddress(wallet.address) : "NOT CONNECTED"} valueClassName={connected ? undefined : "text-stamp"} />
        <ReceiptRow label="VERIFIED" value={verifyLabel} valueClassName={verify.session ? undefined : "text-stamp"} />
        <ReceiptRow label="PAY WITH" value={`USDC · ${WALLET_NETWORK_LABEL}`} />
        {!railsEnv.worldPayEnabled && <ReceiptRow label="TRANSFER" value={wallet.live ? "Demo transfer · live pay off" : "Demo wallet"} tone="muted" />}
        <ReceiptRule />
        <ReceiptRow label="TOTAL" value={`$${premium}.00 USDC`} tone="bold" />
        <ReceiptRow label="BALANCE AFTER" value={connected ? formatUsdc(wallet.usdcBalance - premium) : "···"} tone="muted" />
        <ReceiptRow label="PAYOUT IF HIT" value={`${formatWholeUsd(payout)} USDC`} tone="muted" />
      </PaperCard>
      {payment.status === "failed" && payment.error && (
        <div className="font-mono text-xs text-stamp" role="alert">
          {payment.error}
        </div>
      )}
      <ScreenFooter>
        <Button onClick={() => void actions.pay()} disabled={payment.status === "pending" || wallet.status === "connecting"}>
          {payLabel}
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
