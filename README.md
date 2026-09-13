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
