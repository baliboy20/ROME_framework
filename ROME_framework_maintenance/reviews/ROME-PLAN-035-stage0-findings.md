# ROME-PLAN-035 — Stage 0 Findings (Decisions & Safe Pre-Work)

| Field | Value |
|-------|-------|
| **UID** | ROME-PLAN-035-S0 |
| **Date** | 2026-06-18 |
| **Branch** | `rearchitecture/prop-035-subagent-orchestration` |
| **Stage** | 0 — decisions confirmed, reference audits, MCP union set, symlink |

---

## D1–D4 — confirmed (sponsor, 2026-06-18)
Native skills · `state.json` source of truth · consolidated union MCP set · PROP-034 first. (See ROME-PLAN-035 §0.1.)

## 0.3a — Custom skill runtime dependency audit (D1)
**Finding: safe to retire `SkillInvoker`/`SkillRegistry`.** No live JavaScript runtime `require`s them — the only matches for a `require('...Skill(Invoker|Registry)')` pattern are inside **markdown proposal docs** (PROP-012, MONTH-1-WEEK-1), not code. All other hits are documentation/manifests (to be updated at Stage 7) and the files themselves. No executable consumer.
**Action:** retire at cutover; update doc references in Stage 7.

## 0.3b — ActivityLogCoordinator audit
**Finding: safe to remove with p5-hybrid.** Used only by `ROME_tools/orchestrators/p5-hybrid/*` (itself slated for removal) and documentation. No other runtime consumer.

## 0.3c — MCP union set (D3)
Every robot `add-mcps-v4.sh` (10) + `rome-core/scripts/add-mcps-v4.sh` add the **same three** servers:

| Server | Count | Disposition under new model |
|--------|-------|------------------------------|
| `activity-log-file` | 11 | **KEEP** — audit trail (D2) |
| `Seez` | 11 | **KEEP** — sponsor interaction |
| `iterm2-terminal` | 11 | **REMOVE** — terminal multiplexing for the old multi-session model; single orchestrator session does not need it |

`.mcp.json` files present: `ROME_architect/.mcp.json`, `ROME/rome-core/.mcp.json`, `…/archive/…/P00-bootup/.mcp.json` (archive).

**Consolidated orchestrator MCP set (target):** `activity-log-file` + `Seez` **+ add `Mermaid`** (for PROP-037 visualization). Drop `iterm2-terminal` and all per-robot scripts.

## 0.2 — Symlink
`ROME_architect/addmcp.sh` → external `nov/romev10/.../setup-mcp-servers-v3.sh`. **Correction:** target *exists* (not broken, as REV-006 v1.0 claimed) — it is a stale **cross-repo** link to an older framework, outside this repo's runtime, and installs `iterm2-terminal` (dropped). **Removed in Stage 0.**

## 0.4 — Baseline run / environment calibration (2026-06-18)

**Environment:** node v24.4.1, npm 11.4.2. Node tooling runs fine.

**Deterministic KEEP-utilities — baseline status:**

| Utility | Result | Note |
|---------|--------|------|
| `rome-core/lib/annotate-artifact.cjs` (traceability) | ✅ 36/36 tests pass | regression oracle for EP-1 annotation |
| `rome-core/servers/activity-log/**` (audit trail) | ✅ all tests pass (format/validate/buildState/history/query/E2E) | regression oracle for the audit server |
| `rome-core/lib/aordl-parser/validate-aordl.js` (the designated **mechanical P1 check**, 035 §3.5.3) | ❌ **NOT runnable** | two defects below |

**⚠ Critical finding — the AORDL validator is currently broken in-repo:**
1. **Missing manifest:** it loads validation rules from `../registry/validate-aordl.yaml` — that file (and the whole `lib/registry/` dir) **does not exist** anywhere in the repo. The required-fields / anti-pattern / approved-verb data the validator reads is absent.
2. **Missing dependency:** `js-yaml` is not installed at its location (only under `ROME_tools/node_modules`); no `package.json` near `aordl-parser/`.

**Impact on the plan:** PROP-035 §3.5.3 leans on this validator as the deterministic accuracy backbone at P1. It must be **repaired early** — author/restore the rules manifest (naturally as part of the PROP-034 *AORDL standard* doc, with the validator reading from it) and give `aordl-parser/` a proper `package.json`/dep. Added to Stage 1 scope.

**Full-pipeline baseline not capturable headless:** the legacy framework runs as live Claude Code sessions + MCP servers; it cannot be executed in this bash environment. The test fixtures (`testapps/*`, `test-project-*`) contain only raw `_user_input` (PRD/BRD) — **no generated AORDL/analysis/design artifacts exist** to diff against. Therefore the regression oracle for the migration is the **deterministic utility tests above + per-stage fixture dry-runs I perform**, not a recorded run of the old pipeline.

## Status
Stage 0 complete: decisions confirmed, reference audits done (all removals dependency-safe), MCP union set determined, stale symlink removed, environment calibrated, KEEP-utility baseline captured. **One defect surfaced (AORDL validator) folded into Stage 1.** Ready for Stage 1 (PROP-034).
