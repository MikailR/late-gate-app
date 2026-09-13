import type { Hex } from "@/lib/domain/types";
import { railsEnv } from "./env";

/**
 * World Chain + native USDC. Mirrors `lib/usdc/chain.ts` in the rails repo.
 * Demo / testnet target is Sepolia (4801) only.
 */

/** Locked demo / testnet. */
export const WORLDCHAIN_SEPOLIA_CHAIN_ID = 4801 as const;

/** Documented only. Do not target until the product leaves testnet. */
export const WORLDCHAIN_MAINNET_CHAIN_ID = 480 as const;

export const USDC_DECIMALS = 6 as const;

/** Circle native USDC on World Chain Sepolia (verified 2026-09-13 in the rails repo). */
export const USDC_SEPOLIA_ADDRESS: Hex = "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88";

/** Circle native USDC on World Chain mainnet. Docs only. */
export const USDC_MAINNET_ADDRESS: Hex = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";

export const WORLDCHAIN_SEPOLIA_PUBLIC_RPC = "https://worldchain-sepolia.g.alchemy.com/public";
export const WORLDCHAIN_SEPOLIA_EXPLORER = "https://worldchain-sepolia.explorer.alchemy.com";
export const WORLDCHAIN_MAINNET_EXPLORER = "https://worldscan.org";

export type WorldchainNetwork = {
  chainId: typeof WORLDCHAIN_SEPOLIA_CHAIN_ID | typeof WORLDCHAIN_MAINNET_CHAIN_ID;
  name: "worldchain-sepolia" | "worldchain";
  usdc: Hex;
  rpcUrl: string;
  explorerUrl: string;
  testnet: boolean;
};

const NETWORKS: Readonly<Record<number, WorldchainNetwork>> = {
  [WORLDCHAIN_SEPOLIA_CHAIN_ID]: {
    chainId: WORLDCHAIN_SEPOLIA_CHAIN_ID,
    name: "worldchain-sepolia",
    usdc: USDC_SEPOLIA_ADDRESS,
    rpcUrl: WORLDCHAIN_SEPOLIA_PUBLIC_RPC,
    explorerUrl: WORLDCHAIN_SEPOLIA_EXPLORER,
    testnet: true,
  },
  [WORLDCHAIN_MAINNET_CHAIN_ID]: {
    chainId: WORLDCHAIN_MAINNET_CHAIN_ID,
    name: "worldchain",
    usdc: USDC_MAINNET_ADDRESS,
    rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
    explorerUrl: WORLDCHAIN_MAINNET_EXPLORER,
    testnet: false,
  },
};

/** Network config for a chain id. Unknown ids fall back to Sepolia so demos never hit mainnet by accident. */
export function networkFor(chainId: number): WorldchainNetwork {
  return NETWORKS[chainId] ?? NETWORKS[WORLDCHAIN_SEPOLIA_CHAIN_ID];
}

/** Active network from env, with the optional USDC address override applied. */
export function activeNetwork(): WorldchainNetwork {
  const network = networkFor(railsEnv.chainId);
  if (railsEnv.usdcAddress.startsWith("0x")) {
    return { ...network, usdc: railsEnv.usdcAddress as Hex };
  }
  return network;
}

/**
 * Placeholder recipient used by the mock adapters. The live wallet adapter
 * refuses to send real USDC here; set NEXT_PUBLIC_LP_VAULT_ADDRESS instead.
 */
export const DEMO_VAULT_PLACEHOLDER: Hex = "0x000000000000000000000000000000004c50564c";

/** Where premiums and LP deposits go: the configured vault, or the demo placeholder. */
export function vaultAddress(): Hex {
  return railsEnv.lpVaultAddress.startsWith("0x") ? (railsEnv.lpVaultAddress as Hex) : DEMO_VAULT_PLACEHOLDER;
}

export function isVaultConfigured(): boolean {
  return vaultAddress() !== DEMO_VAULT_PLACEHOLDER;
}

export function explorerTxUrl(txHash: Hex, network: WorldchainNetwork = activeNetwork()): string {
  return `${network.explorerUrl}/tx/${txHash}`;
}

/** `$9.00` = 900 cents = 9_000_000 units. Returned as a decimal string for JSON safety. */
export function centsToUsdcUnits(cents: number): string {
  return (BigInt(Math.round(cents)) * BigInt(10 ** (USDC_DECIMALS - 2))).toString();
}

export function usdcUnitsToCents(units: string): number {
  return Number(BigInt(units) / BigInt(10 ** (USDC_DECIMALS - 2)));
}

export const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
