# P2 Sponsor Open-Question Resolutions (Deferrals)

| Field | Value |
|-------|-------|
| Phase | P2 (Analysis) |
| Decided by | Sponsor (williampaulton@gmail.com) |
| Date | 2026-07-21 |
| Mechanism | Sponsor-authorized deferral with interim default (ROME-PROP-041 B3) |

All four open questions were resolved as **sponsor-authorized deferrals**: the build proceeds on the interim default; the decision is revisited later without blocking. `sponsorAuthorized: true`.

| id | REQ(s) | Question | Interim default (build on this) | Revisit trigger |
|----|--------|----------|----------------------------------|-----------------|
| DEF-OQ-1 | REQ-TOUR02 | T-1 departure reminder channels (D-NOTIF-1 / TDR-10) | **Email only** (Postmark); SMS omitted at v1 | TDR-10 resolves (direct Twilio vs Knock) + Twilio provisioned |
| DEF-OQ-2 | REQ-FLEET05 | Scheduled maintenance trigger from time+mileage (DR-F1) | **Flag-driven only**; no auto time/mileage trigger at v1 | DR-F1 authored as a new REQ |
| DEF-OQ-3 | REQ-OPS11, REQ-OPS12 | PLI insurer incident-report format (D-OPS-5) | **Generic export** (human-readable + structured payload) | Insurer supplies required template |
| DEF-OQ-4 | REQ-TOUR03 | Advisory informational-vs-action thresholds (D-TOUR-3) | **Sensible config-driven defaults** (Owner-tunable) | Real operational data / sponsor-specified bands |

These deferrals are recorded in `state.oq.deferrals` with `sponsorAuthorized: true`, satisfying the GATE-P2 `sponsorOq` fact.
