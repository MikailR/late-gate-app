"use client";

import { Tokens } from "@worldcoin/minikit-js/commands";
import type { Hex } from "@/lib/domain/types";
import { isWorldAppLive, MiniKit } from "@/lib/world/minikit";
import { DEMO_VAULT_PLACEHOLDER, networkFor, USDC_DECIMALS, WORLDCHAIN_MAINNET_CHAIN_ID, type WorldchainNetwork } from "../chain";
import { railsEnv } from "../env";
import { randomHex } from "../mock/fakeHex";
import { WalletAdapterError } from "../world/errors";
import type { UsdcTransferReceipt, UsdcTransferRequest, WalletAccount, WalletAdapter } from "./types";

/** ERC-20 `balanceOf(address)` selector. */
const BALANCE_OF_SELECTOR = "0x70a08231";
const BALANCE_UNITS_PER_CENT = BigInt(10 ** (USDC_DECIMALS - 2));

/**
 * Live wallet through MiniKit inside World App.
 *
 * - connect: `MiniKit.walletAuth` (SIWE). The signed message is kept on the
 *   account for the rails to verify later; nothing is trusted client-side.
 * - balance: plain JSON-RPC `eth_call balanceOf` on the network's USDC, so no
 *   viem dependency is needed for a read.
 * - transfer: `MiniKit.pay` with USDC. World App settles pay on World Chain
 *   mainnet (480) with real funds, so it is gated behind
 *   NEXT_PUBLIC_WORLD_PAY_ENABLED and a configured vault address.
 *
 * Chain caveat: the product demo lock is World Chain Sepolia (4801). MiniKit
 * pay / sendTransaction only run on mainnet, so live wallet reads and pays in
 * World App use 480. Testnet USDC movement stays on the rails side.
 */
export class WorldchainWalletAdapter implements WalletAdapter {
  private account: (WalletAccount & { siweMessage?: string; siweSignature?: string }) | null = null;

  /** MiniKit commands run on mainnet; reads follow the same chain so the balance matches what pay would spend. */
  private get network(): WorldchainNetwork {
    return networkFor(WORLDCHAIN_MAINNET_CHAIN_ID);
  }

  async connect(): Promise<WalletAccount> {
    if (!isWorldAppLive()) {
      throw new WalletAdapterError("WORLD_APP_REQUIRED", "Open Late Gate inside World App to use the live wallet.");
    }
    const result = await MiniKit.walletAuth({
      nonce: randomHex(16).slice(2),
      statement: "Sign in to Late Gate. Stubs are paid and settled in USDC on World Chain.",
      expirationTime: new Date(Date.now() + 10 * 60_000),
    });
    const address = (result.data.address ?? "") as Hex;
    if (!address.startsWith("0x")) {
      throw new WalletAdapterError("COMMAND_FAILED", "World App did not return a wallet address.");
    }
    // TODO(rails): POST { message, signature, nonce } to the rails so the SIWE is verified server-side.
    this.account = {
      address,
      chainId: this.network.chainId,
      siweMessage: result.data.message,
      siweSignature: "signature" in result.data ? String(result.data.signature) : undefined,
    };
    return { address, chainId: this.network.chainId };
  }

  async disconnect(): Promise<void> {
    // MiniKit has no disconnect; forgetting the account is enough for the UI.
    this.account = null;
  }

  async getUsdcBalanceCents(address: Hex): Promise<number> {
    const { rpcUrl, usdc } = this.network;
    const data = `${BALANCE_OF_SELECTOR}${address.slice(2).toLowerCase().padStart(64, "0")}`;
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: usdc, data }, "latest"] }),
      });
      const payload = (await response.json()) as { result?: string; error?: { message?: string } };
      if (!payload.result) throw new Error(payload.error?.message ?? "empty eth_call result");
      return Number(BigInt(payload.result) / BALANCE_UNITS_PER_CENT);
    } catch (error) {
      throw new WalletAdapterError("RPC_FAILED", error instanceof Error ? error.message : "Could not read the USDC balance.");
    }
  }

  async transferUsdc(request: UsdcTransferRequest): Promise<UsdcTransferReceipt> {
    if (!isWorldAppLive()) {
      throw new WalletAdapterError("WORLD_APP_REQUIRED", "Open Late Gate inside World App to pay with the live wallet.");
    }
    if (!railsEnv.worldPayEnabled) {
      throw new WalletAdapterError(
        "PAY_DISABLED",
        "Live USDC pay is switched off for this build. World App pays real USDC on World Chain mainnet; enable NEXT_PUBLIC_WORLD_PAY_ENABLED once the vault is ready.",
      );
    }
    if (request.to === DEMO_VAULT_PLACEHOLDER) {
      throw new WalletAdapterError("VAULT_UNSET", "No vault address is configured (NEXT_PUBLIC_LP_VAULT_ADDRESS). Nothing was sent.");
    }
    if (request.amountCents <= 0) {
      throw new WalletAdapterError("COMMAND_FAILED", "Transfer amount must be positive.");
    }

    const reference = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : randomHex(16).slice(2);
    const result = await MiniKit.pay({
      reference,
      to: request.to,
      tokens: [{ symbol: Tokens.USDC, token_amount: (BigInt(request.amountCents) * BALANCE_UNITS_PER_CENT).toString() }],
      description: "Late Gate stub premium (USDC on World Chain)",
    });

    // World App returns a transaction id, not an on-chain hash. The rails resolve it through the
    // Developer Portal transactions API before treating it as `usdcTxHash`.
    const transactionId = String(result.data.transactionId ?? "");
    if (!transactionId) {
      throw new WalletAdapterError("COMMAND_FAILED", "World App did not confirm the payment.");
    }
    return { txHash: (transactionId.startsWith("0x") ? transactionId : `0x${transactionId}`) as Hex, chainId: this.network.chainId };
  }
}
