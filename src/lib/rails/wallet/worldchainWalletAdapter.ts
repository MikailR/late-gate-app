import { activeNetwork } from "../chain";
import type { UsdcTransferReceipt, WalletAccount, WalletAdapter } from "./types";

/**
 * Live World Chain wallet. Scaffold only; every method throws until wired.
 *
 * Two integration paths, pick one when the UI is signed off:
 *
 * 1. World App Mini App (preferred for the World track)
 *    - `npm i @worldcoin/minikit-js`
 *    - `MiniKit.install()` in a client provider; `MiniKit.isInstalled()` gates this adapter.
 *    - connect(): `MiniKit.commandsAsync.walletAuth({ nonce })` then verify SIWE server-side.
 *    - transferUsdc(): `MiniKit.commandsAsync.pay({ reference, to, tokens: [{ symbol: Tokens.USDCE, token_amount }] })`
 *      or `sendTransaction` with the ERC-20 `transfer` call from `../chain` (ERC20_TRANSFER_ABI).
 *    - Balance: `publicClient.readContract({ address: activeNetwork().usdc, abi: ERC20_TRANSFER_ABI, functionName: "balanceOf" })`.
 *
 * 2. Plain browser wallet (EIP-1193) for desktop review
 *    - `npm i viem` (optionally wagmi).
 *    - `createWalletClient({ chain: worldchainSepolia, transport: custom(window.ethereum) })`
 *    - `switchChain` to 4801 before any write. Refuse to proceed on any other chain id.
 *
 * Amounts: `centsToUsdcUnits(amountCents)` from `../chain` gives the 6-decimal integer.
 */
export class WorldchainWalletAdapter implements WalletAdapter {
  connect(): Promise<WalletAccount> {
    return Promise.reject(notWired("connect"));
  }

  disconnect(): Promise<void> {
    return Promise.reject(notWired("disconnect"));
  }

  getUsdcBalanceCents(): Promise<number> {
    return Promise.reject(notWired("getUsdcBalanceCents"));
  }

  transferUsdc(): Promise<UsdcTransferReceipt> {
    return Promise.reject(notWired("transferUsdc"));
  }
}

function notWired(method: string): Error {
  const network = activeNetwork();
  return new Error(
    `WorldchainWalletAdapter.${method} is not wired yet (chain ${network.chainId}, USDC ${network.usdc}). ` +
      "See src/lib/rails/wallet/worldchainWalletAdapter.ts for the integration notes.",
  );
}
