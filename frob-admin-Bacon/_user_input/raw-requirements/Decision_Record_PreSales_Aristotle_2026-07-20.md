# Decision Record — pre-sales (PRE) — 2026-07-20

| | |
|---|---|
| **Status** | RATIFIED by William (sponsor), 2026-07-20 — until propagation completes, this record wins over any conflicting doc text |
| **Still open** | none |
| **Sources** | `pre-sales.md` §3 (Decisions-needed) |

## Resolved

### DR-P1 · Owner alert routing for enquiries *(closes D-PRE-1)*
Daily digest email, not immediate WhatsApp. WhatsApp owner-alerting is not spec'd or POC'd anywhere in this project — it isn't an available channel to route through yet, not just an undecided preference.
**Rejected alternatives:** immediate WhatsApp (rejected — no connector exists); "both, configurable" (premature — nothing to configure between until WhatsApp exists).
**Impacts:** `pre-sales.md` REQ-PRE04's owner-alert path realises via `core-notifications` REQ-NOTIF04 on a daily-digest cadence; `Module_Map.md`'s unowned-ground table should note WhatsApp owner-alerting as a new, not-yet-built capability if it's ever wanted later.

### DR-P2 · Spam-flagged enquiries suppress the owner alert entirely *(closes D-PRE-2)*
A `status=spam` enquiry generates no owner alert at all — not deprioritised, not queued, simply suppressed.
**Rejected alternatives:** deprioritise-but-still-alert (rejected — recommendation confirmed as-is).
**Impacts:** `pre-sales.md` REQ-PRE04's error case ("submission is flagged spam...no owner alert fires") is already worded correctly — no REQ text change needed, just close the decision tag.

### DR-P3 · Overdue-SLA auto-email deferred *(closes D-PRE-3)*
No automatic apology/extended-SLA email to the prospect at 24h overdue. Overdue enquiries remain visible to the Owner (REQ-PRE05's invariant already covers this) — that visibility is the only safeguard for now.
**Rejected alternatives:** building the auto-email this pass (rejected — a refinement, not core scope).
**Impacts:** none to existing REQs; this is unowned ground for a future pass, already noted in `Module_Map.md`.

### DR-P4 · Chatbot launch scope — not a live decision *(closes D-PRE-4)*
Confirmed as deferred along with the entire concierge module (UJ-PRE-04/07), consistent with the Stage 0 scoping decision. Not ratified as a choice among A/B/C — simply out of scope for this pass.
**Rejected alternatives:** n/a — no options were live to choose between.
**Impacts:** none; `Module_Map.md` already lists the concierge module as deferred, unallocated ground.

## Still open
None.

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial PRE Decision Record: 4 decisions resolved (DR-P1–P4), 0 carried open. |
