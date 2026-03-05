# ROME-PROP-034: Phase Plugin Consolidation

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-034 |
| **Title** | Phase Plugin Consolidation — Retire Phase Plugins, Elevate Content to Robot Plugins and Framework Standards |
| **Status** | Implemented |
| **Author** | Archie |
| **Created** | 2026-03-05T00:00:00Z |
| **Implemented** | 2026-03-05T00:00:00Z |
| **Targets** | `ROME/rome-core/lib/`, `ROME/robot-plugins/`, `ROME/rome-core/docs/` |

---

## Problem Statement

ROME currently maintains two parallel plugin systems:

- **Phase plugins** (`rome-core/lib/rome-p*`) — methodology layer: skills, workflows, format specifications, validation rules
- **Robot plugins** (`robot-plugins/`) — agent layer: identity, modes, procedures, skills

ROME-PROP-019 and ROME-PROP-020 gave robot plugins their own `modes/`, `procedures/`, and `skills/` directories. Since that time, robot plugins have the full operational capability to carry their own phase-specific instructions. Phase plugins have not been retired and now create a redundant and ambiguous layer.

### Specific Defects

1. **Dual ownership of operational content.** Phase plugin workflow steps and robot plugin mode docs both describe how each phase executes. Two sources that must be kept in sync.

2. **Shared format specifications have no neutral home.** The AORDL 13-field schema, approved atomic verbs, anti-pattern rules, TRACEABILITY.md format, 7-link traceability chain, and gate decision YAML format are defined inside phase plugins — content used by multiple robots. Any robot needing these specs must reference or duplicate phase plugin content.

3. **Phase plugins obscure robot ownership.** Phase plugins imply a methodology layer independent of robots. In practice, each phase has a clear robot owner: Talib (P1/P2), PMA (P3), Lucien (P4), Ashok/Reena/Charlie (P5), Sarah (QA). The phase plugin layer adds indirection without adding governance value.

4. **P5 coordination logic is split.** ROME-PROP-030 created `roma/procedures/p5-capability-coordination.md` for Roma. The P5 phase plugin (`rome-p5-generation`) still carries a parallel description of the same dependency coordination mechanism.

5. **Content type conflation.** Phase plugins carry two fundamentally different types of content mixed together:
   - **Type 1 — Operational instructions** (how to execute the phase): belongs in robot mode/procedure docs
   - **Type 2 — Framework format specifications** (what each artifact must contain): belongs in neutral framework standard docs consumed by all robots

---

## Root Cause

Phase plugins predate robot plugin operational maturity (PROP-019/020). They were the only place to put phase-specific knowledge. Post-PROP-019/020, robot plugins can carry all operational content. Phase plugins now serve as an informal substitute for framework standard documents that should exist independently.

---

## Proposed Solution

Two-track consolidation:

**Track A — Framework Standard Documents**
Elevate shared format specifications from phase plugins into dedicated framework governance documents. These become the single source of truth consumed by all robots.

**Track B — Robot Plugin Absorption**
Migrate operational workflow content from phase plugins into the owning robot's `modes/` and `procedures/` directories. Phase plugins are then retired.

---

## Track A: Framework Standard Documents to Create

### A1 — AORDL Standard Document

