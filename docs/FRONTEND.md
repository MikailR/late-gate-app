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

## Testing

There is no test runner yet. Suggested first tests:

- `state/reducer.ts` and `state/poolMath.ts` (pure): premium/payout bookkeeping, withdraw drains
  earned first, MAX empties exactly.
- `lib/domain/lookup.ts` and `components/screens/flight/FlightNumberField.tsx`
  (`parseFlightNumberInput`): refusal mapping, pasted `AC2847` switches carrier.
- `lib/rails/mock/mockRailsClient.ts`: verify requires a proof payload, ticket counter increments.
