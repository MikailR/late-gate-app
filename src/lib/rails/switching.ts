import type { Hex } from "@/lib/domain/types";
import type { IdKitProofPayload } from "./types";
import type { UsdcTransferReceipt, UsdcTransferRequest, WalletAccount, WalletAdapter } from "./wallet/types";
import type { WorldEnvironment, WorldIdAdapter, WorldProofRequest } from "./world/types";

/**
 * Picks the live or mock implementation at call time. MiniKit installs in a
 * provider effect after the first render, so the decision cannot be made
 * once at construction; each command asks `shouldUseLive()` when it runs.
 */
export class SwitchingWalletAdapter implements WalletAdapter {
  constructor(
    private readonly live: WalletAdapter,
    private readonly mock: WalletAdapter,
    private readonly shouldUseLive: () => boolean,
  ) {}

  private pick(): WalletAdapter {
    return this.shouldUseLive() ? this.live : this.mock;
  }

  connect(): Promise<WalletAccount> {
    return this.pick().connect();
  }

  disconnect(): Promise<void> {
    return Promise.all([this.live.disconnect().catch(() => undefined), this.mock.disconnect().catch(() => undefined)]).then(() => undefined);
  }

  getUsdcBalanceCents(address: Hex): Promise<number> {
    return this.pick().getUsdcBalanceCents(address);
  }

  transferUsdc(request: UsdcTransferRequest): Promise<UsdcTransferReceipt> {
    return this.pick().transferUsdc(request);
  }
}

export class SwitchingWorldIdAdapter implements WorldIdAdapter {
  constructor(
    private readonly live: WorldIdAdapter,
    private readonly mock: WorldIdAdapter,
    private readonly shouldUseLive: () => boolean,
  ) {}

  get environment(): WorldEnvironment {
    return (this.shouldUseLive() ? this.live : this.mock).environment;
  }

  requestProof(request: WorldProofRequest): Promise<IdKitProofPayload> {
    return (this.shouldUseLive() ? this.live : this.mock).requestProof(request);
  }
}