**Source:** `rome-p1-aordl/` content
**New document:** `ROME/rome-core/docs/standards/aordl-standard.md`
**UID:** Assign during implementation (ROME-STD-### category or ROME-GOV-###)

Contains:
- AORDL 13-field schema with field semantics and valid values
- 20 approved atomic verbs (authoritative list)
- Anti-pattern taxonomy: UI language / technical jargon / generic actors / ambiguous verbs — with examples of each
- Validation mode definitions: STRICT / GUIDED / PERMISSIVE with precise pass/fail criteria
- BDD transformation mapping table (AORDL field → Gherkin element)
- GATE-P1 blocking checklist (8 criteria)

**Consumers:** Talib (create + validate), Sarah (gate validation)

---

### A2 — Analysis Standard Document

**Source:** `rome-p2-analysis/` content
**New document:** `ROME/rome-core/docs/standards/analysis-standard.md`
**UID:** Assign during implementation

Contains:
- 8-dimension analysis framework (dimension names + AORDL field → dimension mapping)
- Complexity scoring algorithm (Low 1-10 / Medium 11-20 / High 21+, with scoring inputs)
- Cross-requirement dependency taxonomy: sequential / conditional / referential
- AORDL → P2 artifact transformation table (REQ → FUNC, Actor → User Role, etc.)
- GATE-P2 blocking checklist

**Consumers:** Talib (analysis execution), Sarah (gate validation)

---

### A3 — Code Organisation Standard Document

**Source:** `rome-p5-generation/` content
**New document:** `ROME/rome-core/docs/standards/code-organisation-standard.md`
**UID:** Assign during implementation

Contains:
- Feature-based directory structure specification (`features/[feature_name]/`)
- TRACEABILITY.md mandatory requirement and format specification
- 7-link traceability chain definition (forward and backward)
- Dependency execution order rationale (Ashok → Reena → Charlie)
- Activity log dependency query pattern (how Reena/Charlie detect predecessor completion)

**Consumers:** Ashok, Reena, Charlie (code generation), Sarah (traceability validation at GATE-P5)

---

### A4 — Gate Standard Document

**Source:** `rome-qa/` content
**New document:** `ROME/rome-core/docs/standards/gate-standard.md`
**UID:** Assign during implementation

Contains:
- Gate decision YAML report format (complete schema)
- Sarah's blocking criteria vs. recommendation criteria (exact distinction)
- Complete gate matrix: GATE-P1 through GATE-P5 — transition, reviewer, decision options
- CR verification checklist (post-implementation traceability checks)
- Per-gate validation checklists (P1 through P5)

**Consumers:** Sarah (gate execution), Roma (gate coordination), all robots (understanding gate expectations)

---

## Track B: Robot Plugin Absorption

### B1 — Talib absorbs P1 + P2 operational content

**Source:** `rome-p1-aordl/` and `rome-p2-analysis/` workflows
**Target:** `robot-plugins/talib/`

New/updated files:
- `modes/P1-ingest.md` — updated to reference AORDL Standard (A1) for schema/rules; absorb P1 workflow steps, entry/exit criteria, output artifact list
- `modes/P2-analysis.md` — updated to reference Analysis Standard (A2); absorb P2 workflow steps, entry/exit criteria, output artifact list
- `procedures/aordl-validation.md` — extracted: STRICT/GUIDED/PERMISSIVE validation procedure
- `procedures/bdd-generation.md` — extracted: BDD scenario generation from AORDL

Skills remain in Talib's `skills/` directory (validate-aordl, create-aordl-requirement, transform-aordl-to-bdd). Phase plugin skill files retire.

---

### B2 — PMA absorbs P3 operational content

**Source:** `rome-p3-design/` workflows
**Target:** `robot-plugins/pma/`

New/updated files:
- `modes/P3-design.md` — absorb 20-step P3 workflow (Stage 1 Foundation, Stage 2 Core Design, Stage 3 Finalisation); entry/exit criteria; output artifact list
- `procedures/clara-activation.md` — extracted: Clara activation criteria, PMA→Roma→Clara handoff protocol, input package specification
- P3 design skills (12 skills) migrate to `skills/` directory with SKILL.md files

---

### B3 — Lucien absorbs P4 operational content

**Source:** `rome-p4-config/` workflows
**Target:** `robot-plugins/lucien/`

New/updated files:
- `modes/P4-config.md` — absorb 13-step P4 workflow; scaffolding boundary rule (root only); CI/CD platform support table; entry/exit criteria; output artifact list
- `procedures/workspace-scaffolding.md` — extracted: per-platform initialisation commands, data workspace structure preparation for Ashok
- `procedures/cicd-configuration.md` — extracted: 4-stage pipeline spec, platform-specific file paths
- P4 skills (8 skills) migrate to `skills/` directory

---

### B4 — Ashok / Reena / Charlie absorb P5 operational content

**Source:** `rome-p5-generation/` robot-specific workflow sections
**Target:** Each robot's plugin directory

Each robot:
- `modes/P5-generation.md` — absorb robot-specific workflow; reference Code Organisation Standard (A3) for feature structure and TRACEABILITY.md format; reference activity log query pattern for dependency checking
- P5 skills migrate to `skills/` directory (generate-database-schema, etc.)

Roma's `procedures/p5-capability-coordination.md` (created in PROP-030) absorbs the cross-robot coordination protocol. P5 phase plugin coordination content retires.

---

### B5 — Sarah absorbs QA operational content

**Source:** `rome-qa/` workflows
**Target:** `robot-plugins/sarah/`

New/updated files:
- `modes/QA-validator.md` — reference Gate Standard (A4) for formats; absorb per-gate validation workflows; absorb CR verification workflow
- Gate Standard (A4) becomes Sarah's authoritative reference — Sarah does not duplicate it internally

---

## Phase Plugin Retirement

After Track A and Track B are complete, the following phase plugins are retired:

| Plugin | Status after consolidation |
|--------|---------------------------|
| `rome-p0-bootup` | Retire — Bootstrap robot ROBOT.md absorbs mechanical setup |
| `rome-p1-aordl` | Retire — content split: schema → A1, workflows → Talib |
| `rome-p2-analysis` | Retire — content split: framework → A2, workflows → Talib |
| `rome-p3-design` | Retire — content split: design skills → PMA |
| `rome-p4-config` | Retire — content split: config skills → Lucien |
| `rome-p5-generation` | Retire — content split: standards → A3, per-robot → B4, coordination → Roma |
| `rome-qa` | Retire — content split: gate standard → A4, workflows → Sarah |

Retirement procedure: move to `rome-core/lib/_archive/` with retirement notice referencing ROME-PROP-034.

---

## What Is NOT Changing

- Robot identities, personas, and governance baselines — unchanged
- AORDL requirement format as used in project ARTIFACTS — unchanged
- Gate sequence (GATE-P1 through GATE-P5) — unchanged
- Activity log format — unchanged
- P5 parallel execution dependency chain (Ashok → Reena → Charlie) — unchanged, now formally specified in A3

---

## Benefits

| Benefit | Description |
|---------|-------------|
| Single source of truth | AORDL schema, approved verbs, anti-patterns, TRACEABILITY.md format, gate decision format — each defined once |
| Reduced robot context load | Robots reference framework standard docs rather than loading large phase plugin files |
| Clear ownership | Each phase's operational content lives with the robot that executes it |
| No dual maintenance | Changes to AORDL schema update one document, not one phase plugin + multiple robot modes |
| Eliminates ambiguous layer | Phase plugins implied a methodology authority separate from robots — this is removed |

---

## Implementation Sequence

| Step | Action | Dependency |
|------|--------|-----------|
| 1 | Create Track A framework standard documents (A1–A4) | None |
| 2 | Register new document UIDs in uid-registry.md | Step 1 |
| 3 | Update Talib plugin (B1) — reference A1, A2 | Step 1 |
| 4 | Update PMA plugin (B2) | Step 1 |
| 5 | Update Lucien plugin (B3) | Step 1 |
| 6 | Update Ashok/Reena/Charlie plugins (B4) — reference A3 | Step 1 |
| 7 | Update Sarah plugin (B5) — reference A4 | Step 1 |
| 8 | Verify no robot references phase plugin paths | Steps 3–7 |
| 9 | Archive phase plugins | Step 8 |
| 10 | Update uid-registry.md with retired plugin entries | Step 9 |
| 11 | Bump framework version (MINOR) | Step 10 |

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should framework standard docs use a new UID category (ROME-STD-###) or extend ROME-GOV-###? | OPEN |
| 2 | Does Bootstrap robot ROBOT.md already fully cover P0 scaffolding, or does P0 content require a new procedure file? | OPEN |

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-03-05T00:00:00Z | Initial draft — phase plugin consolidation via framework standards + robot plugin absorption |
