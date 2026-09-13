"use client";

import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/Button";
import { CodeField, CodeFieldAction } from "@/components/ui/CodeField";
import { PaperCard, ReceiptHeader, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { WALLET_NETWORK_LABEL } from "@/lib/config/constants";
import { formatUsd, formatUsdc, sanitizeAmountInput, truncateAddress } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { applyPoolMove, checkPoolAmount, poolPositionUsd } from "@/state/poolMath";
import type { PoolMoveKind } from "@/state/types";

const COPY: Record<PoolMoveKind, { title: string; subtitle: string; amountLabel: string; availableLabel: string; cta: string }> = {
  deposit: { title: "Deposit", subtitle: "DEPOSIT · NOT YET SENT", amountLabel: "DEPOSIT", availableLabel: "AVAILABLE", cta: "Deposit" },
  withdraw: { title: "Withdraw", subtitle: "WITHDRAWAL · NOT YET SENT", amountLabel: "WITHDRAW", availableLabel: "IN POOL", cta: "Withdraw" },
};

/**
 * Deposit and Withdraw share one form: amount in USDC, MAX fills the cap,
 * and the quote card previews the position before anything is sent.
 */
export function PoolMoveScreen({ kind }: { kind: PoolMoveKind }) {
  const { state, actions } = useApp();
  const { pool, wallet } = state;
  const copy = COPY[kind];
  const check = checkPoolAmount(kind, pool.amountInput, pool, wallet);
  const preview = applyPoolMove(kind, check.ok ? check.amountUsd : 0, pool, wallet);
  const positionAfter = preview.depositUsd + preview.earnedUsd;
  const available = kind === "withdraw" ? poolPositionUsd(pool) : wallet.usdcBalance;
  const canSubmit = check.ok && !pool.busy;

  const ctaLabel = pool.busy ? "Sending…" : check.ok ? `${copy.cta} ${formatUsd(check.amountUsd)} USDC` : copy.cta;

  return (
    <Screen label={copy.title} gap="md">
      <BackLink onClick={() => actions.navigate("pool")}>HOUSE POOL</BackLink>
      <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">{copy.title}</h1>

      <div className="flex flex-col gap-2.5">
        <SectionLabel>AMOUNT · USDC</SectionLabel>
        <CodeField
          prefix="$"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          name="poolAmount"
          aria-label={`${copy.title} amount in USDC`}
          placeholder="0.00"
          value={pool.amountInput}
          onChange={(event) => actions.dispatch({ type: "POOL_SET_AMOUNT", amountInput: sanitizeAmountInput(event.target.value) })}
          trailing={
            <CodeFieldAction label="Use maximum" tone="gate" onClick={() => actions.setPoolMax(kind)}>
              MAX
            </CodeFieldAction>
          }
        />
        <div className="flex justify-between font-mono text-xs text-muted">
          <span>{copy.availableLabel}</span>
          <span>{formatUsdc(available)}</span>
        </div>
        {check.reason && <div className="font-mono text-xs text-stamp">{check.reason}</div>}
        {pool.error && (
          <div className="font-mono text-xs text-stamp" role="alert">
            {pool.error}
          </div>
        )}
      </div>

      <PaperCard serrated print printDurationMs={600}>
        <ReceiptHeader subtitle={copy.subtitle} />
        <ReceiptRule />
        <ReceiptRow label={copy.amountLabel} value={check.amountUsd > 0 ? formatUsdc(check.amountUsd) : "···"} tone="bold" />
        <ReceiptRow label="TO" value={kind === "deposit" ? "HOUSE POOL" : wallet.address ? truncateAddress(wallet.address) : "···"} />
        <ReceiptRow label="NETWORK" value={`USDC · ${WALLET_NETWORK_LABEL}`} />
        <ReceiptRule />
        <ReceiptRow label="IN POOL AFTER" value={formatUsdc(positionAfter)} tone="muted" />
        <ReceiptRow label="BALANCE AFTER" value={formatUsdc(preview.walletUsd)} tone="muted" />
      </PaperCard>

      <ScreenFooter>
        <Button onClick={() => void actions.submitPoolMove(kind)} disabled={!canSubmit} className={canSubmit ? undefined : "bg-cream text-faint"}>
          {ctaLabel}
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
