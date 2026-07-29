# FOB — Alignment & STRICT Validation (Stages 7–8)

| | |
|---|---|
| **Document** | Alignment audit + AORDL STRICT validation — the pre-build gate |
| **Version** | 1.0 |
| **Date** | 2026-07-21T00:00:00Z |
| **Status** | Reliable (audit result) |
| **Verdict** | ✅ **BASELINE-READY** — STRICT-clean; all carried items enumerated below and in the Manifest's "known outstanding". |
| **Scope** | The full aligned set: 11 behavioural modules + 2 presumed subsystems (`core-data-access`, `core-design-system`). Runs **Aristotle** (core + BOOK/PRE/OPS/TOUR/FLEET/POST) and **Bacon** (`back-office`). |
| **Sources** | Every current doc in `pipeline/project/`. SUPERSEDED files (none present) treated as history. |

**Auditor stance:** this stage finds, lists, and routes. The one hard bounce it found (REQ-AUTH05) was routed to Stage 4 and fixed there before this verdict was issued — recorded in §3.

---

## 1. Stage 7 — Traceability chain (Goal → UJ → REQ → {Surface, Data, State, Example} ↔ DR)

Walked in both directions. **78 REQs across 11 modules** trace forward to a journey and backward to a requirement; every surface (`W1–W21`, `A1–A20`, `G1–G13`, `E1–E8`, `P1–P2`) is demanded by ≥1 journey + REQ (verified in `Surface_Journey_Coverage.md`); every REQ carries a given/when/then example on the canonical fixtures.

**Chain closure: PASS**, with these **carried orphans** (each named, none silent):

| ID | Orphan | Direction | Disposition |
|---|---|---|---|
| GAP-6b-4 | `UJ-TOUR-08` (day-of prep/arrival) traces to no REQ | journey → (no REQ) | **Carried** — deliberate consequence of DR-T1 (light cadence removed the T-0 milestone). Revisit only if cadence reopens. |
| DR-B8 | Consent-gated abandonment-recovery email — ratified direction, no REQ authored | decision → (no REQ) | **Carried** — unowned ground (`Module_Map.md` §4); to author in `core-notifications`/`core-consent-audit`. |
| DR-F1 | Scheduled maintenance trigger — ratified direction, no REQ | decision → (no REQ) | **Carried** — FLEET follow-up. |
| DR-F6 | Combined pre-tour fleet certification gate — ratified direction, no REQ | decision → (no REQ) | **Carried** — FLEET↔OPS follow-up. |
| DR-F8/F9 | `retired`, `awaiting_external_service` bike states have no driving REQ | state → (no REQ) | **Carried** — declared holes (confirmed states, deliberately undriven). |

Deferred journeys (`UJ-BOOK-08/11`, `UJ-PRE-04/07`, `UJ-TOUR-05`, `UJ-FLEET-06`, `UJ-POST-05–09`) are **marked out-of-scope, not orphans** — their absence is on record in `Journey_Index.md` and `Module_Map.md` §4.

## 2. Stage 7 — Cross-doc inconsistency sweep

| Check | Result |
|---|---|
| Terms resolve to the lexicon | ✅ — all module terms defined; `departure`/`booking`/`bike assignment`/`departure calendar` present. |
| Enums vs the Data-Dictionary registry | ✅ — every enum used (`booking_status`, `payment_status`, `departure_status`, `bike_status`, …) exists in §3 registry. |
| Doc versions vs header refs | ✅ — Stage-6 docs at v0.9; Sources headers refreshed to cite the Bacon DR. |
| Stale filenames / "SendGrid" | ✅ — canonical email is Postmark (KI-3); "SendGrid" appears only in the raw corpus, never cited as a source. No SUPERSEDED files. |
| Doc titles | ✅ — all renamed "Tier-1 Core Capabilities" → "FOB". |
| Known-inconsistencies (lexicon §7) | Driven to zero **or** carried: KI-1 (session naming) resolved; KI-2 (consent+audit merge) ratified DR-5; KI-3/6/7/8 resolved; KI-6 (slot holds) resolved DR-B3. |

