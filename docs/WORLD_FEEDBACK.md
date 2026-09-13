# World track feedback: Late Gate (LateKid Mini App)

Prize-track notes for the World / World ID judges. The rails repo
([MikailR/late-gate](https://github.com/MikailR/late-gate), `FEEDBACK.md`) carries the server side of the
same story.

## What we could not complete, and why

**World ID Sandbox proofs end to end.** Prize-track proofs must come from the World ID Sandbox app.
During ETHOnline the public TestFlight for the Sandbox app was full, and the Developer Portal email
enrolment for Sandbox testers was still pending when we shipped. Without a Sandbox app on a device no
Sandbox proof can be produced, so we could not run the real IDKit Sandbox round trip against
`POST /api/world/verify`.

**Production Selfie Check (Beta).** Gated by Tools for Humanity (`developers@toolsforhumanity.com`);
teams cannot self-enable the flag. We never present a live selfie CTA as working. Preset stays
`orbLegacy`, `allow_legacy_proofs: true`.

## What is demonstrated

- **Mini App shell.** `@worldcoin/minikit-js` 2.x `MiniKitProvider` installs with the LateKid Mini App id
  (`app_6ee0563505d2423eb78b3b69a04714db`). The app opens inside production World App; the same build
  runs in a phone browser on mock adapters (`/#demo`).
- **MiniKit wallet.** Inside World App, `MiniKit.walletAuth` (SIWE) connects the real wallet and the
  header / wallet sheet show its USDC balance (JSON-RPC `balanceOf`). Source row reads
  `World App · MiniKit`. Real USDC movement through `MiniKit.pay` is implemented but gated off
  (`NEXT_PUBLIC_WORLD_PAY_ENABLED`, plus a configured vault); with the gate off the transfer is a
  labelled demo transfer, so no traveler funds move during judging.
- **IDKit 4 wiring, ready for Sandbox.** `IDKit.request({ app_id, action: "late-gate-ticket",
  rp_context, allow_legacy_proofs: true, environment: "sandbox" }).preset(orbLegacy({ signal: flightKey }))`.
  The `rp_context` is fetched from the rails (`POST /api/world/rp-context`); the RP private key never
  touches the frontend. The IDKit result is forwarded unchanged to `POST /api/world/verify`.
  World ID app id `app_1b5bf7864f74fef67dad22c8d9c578a0`, RP id `rp_0c1712e67e722ab1`.
- **Honest stub verify (default for the deadline build).** `NEXT_PUBLIC_WORLD_VERIFY_MODE=stub` sends
  `{ flightKey, stubNullifier: "demo-human-a" }` to `POST /api/world/verify` and expects
  `{ ok, stub: true, preset: "orbLegacy", worldSession, humanKey }`. Empty proof is UNVERIFIED and is
  never treated as a pass. The UI says so: button `Verify with World (Sandbox stub)`, note
  `SANDBOX APP NOT ENROLLED YET · ORBLEGACY STUB VIA POST /api/world/verify`, and the pay receipt prints
  `VERIFIED orbLegacy · stub`. Flip to `sandbox` mode and the real IDKit flow runs first.
- **One human per flight.** `humanKey = keccak256(nullifier || flightKey)` on the rails; the frontend only
  ever holds the `worldSession`.

## How to test

- Browser: open the live URL with `/#demo`, connect the demo wallet, buy a stub. Verify shows the stub
  path; pay is a demo transfer.
- World App (production): add the live URL as the LateKid Mini App **App URL** in the Developer Portal,
  open the Mini App, connect (MiniKit walletAuth), buy a stub. Verify uses the stub path (no Sandbox app),
  pay is a labelled demo transfer.
- Sandbox (when the invite lands): set `NEXT_PUBLIC_WORLD_VERIFY_MODE=sandbox` and point
  `NEXT_PUBLIC_RAILS_BASE_URL` at the rails so `rp_context` is signed server-side; open in the World ID
  Sandbox app.

## Asks for the World team

1. A path for hackathon teams to get Sandbox app access when the public TestFlight is full.
2. Clearer separation in docs between the IDKit `environment` string (`sandbox` / `production`;
   `staging` is simulator-only) and server-side flags.
3. MiniKit `pay` / `sendTransaction` testnet support (World Chain Sepolia 4801), so demo builds do not
   have to gate real mainnet USDC.
4. Selfie Check (Beta) self-service enablement for verified hackathon apps.

## Links

- World Developer Portal: https://developer.world.org
- World ID Sandbox tester enrolment: request through the Developer Portal app settings
  (World ID → Sandbox) and developers@toolsforhumanity.com
- IDKit: https://docs.world.org/world-id/id/idkit
- MiniKit: https://docs.world.org/mini-apps
- Rails repo and server feedback: https://github.com/MikailR/late-gate
