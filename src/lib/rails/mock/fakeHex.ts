import type { Hex } from "@/lib/domain/types";

/** Random 0x-prefixed hex of `bytes` length. Browser and Node safe. */
export function randomHex(bytes = 32): Hex {
  const buffer = new Uint8Array(bytes);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(buffer);
  } else {
    for (let i = 0; i < bytes; i++) buffer[i] = Math.floor(Math.random() * 256);
  }
  return `0x${Array.from(buffer, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Small deterministic 32-byte digest (FNV-1a folded) for mock humanKeys.
 * Not cryptographic. The rails compute the real keccak256 server-side.
 */
export function pseudoDigest(input: string): Hex {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x811c9dc5) >>> 0;
  }
  const words: string[] = [];
  for (let i = 0; i < 8; i++) {
    h1 = Math.imul(h1 ^ (h1 >>> 15), 0x2c1b3c6d) >>> 0;
    h2 = Math.imul(h2 ^ (h2 >>> 13), 0x297a2d39) >>> 0;
    words.push(((h1 ^ h2) >>> 0).toString(16).padStart(8, "0"));
  }
  return `0x${words.join("")}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