**Residual open decisions carried into build with interim defaults** (allowed — each is marked in its spec's open-questions, none is a MUST under undecided scope):

| ID | Interim default (safe direction) |
|---|---|
| D-NOTIF-1 | Direct Twilio, native integration, no orchestration-layer lock-in. |
| D-NOTIF-2 | Postmark canonical meanwhile; a home-rolled email solution to be designed. |
| D-TOUR-2 | Channel choice tied to D-NOTIF-1. |
| D-TOUR-3 | Weather advisories informational-only; no auto-escalation without real thresholds. |
| D-OPS-5 | Conservative internal incident record; insurer format to confirm. |
| DR-BO4 / DR-BO6 | Single-dated departures only; build-form (screens vs sessions) deferred. |

## 3. Stage 8 — AORDL STRICT validation

**Mechanical checks over all 78 REQs:**

| STRICT rule | Result |
|---|---|
| Approved verb per intent | ✅ all 78 — verbs used: create (12), submit (34), update (10), view (7), cancel (3), approve (3), reject (2), search (2), read/delete/export/archive/restore. |
| One atomic intent (no compounds) | ✅ |
| Specific actor (no `user/admin/stakeholder/…`) | ✅ — actors: Owner, Customer, Guide, Prospect, System (24, accepted per pipeline §6b System-actor requirements). |
| No UI words / tech words on REQ field lines | ✅ — grep-clean (`button/screen/page/click/sql/endpoint/database/query/…`). |
| No generic quantifiers | ✅ — "page"/"one-click" and the 4 residual "promptly" uses (booking, tour-ops, pre-tour) all corrected to concrete triggers/windows. |
| 13 fields present (12 authored + CopilotMode default STRICT) | ✅ — every REQ carries intent/actor/pre/conditions/post/outcomes/errors/invariants/non-functional/scope/open-questions/example. CopilotMode defaults STRICT at conversion. |
| Test adequacy — every Outcome + Error testable, nothing undeclared | ✅ — `errors: none declared` cases (9) each carry a justification (the action has no failure mode), not a silent omission. |

**Bounce found and resolved:**

| Bounce | REQ | Fault | Routing | Status |
|---|---|---|---|---|
| B-1 | REQ-AUTH05 | verb `revoke` not on the approved list | → Stage 4 | **FIXED** — `delete session`. |
| B-2 | REQ-AUTH05 | compound actor `Owner, Customer` | → Stage 4 | **FIXED** — actor `System` (deleter, triggered by an actor sign-out), consistent with REQ-AUTH04. DR-4 unchanged. |

**AORDL conversion:** the 78 REQ entries are in the Part-4 shape that maps 1:1 to the 13-field AORDL YAML — conversion is mechanical at ROME intake (no interpretation). A worked sample is in the Baseline handoff doc §4.

**Technical-spec axis (ROME-GUIDE-002):** the AORDL requirements cover the *what*; the *how* is now constituted as **`FOB-TSPEC-001`** — 17 TDRs (16 APPROVED, 1 PROPOSED) promoting the settled Cloudflare/D1/KV/Stripe/Postmark/JWT/Flutter stack from prose (Facts/DRs) into binding form. A ROME build reads **both** — without the TSPEC the stack decisions would be treated as non-binding background (`prose suggests; TDRs bind`).

## 4. Gate results

- **Gate 7 (Alignment):** ✅ PASS — chain closed both directions; orphans all carried with IDs; inconsistencies zero-or-carried; Manifest written.
- **Gate 8 (STRICT):** ✅ PASS — zero validator rejections after B-1/B-2 fixed; test adequacy holds; every bounce dispositioned.

## Verdict

> ## ✅ BASELINE-READY
> The aligned set is STRICT-clean and internally consistent. It may be baselined and handed to ROME for build. The carried holes (§1) and interim-default decisions (§2) are the *known* outstanding work — they are documented, not hidden, and none blocks a first build of the fully-specified modules.

---

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 1.0 | 2026-07-21T00:00:00Z | Stages 7–8 over the full Aristotle+Bacon set (78 REQs, 11 modules + 2 subsystems). One STRICT bounce (REQ-AUTH05 verb+actor) found and fixed at Stage 4. Chain closed with 5 carried orphans + 6 interim-default open decisions. Verdict: BASELINE-READY. |
