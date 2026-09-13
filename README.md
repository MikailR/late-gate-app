# Late Gate App

Mobile web frontend for Late Gate (ETHOnline 2026): parametric flight-delay stubs on World Chain USDC.

- Design source: `docs/proto/proto-3-receipt-v2-late-gate-eng.html` (Claude Design Proto 3 Receipt v2 Late Gate eng)
- Frontend structure and rails wiring guide: [`docs/FRONTEND.md`](docs/FRONTEND.md)
- Backend rails live in sibling repo: https://github.com/MikailR/late-gate (API seams only; wire after frontend review)

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 on a phone, or in a desktop browser with device emulation (390 x 844 is the
design size; the column stays a single phone width up to 480px).

No secrets or env vars are needed. The app runs on in-browser mock adapters (wallet, World Sandbox
verify, rails API). See `.env.example` for the flags that switch to the live rails.

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## Demo path

- Home is **My stubs**. Tap **Cover a flight**, pick **United**, and UA 837 SFO to NRT is prefilled.
- Hidden demo entry: long-press the **LATE GATE** wordmark, or open `/#demo` to land on the flight
  form directly. `/#expired` previews the on-time settlement. There is no in-app demo toggle.
- Other carriers are pickable; each carrier has demo flight numbers that show the refusal states
  (see `src/lib/data/airlines.ts`). Any other number is on time and buyable.
- On the live tracker, **skip ahead** settles the stub immediately.

## World Mini App

The app installs MiniKit on load (`NEXT_PUBLIC_MINIKIT_APP_ID`, the LateKid Mini App; IDKit uses the
separate World ID app id `NEXT_PUBLIC_WORLD_APP_ID`), so it runs inside World App as the
Mini App **LateKid** as well as in a phone browser. Inside World App the wallet and World ID paths use
MiniKit / IDKit (Sandbox); in a browser they stay on the mock adapters.

- Portal **App URL** must match the URL the app is served from (for a tunnel build, the current
  trycloudflare hostname).
- Public ids (`app_…`, `rp_…`, action) are safe in `NEXT_PUBLIC_*`. The **RP private signing key is
  server-only** (`WORLD_RP_SIGNING_KEY` on the rails, never `NEXT_PUBLIC_`, never committed). Without
  it Sandbox IDKit cannot start and Verify falls back to the orbLegacy stub path.
- Real USDC pay through MiniKit is off unless `NEXT_PUBLIC_WORLD_PAY_ENABLED=1` and a vault address is
  set; World App pays on World Chain mainnet (480), see `docs/FRONTEND.md`.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4. Fonts: Libre Franklin and Courier Prime.
Client-side demo state in `src/state`; typed rails scaffolding in `src/lib/rails` (mock by default,
HTTP adapter behind `NEXT_PUBLIC_RAILS_MODE=http`).

## Product locks
- Mobile web app (phone viewport), not a desktop conversion of the Design frame
- World Chain + USDC wallet; World Sandbox verify (`Verify with World (Sandbox)`); production Selfie Check waits on the World flag
- Demo flight: UA837 SFO→NRT (flightKey `UA837|serviceDate|SFO`)
- Pricing: Takeoff $14 / Arrival $9; payouts $100/$150/$200 at 30/45/60. Fixed premium, scaled payout
- Lateness is only ever shown as 30 / 45 / 60 minutes late
- World Chain Sepolia (4801) for the demo; mainnet 480 documented only
