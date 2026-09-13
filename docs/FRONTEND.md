# Late Gate frontend: structure and how to wire the rails

This is the mobile web app for Late Gate. It implements the traveler and house-pool flows from
`docs/proto/proto-3-receipt-v2-late-gate-eng.html` as a real phone web app (sticky header, full-bleed
one-column layout, safe areas), not the Design preview's browser-on-desktop frame.

Everything runs on in-browser mock adapters by default. This document explains where the seams are
and how to switch them to the rails repo ([MikailR/late-gate](https://github.com/MikailR/late-gate))
once the UI has been reviewed.

## Layout of the code

```
src/
  app/                    Next.js App Router: layout (fonts, viewport), globals.css (tokens), page
  components/
    LateGateApp.tsx       client root: AppProvider + AppShell + ScreenRouter
    layout/               AppShell, AppHeader (wordmark + wallet chip), Sheet, WalletSheet
    ui/                   receipt primitives: PaperCard, ReceiptRow, Stamp, Button, CodeField, Screen
    screens/              one folder or file per screen (flight/, live/, pool/, shared/)
  state/                  reducer, actions, selectors, AppProvider (async controller), poolMath
  lib/
    config/constants.ts   demo flight, wallet, pool, tracker timings, network label
    domain/               product types, pricing lock, flightKey, schedule, lookup mapper
    data/                 airlines (+ logos in public/airlines), airports, demo flight fixtures
    format/               money and date formatters
    rails/                the backend seam (see below)
  hooks/                  useLongPress, useDemoEntry, useLatestRef
```

Screens are switched in place by `ScreenRouter` from `state.screen`. There is one route (`/`) so the
app behaves the same in a phone browser and inside a World App Mini App webview.

## Product locks the UI enforces

- Premium: Takeoff **$14**, Arrival **$9** (`lib/domain/pricing.ts`). Payout **$100 / $150 / $200** at
  **30 / 45 / 60** minutes late. Fixed premium, scaled payout.
- Lateness is only ever shown as minutes late. No tau glyph anywhere.
- Network label is **World Chain**; asset is **USDC**. No Hedera or Graph UI.
- Verify button reads **Verify with World (Sandbox)**. The orbLegacy stub path is a small fallback link.
  The UI never flips to verified without a `worldSession` coming back from the verify call.
- Demo hero flight: **UA837 SFO to NRT**, flightKey `UA837|<serviceDate>|SFO`. Airline pick prefills
  837 for United only; every other carrier starts blank.
- Hidden demo entry: long-press the **LATE GATE** wordmark, or open `/#demo`. `/#expired` previews the
  Expired settlement. There is no in-app demo toggle.

## The rails seam: `src/lib/rails`

```
rails/
  index.ts                getRails(): { api, wallet, worldId, mode }  (singleton)
  env.ts                  NEXT_PUBLIC_RAILS_MODE, NEXT_PUBLIC_RAILS_BASE_URL, chain id, World ids
  chain.ts                4801 Sepolia (locked), 480 mainnet (documented), USDC addresses, ABI, units
  types.ts                typed contracts for every seam
  mock/                   MockRailsClient (default), fake hashes
  http/                   HttpRailsClient (GET /api/quote, POST /api/world/verify, POST /api/tickets,
                          POST /api/worker/tick, pool + lpDeposit / lpWithdraw with TODOs)
  wallet/                 WalletAdapter: MockWalletAdapter (default), WorldchainWalletAdapter (TODO)
  world/                  WorldIdAdapter: MockWorldIdAdapter (default), IdKitWorldIdAdapter (TODO)
```

Screens never call `fetch`. They go through `actions.*` in `state/AppProvider.tsx`, which calls
`getRails()`. That is the only place to change when moving from mock to live.

### Seam by seam

| Seam | UI trigger | Mock today | Live wiring |
|---|---|---|---|
| `GET /api/quote` | Flight form inline lookup (`screens/flight/useFlightLookup.ts`) | Fixture table in `lib/data/flightFixtures.ts`; demo numbers per carrier map to HOT / CUTOFF / FULL / UNDERWRITE_REJECT | `HttpRailsClient.getQuote` already builds the query string. Map `QuoteRefusal` to the red lookup row via `lib/domain/lookup.ts` |
| `POST /api/world/verify` | Verify screen (`actions.verifyWithWorld`) | `MockWorldIdAdapter` fabricates an IDKit-shaped payload; `MockRailsClient.verifyWorld` returns a `worldSession` | Implement `IdKitWorldIdAdapter.requestProof` with `@worldcoin/idkit` (Sandbox, preset orbLegacy, action `late-gate-ticket`, signal = flightKey). Forward the result unchanged as `idkitResponse` |
| USDC transfer | Pay screen and pool deposit (`actions.pay`, `actions.submitPoolMove`) | `MockWalletAdapter` returns a random tx hash after 500 ms | Implement `WorldchainWalletAdapter` with MiniKit `pay` / `sendTransaction`, or viem on chain 4801. Notes are in the file |
| `POST /api/tickets` | Pay screen after the transfer | `MockRailsClient.issueTicket` increments a ticket counter from 1183 | Already wired in `HttpRailsClient.issueTicket`. Body: `{ flightKey, worldSession, product, minutesLate, travelerAddress, usdcTxHash }` |
| `POST /api/worker/tick` | Live tracker end (`actions.settleCurrentStub`) | Settles every open policy PAID at 47 min | House-side call; needs `x-worker-key`. Replace the interval in `screens/live/useLiveTracker.ts` with polling a policy status read once the rails expose one |
| `lpDeposit` / `lpWithdraw` | House pool Deposit / Withdraw | Stub receipts | These are library calls in the rails, not routes. `HttpRailsClient` proposes `POST /api/pool/deposit` and `POST /api/pool/withdraw`; add those routes on the rails side (or call `@/lib/usdc` from a server action) |
| Pool overview | House pool screen (`actions.refreshPool`) | Demo TVL $12,480, 41 open stubs | No rails endpoint yet. Proposed `GET /api/pool?address=0x…` returning `{ tvlCents, openStubs, depositCents, earnedCents }` |

### Money bookkeeping during the demo

The reducer (`state/reducer.ts`) moves USDC between the wallet, the pool and the stub exactly as the
proto did: a premium debits the wallet and credits pool TVL (and a depositor's earned share); a PAID
settlement credits the wallet and debits TVL; deposits and withdrawals move principal, draining earned
first on withdraw (`state/poolMath.ts`).

When the rails are live, replace those optimistic updates with refreshes from the rails responses:
`WALLET_CONNECTED` already takes the balance from `wallet.getUsdcBalanceCents`, and `POOL_SNAPSHOT`
already adopts pool-wide TVL and open-stub counts from `getPool()` whenever the House pool screen opens
(the mock tracks those across premiums, payouts, deposits and withdrawals). The caller's principal and
earned share are the remaining store-owned numbers to move over once the rails expose an LP position.

## World Mini App: MiniKit + IDKit

The app is a World Mini App shell as well as a mobile web app.

- `components/providers/WorldMiniKitProvider.tsx` wraps the tree in `MiniKitProvider` (from
  `@worldcoin/minikit-js/minikit-provider`) with `NEXT_PUBLIC_WORLD_APP_ID`, so `MiniKit.isInstalled()`
  is true inside World App. In a normal browser the install reports false and nothing else changes.
- `lib/world/minikit.ts` is the only file that imports the MiniKit SDK for runtime checks
  (`isWorldAppLive`, `isInsideWorldApp`).
- `lib/rails/switching.ts` picks live vs mock **per call**: live when the app id is set and MiniKit is
  installed (or when `NEXT_PUBLIC_RAILS_MODE=http`), mock otherwise. `/#demo` keeps working in a browser.

### Portal setup (Developer Portal, Late Gate Mini App)

- **App URL** must be exactly the origin the app is served from. For the tunnel build that is the
  current `https://….trycloudflare.com` hostname; a new tunnel means updating App URL again.
- Two portal apps: the **World ID** app (new Sandbox account, World ID enabled) feeds IDKit via
  `NEXT_PUBLIC_WORLD_APP_ID` / `NEXT_PUBLIC_WORLD_RP_ID` / `NEXT_PUBLIC_WORLD_ACTION`; the **Mini App**
  Late Gate Mini App (legacy portal entry) is only the MiniKit install id, `NEXT_PUBLIC_MINIKIT_APP_ID` (falls back to the
  World ID app id when empty).
- The **RP private signing key never goes in `NEXT_PUBLIC_*`** and is never committed. It belongs on
  the rails (or, for a local test, in server-only `WORLD_RP_SIGNING_KEY`).

### World ID (IDKit 4, Sandbox)

`lib/rails/world/idkitWorldIdAdapter.ts`, following the rails contract:

1. `rails.api.getRpContext()` = `POST /api/world/rp-context` (no body; rails PR #8, GET also accepted)
   → `200 { ok: true, rp_context: { rp_id, nonce, created_at, expires_at, signature } }`, **503** when the
   rails lack `WORLD_RP_SIGNING_KEY` / rp_id, **500** on a sign failure. The action is locked server-side
   to `late-gate-ticket`. In `http` mode `HttpRailsClient` calls the rails directly. In `mock` mode the
   call hits this app's mirror route (`app/api/world/rp-context/route.ts`), which signs only with a
   server-only key, else proxies server-side to `RAILS_BASE_URL` / `NEXT_PUBLIC_RAILS_BASE_URL`, else 503.
   So setting `NEXT_PUBLIC_RAILS_BASE_URL` alone already sources real rp_contexts from the rails while
   verify stays mock. Nothing is faked.
2. `IDKit.request({ app_id, action: "late-gate-ticket", rp_context, allow_legacy_proofs: true,
   environment })` with `.preset(orbLegacy({ signal: flightKey }))`. `environment` is the IDKit string
   from `NEXT_PUBLIC_IDKIT_ENVIRONMENT`, default **`"sandbox"`**: it opens the World ID Sandbox app
   handoff, which is what issues prize-track proofs. `"production"` is the production World ID app (it can
   open the Mini App but will not issue Sandbox proofs); `"staging"` is simulator-only and never used.
   The rails server flag `WORLD_ENV=sandbox` is a separate thing. Inside World App this runs natively;
   in a mobile browser the connector URI is opened for World App.
3. `pollUntilCompletion()` result is forwarded **unchanged** (no field remap) as `idkitResponse` in
   `POST /api/world/verify { flightKey, idkitResponse }` → `200 { ok, humanKey, worldSession, expiresAt,
   stub, preset }` / 401 UNVERIFIED / 409 DUPLICATE. Only a returned `worldSession` marks the traveler
   verified; an empty proof is UNVERIFIED.

If step 1 fails (no signing key anywhere yet), `verifyWithWorld` drops to the existing orbLegacy stub
path (`stubNullifier`) and the receipt prints `orbLegacy · stub`. Preset stays `orbLegacy`;
`selfieCheckLegacy` waits on the Tools for Humanity flag.

### Wallet (MiniKit)

`lib/rails/wallet/worldchainWalletAdapter.ts`:

- `connect`: `MiniKit.walletAuth` (SIWE). The signed message is kept for the rails to verify (TODO seam).
- `getUsdcBalanceCents`: JSON-RPC `eth_call balanceOf` on USDC, no viem needed.
- `transferUsdc`: `MiniKit.pay` with `Tokens.USDC`.

**Chain caveat.** MiniKit `pay` / `sendTransaction` only run on World Chain **mainnet (480)** with real
USDC. The product demo lock is Sepolia (4801). So inside World App the live adapter reads and pays on
480, and real payment is double-gated: `NEXT_PUBLIC_WORLD_PAY_ENABLED=1` **and** a configured
`NEXT_PUBLIC_LP_VAULT_ADDRESS` (it refuses to send to the demo placeholder). With either unset the
Pay step fails with a readable message and nothing is charged. `PayResult.transactionId` is a World
App transaction id; the rails must resolve it via the Developer Portal API before treating it as an
on-chain `usdcTxHash`.

### Flipping to live

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_RAILS_MODE=http` and `NEXT_PUBLIC_RAILS_BASE_URL` to the rails deployment.
3. Keep `NEXT_PUBLIC_WORLDCHAIN_CHAIN_ID=4801`. Mainnet (480) stays documented only.
4. Fill `NEXT_PUBLIC_WORLD_APP_ID` / `NEXT_PUBLIC_WORLD_RP_ID` for Sandbox IDKit; leave them empty to
   keep the orbLegacy stub path.
5. Implement the two `TODO` adapters (`WorldchainWalletAdapter`, `IdKitWorldIdAdapter`). Everything
   else in `getRails()` switches automatically with the mode flag.

## Visual system

Tokens live in `src/app/globals.css` under `@theme` and are used as Tailwind utilities (`bg-gate`,
`text-muted`, `border-rule`, `font-mono`): ink `#1A1A1A`, gate blue `#1F4FBF`, paper `#FFFFFF` on
phone `#F1EFEA`, stamp red `#B3382B`, lines `#E6E4DE` / rule `#D6D3CB`. Fonts are Libre Franklin and
Courier Prime via `next/font/google`.

Receipt idiom pieces (`components/ui`): `PaperCard` (serrated edge, print animation), `ReceiptRow`,
`ReceiptRule`, `Stamp` (drop / center animations), `barcode`. The perforated Pick a stub halves and the
punched minute pickers are component classes in `globals.css` (`stub-half-top/bottom`, `tear-rule`).

## Deadline build: stub verify

`NEXT_PUBLIC_WORLD_VERIFY_MODE=stub` (default) sends `{ flightKey, stubNullifier: "demo-human-a" }` to
`POST /api/world/verify` (rails: `200 { ok, stub: true, preset: "orbLegacy", worldSession, humanKey }`;
empty proof = 401 UNVERIFIED). The UI labels it `Verify with World (Sandbox stub)` and the pay receipt
prints `orbLegacy · stub`. `sandbox` mode runs the real IDKit flow above first. Inside World App with
`NEXT_PUBLIC_WORLD_PAY_ENABLED` off, the transfer is a labelled demo transfer on the real MiniKit
address. See `docs/WORLD_FEEDBACK.md` for the prize-track story.

## Testing

There is no test runner yet. Suggested first tests:

- `state/reducer.ts` and `state/poolMath.ts` (pure): premium/payout bookkeeping, withdraw drains
  earned first, MAX empties exactly.
- `lib/domain/lookup.ts` and `components/screens/flight/FlightNumberField.tsx`
  (`parseFlightNumberInput`): refusal mapping, pasted `AC2847` switches carrier.
- `lib/rails/mock/mockRailsClient.ts`: verify requires a proof payload, ticket counter increments.
