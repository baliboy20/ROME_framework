# FOB Lean-6 — Propagation Plan (post Decision_Record_2026-07-20)

| | |
|---|---|
| **Document** | Propagation plan for Stage 5 ratification |
| **Status** | **EXECUTED 2026-07-20** — all items below checked off against the module specs, lexicon, and module map. Gate 5 fully clean. |
| **Sources** | `Decision_Record_Aristotle_2026-07-20.md` |

**Order matters** — lexicon first (shared vocabulary), then module specs (in the order their decisions were closed), then map/cross-doc sweep last.

## 1. `DOMAIN-LEXICON.md`
- [x] KI-2 (consent/audit merge) → mark resolved, cite DR-5.
- [x] KI-6 (slot-hold pattern) → mark "deferred to `booking` module, out of this run's scope," cite D-DATA-3 still-open.
- [x] KI-8 (save-link auth) → mark resolved, cite DR-2.

## 2. `core-auth.md`
- [x] §3: close D-AUTH-1, D-AUTH-2, D-AUTH-3, D-AUTH-4 — each cites its DR.
- [x] REQ-AUTH01 open-questions: D-AUTH-1 OPEN → closed (DR-1).
- [x] REQ-AUTH02 open-questions: D-AUTH-2 OPEN → closed (DR-2).
- [x] REQ-AUTH03 open-questions: D-AUTH-3 OPEN → closed (DR-3).
- [x] **Author REQ-AUTH05** — System/Owner/Customer revokes session on demand (DR-4). Full AORDL entry, 13 fields + example, per ROME-GUIDE-001 Part 4.
- [x] §5 journeys: "Session revoked (logout)" row — change from "no REQ yet — D-AUTH-4" to REQ-AUTH05.

## 3. `core-consent-audit.md`
- [x] §3: close D-CNA-1 (cite DR-5), D-CNA-2 (cite DR-6, deferred to 6a), D-CNA-3 (cite DR-7, deferred).
- [x] REQ-CNA01 open-questions: D-CNA-1 OPEN → closed (DR-5).
- [x] REQ-CNA03 open-questions: D-CNA-2 OPEN → carried to Stage 6a (DR-6).
- [x] REQ-CNA04 open-questions: D-CNA-3 OPEN → closed as deferred (DR-7); no REQ text change needed (already prospects-scoped).

## 4. `core-notifications.md`
- [x] §3: close D-NOTIF-3 (cite DR-8); D-NOTIF-1 and D-NOTIF-2 stay OPEN — attach interim-default notes from DR record.
- [x] REQ-NOTIF01 open-questions: D-NOTIF-1 stays OPEN (interim default noted); D-NOTIF-2 not listed here currently but is implicated — add cross-reference.
- [x] REQ-NOTIF03 open-questions: D-NOTIF-3 OPEN → closed (DR-8).
- [x] REQ-NOTIF04 open-questions: D-NOTIF-1 stays OPEN (interim default noted).

## 5. `core-seo.md`
- [x] §3: close D-SEO-1 (cite DR-9), D-SEO-2 (cite DR-10).
- [x] REQ-SEO01 open-questions: D-SEO-1 OPEN → closed (DR-9).
- [x] **Rewrite REQ-SEO03** — invariant and errors clause per DR-10 (staleness-until-manual-publish is expected behaviour, not an error).
- [x] REQ-SEO02 open-questions: D-SEO-2 OPEN → closed (DR-10), confirm index behaviour unaffected by manual-only trigger.

## 6. `core-data-access.md`
- [x] §3: close D-DATA-1 (cite DR-1), D-DATA-2 (cite DR-8); D-DATA-3 stays OPEN, marked explicitly out-of-scope-for-this-run (not "resolved here").

## 7. `core-design-system.md`
- [x] §1 Intent — reword per DR-11 (shared tokens; components per-app).
- [x] §2 Facts — annotate the PRD §10.1 citation as narrowed by DR-11.
- [x] §3: close D-DS-1 (cite DR-11), D-DS-2 (cite DR-12, to-build).

## 8. `Module_Map.md`
- [x] DS module row — Intent/Core-features wording aligned with DR-11 (tokens shared, components per-app).
- [x] Confirm D-DATA-3 (slot-hold) appears in the Unowned-ground table (§4), owned by `booking`, status "not yet drafted" — add if missing.

## 9. Cross-doc stale-reference sweep (last)
- [x] Grep all `pipeline/project/*.md` for `rome-dev` cited as a source-of-truth (not just historically) — none should remain after DR-1.
- [x] Confirm no doc still shows any of the 12 closed decisions as OPEN after edits above.
- [x] Confirm `SESSION-STATE.md` is updated to reflect Stage 5 complete and point at Stage 6 next.

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial propagation plan for Decision_Record_2026-07-20. Not yet executed. |
| 0.2 | 2026-07-20T00:00:00Z | Executed in full — all 30 items checked off. Lexicon, all 6 module specs, and Module_Map.md updated to match the ratified decisions. |
