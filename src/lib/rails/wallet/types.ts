import type { Hex } from "@/lib/domain/types";

export type WalletAccount = {
  address: Hex;
  chainId: number;
};

export type UsdcTransferRequest = {
  from: Hex;
  to: Hex;
  amountCents: number;
};

export type UsdcTransferReceipt = {
  txHash: Hex;
  chainId: number;
  /** True when no real USDC moved (demo wallet, or live pay switched off). */
  simulated?: boolean;
};

/**
 * Browser wallet surface the UI needs. USDC only, World Chain only.
 * Implementations: `MockWalletAdapter` (demo) and `WorldchainWalletAdapter` (TODO).
 */
export interface WalletAdapter {
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getUsdcBalanceCents(address: Hex): Promise<number>;
  /** Signs and broadcasts an ERC-20 transfer of USDC. Resolves once the tx hash is known. */
  transferUsdc(request: UsdcTransferRequest): Promise<UsdcTransferReceipt>;
}
