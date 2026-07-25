# FOB — Session State / Resume Handoff

| | |
|---|---|
| **As of** | 2026-07-20 |
| **Run codename** | **Aristotle** — see `VERSIONING.md`. Next run: next philosopher alphabetically. |
| **Repo** | `/Users/will/flutterProjects/Exercises/26July/015-fob-system-raw-design` (git `main`) |
| **Pipeline** | A&D Pipeline Kit (`and-pipeline-kit/`) — ROME-PIPELINE-001 |
| **Run scope** | **Lean-6 core-capability modules, bounded** (see Locked decisions) |

**How to resume:** open a session in the repo root and run **`/and-design`** (Stage 6) — or tell the assistant "continue the FOB A&D pipeline; read `and-pipeline-kit/pipeline/project/SESSION-STATE.md`". Documents are the only memory; everything needed is in `pipeline/project/`.

---

## 1. Pipeline stage map

| Stage | Status | Output |
|---|---|---|
| 0–2 Analysis | ✅ DONE | `Intake_Note.md`, `DOMAIN-LEXICON.md`, `Journey_Index.md` (Gates 0/1/2 pass, 3 carried) |
| 3 Modular decomposition | ✅ DONE | `Module_Map.md` (Gate 3 pass) |
| 4 Requirements authoring | ✅ DONE | 6 module specs; 17 REQs (REQ-AUTH05 added at Stage 5 propagation); Gate 4 pass, banned-word clean |
| **5 Ratification (GATE)** | ✅ DONE | `Decision_Record_Aristotle_2026-07-20.md` — 12 decisions ratified, 3 carried open (D-NOTIF-1, D-NOTIF-2, D-DATA-3) with interim defaults; `Propagation_Plan_Aristotle_2026-07-20.md` executed — all module specs + lexicon + module map updated. Gate 5 PASS. |
| **6 Design (6a–6e)** | ⏭️ **NEXT** | Data dictionary, coverage matrix, workflows, architecture allocation, wireframes+copy — run `/and-design` |
| 7–8 Align + STRICT validate | ⛔ | — |
| 9 Baseline / build handoff | ⛔ | — |

## 2. Locked decisions (this run's scope — do not re-litigate on resume)

- **Lean-6 set:** `core-data-access`, `core-auth`, `core-notifications`, `core-consent-audit` (merged), `core-seo`, `core-design-system`. The other ~14 core modules from the architecture are **deferred / folded / platform-provided** (see `Intake_Note.md` §5).
- **Breadth:** analysis bounded to Tier-1 core concerns (not whole-FOB).
- **`consent` + `audit` merged** into one module (KI-2) — **ratified as DR-5**: `consents` kept as-is + new `audit_log` table.
- **`core-slot-holds` / `core-idempotency` / `core-i18n` / `core-rate-limiting`** are NOT modules (folded/platform).
- **DATA + DS carry zero REQs** — presumed shared subsystem / design asset (ROME-GUIDE-001 Rule 3 / Part 5).
- **ROME-GUIDE-001** (real requirements guide) was installed at `pipeline/kit/REQUIREMENTSAUTHORINGGUIDE.md`. *(The originally-attached file was ROME-GUIDE-002, the Technical-Spec/TDR guide — wrong doc; corrected.)*
- **`admin-rome` is canonical** (DR-1) for booking-site source; `rome-dev` treated as spurious for this project.
- **`core-design-system` scope narrowed** (DR-11): tokens shared, components implemented per-app (not one shared component library).

## 3. Artifact inventory (`and-pipeline-kit/pipeline/project/`)

| File | Stage | Notes |
|---|---|---|
| `Intake_Note.md` | 0 | 6 goals, 13 facts, 9 seed questions (SQ-01…09, all ratified — see cross-ref note in file) |
| `DOMAIN-LEXICON.md` | 1 | 13 terms, 7 actors, Built attr tables, 5 state tables, 8 KIs (KI-2/6/8 updated with DR status), fixtures |
| `Journey_Index.md` | 2 | 21 core + 7 deferred journeys |
| `Module_Map.md` | 3 | 6 modules, acyclic deps, 10 unowned-ground items (DR status annotated) |
| `core-auth.md` | 4 | REQ-AUTH01–05 (REQ-AUTH05 added at Stage 5 propagation) |
| `core-consent-audit.md` | 4 | REQ-CNA01–05 |
| `core-notifications.md` | 4 | REQ-NOTIF01–04 |
| `core-seo.md` | 4 | REQ-SEO01–03 (REQ-SEO03 rewritten at Stage 5 propagation) |
| `core-data-access.md` | 4 | 0 REQs (presumed subsystem) |
| `core-design-system.md` | 4 | 0 REQs (presumed design asset); Intent reworded at Stage 5 propagation |
| `Decision_Record_Aristotle_2026-07-20.md` | 5 | 12 decisions resolved (DR-1–DR-12), 3 carried open with interim defaults |
| `Propagation_Plan_Aristotle_2026-07-20.md` | 5 | Executed in full — all items checked off against the module specs above |

## 4. Decisions ratified at Stage 5 — see `Decision_Record_Aristotle_2026-07-20.md`

All 15 decision IDs are closed; full detail (rejected alternatives, impacts) lives in the Decision Record, not duplicated here.

**Resolved (12):** D-AUTH-1/D-DATA-1 (admin-rome canonical), D-AUTH-2 (JWT+KV), D-AUTH-3 (X-Device-ID sufficient v1), D-AUTH-4 (revoke in v1 → REQ-AUTH05), D-CNA-1 (consents + new audit_log), D-CNA-2 (audit_log designed at 6a), D-CNA-3 (defer non-prospect erasure, retain-by-default), D-NOTIF-3/D-DATA-2 (D1 webhook_events), D-SEO-1 (TouristAttraction+LocalBusiness+Product), D-SEO-2 (manual publish only → REQ-SEO03 rewritten), D-DS-1 (shared tokens + per-app components), D-DS-2 (Flutter library to-build).

**Still open, interim defaults active (3):** D-NOTIF-1 (channel orchestration — native/PoC, no vendor lock), D-NOTIF-2 (email — home-rolled solution to design; Postmark stays canonical meanwhile), D-DATA-3 (slot-hold pattern — out of this run's scope, belongs to `booking`).

## 5. Carried holes / watch-items on resume

- **`audit_log`** is a New entity with no DDL → design at Stage 6a (DR-6).
- **UJ-DATA-01/02, UJ-DS-01/02** are infrastructure/design journeys → realised at Stage 6d/6e, not behavioural REQs.
- **`CopilotMode`** (13th AORDL field) defaults to STRICT at Stage 8 conversion — not authored per-REQ (matches guide's own example).
- **"SendGrid"** appears in two corpus docs but is **stale** — Postmark is canonical (KI-3). Never cite SendGrid.
- **D-NOTIF-1 / D-NOTIF-2** still open — Stage 6 (esp. 6d architecture) must not silently assume a final vendor/orchestration choice; use the interim defaults only.
- **D-DATA-3** deferred to a future `booking` module — not this run's to design.
- **Repo gotcha:** `pipeline/project/source/FOB_Design_Corpus_v1` is a symlink to an **absolute** path — fine locally, breaks on clone elsewhere.

## 6. Module scaffold (separate from the pipeline)

`modules/` holds the project's folder scaffold (business-functions ×10 incl. `guide-map-tool`, apps ×4, core-capabilities library+services), each with `spec-docs/ poc/ wireframe/ mockup/`. The Stage-4 specs above can later be mirrored into `modules/core-capabilities/library/<name>/spec-docs/` if you want the specs to live beside their module folders (not yet done).
