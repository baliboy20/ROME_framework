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

## Status
Stage 0 reference audits complete; all removals validated as dependency-safe. Ready for Stage 1 (PROP-034). No baseline fixture run captured yet (Stage 0.4 still pending — requires a working current framework run).
