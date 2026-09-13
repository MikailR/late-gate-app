import { DEMO_WALLET_ADDRESS, DEMO_WALLET_USDC } from "@/lib/config/constants";
import { usdToCents } from "@/lib/domain/pricing";
import type { Hex } from "@/lib/domain/types";
import { activeNetwork } from "../chain";
import { randomHex, sleep } from "../mock/fakeHex";
import type { UsdcTransferReceipt, UsdcTransferRequest, WalletAccount, WalletAdapter } from "./types";

const CONNECT_MS = 650;
const TRANSFER_MS = 500;

/**
 * Demo wallet with a small USDC balance on World Chain Sepolia.
 * Balance bookkeeping during the demo lives in the UI store; this adapter
 * only reports the opening balance and fabricates tx hashes.
 */
export class MockWalletAdapter implements WalletAdapter {
  private account: WalletAccount | null = null;

  async connect(): Promise<WalletAccount> {
    await sleep(CONNECT_MS);
    this.account = { address: DEMO_WALLET_ADDRESS as Hex, chainId: activeNetwork().chainId };
    return this.account;
  }

  async disconnect(): Promise<void> {
    this.account = null;
  }

  async getUsdcBalanceCents(): Promise<number> {
    return usdToCents(DEMO_WALLET_USDC);
  }

  async transferUsdc(request: UsdcTransferRequest): Promise<UsdcTransferReceipt> {
    await sleep(TRANSFER_MS);
    if (request.amountCents <= 0) throw new Error("Transfer amount must be positive.");
    return { txHash: randomHex(), chainId: activeNetwork().chainId };
  }
}
