# Late Gate App

Mobile web frontend for Late Gate (ETHOnline 2026): parametric flight-delay stubs on World Chain USDC.

- Design source: `docs/proto/proto-3-receipt-v2-late-gate-eng.html` (Claude Design Proto 3 Receipt v2 Late Gate eng)
- Backend rails live in sibling repo: https://github.com/MikailR/late-gate (API seams only; wire after frontend review)

## Product locks
- Mobile web app (phone viewport), not a desktop conversion of the Design frame
- World Chain + USDC wallet; World Sandbox verify
- Demo flight: UA837 SFO→NRT
- Pricing: Takeoff $14 / Arrival $9; payouts $100/$150/$200 at 30/45/60
