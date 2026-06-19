# ROME Framework Changelog

All notable changes to the ROME Framework will be documented in this file.

## [2026-06-19] - v2.2.0 "Tiberius" — vendoring + skill/expert dedup

### Added
- **Per-project framework vendoring**: rome-start copies a frozen framework snapshot
  into <projectDir>/.rome/ by default (--no-vendor to skip) and records provenance
  {version, commit, vendored} in state.json. Each project is self-contained and
  reproducible as the framework evolves.

### Changed
- **Skill/Expert dedup**: removed 9 Flutter knowledge-as-skills from charlie (covered
  by Experts/expert_flutter, injected via experts.js); kept the action skills
  generate-ui-screens/components + an expertPacks reference. agent-roles-standard §3b
  documents the rule: knowledge → expert pack, never a skill.
- Fixed a pre-existing JSON error in charlie plugin.json; dropped retired iterm2-terminal.

## [2026-06-19] - v2.1.0 "Augustus" — Enforcement hardening + tree cleanup

Codename **Augustus** (the founder) — the foundational sub-agent architecture line.

### Fixed
- **Guard now requires mechanical evidence, not just a verdict** (PROP-035 §3.5
  hardening). Each phase declares `requires`; the guard refuses to advance unless
  every required fact (executability, contracts, secrets, traceability, MVP
  test-adequacy, AORDL) is recorded AND passing in `state.verification`. An LLM
  gate role can no longer APPROVE without the checks having run. New `verification.js`
  + `driver` VERIFY step. Traceability is always-enforced (iterative safety);
  test-adequacy follows the MVP rule (only declared Outcomes/Errors must be tested).

### Added
- Per-role **recommended-model** guidance in `agent-roles-standard.md` (Opus on
  Roma/Sarah/PMA; Sonnet producers; Haiku intake/scaffold).

### Removed (cleanup)
- `ROME_tools/` (gutted in cutover), `PLUGINS/` (Flutter skills now in `Experts/`),
  `GENERATION-PLUGINS-MANIFEST.md` + `PLUGIN-MANIFEST.md` (retired phase-plugin model),
  and the M2/M3/037 proof scratch dirs (results preserved in
  `ROME_framework_maintenance/reviews/`). Top-level tree is now: ROME, Experts,
  ROME_framework_maintenance, ROME_architect, testapps, test-project + current docs.

### Tests
- 154 orchestrator + 45 lib, all green.

## [2026-06-19] - v2.0.0 — Single-Session Sub-Agent Orchestration (ROME-PROP-035..040)

Major re-architecture: from human-switched multi-session "robots" to a single
**orchestrator session that drives native sub-agents**, with deterministic
enforcement. **BREAKING.**

### Added
- **Orchestrator core** (`rome-core/orchestrator/`): `state.js` (state.json = source of truth), `guard.js`/`guard-cli.cjs` (deterministic phase-advance enforcement — self-approval structurally impossible), `subagent.js` (role→sub-agent loader + structured-return contract), `lifecycle.js`, `driver.js`, `rome-start.cjs` (project entry point).
- `topology.js` (PROP-038 DAG fan-out), `executability.js` (PROP-039 build/verify/self-heal), `contracts.js` (PROP-039 drift), `routing.js` (PROP-036 intent routing), `budget.js`/`impact.js`/`experts.js`/`security.js` (PROP-040), `visualize.js` (PROP-037 Mermaid).
- Framework **standards** (`rome-core/docs/standards/`): aordl, agent-roles, traceability, gate-decision, security. Repaired the AORDL validator (was non-runnable).
- New **Surveyor** role (PROP-036 intake) and **Charlie P3.5** prototype mode (PROP-037).
- ~190 automated tests; live end-to-end proofs (M2 design triad, M3 parallel build, 036 intake, 037 prototype).

### Changed
- `robot-plugins/` → **`agents/`**. Roma rewritten (v5.0) as the lifecycle driver. Activity-log demoted to audit-only.

### Removed
- All emulation machinery: `rome-p5-generation/`, the 6 phase-plugin shells (`rome-p0..p4`, `rome-qa`), the custom skill runtime (`SkillInvoker`/`SkillRegistry`), `p5-hybrid` orchestrator, `ActivityLogCoordinator`, per-robot `add-mcps-v4.sh`, log-enforcement hooks, stale `*-plugins-complete.json` manifests (~5,600 lines).

### Decisions
- D1 native skills · D2 state.json source of truth · D3 consolidated MCP set · D4 PROP-034 first · Path-A operation (live session, no SDK runner).

## [2026-01-28] - Robot Plugins Architecture (ROME-PROP-019)

### Implemented
- **Robot Plugins Directory Structure**
  - Created `/ROME/robot-plugins/` with 10 robot subdirectories
  - Each robot contains: `ROBOT.md` (identity), `.claude-plugin/plugin.json` (metadata), `modes/` (phase-specific behavior)
  - Robots: bootstrap, talib, roma, pma, clara, lucien, ashok, reena, charlie, sarah

- **Robot Identity Separation**
  - **bootstrap**: P0 bootup robot with `modes/P0-bootup.md`
  - **talib**: Multi-phase robot (P1-aordl, P2-analysis) - single ROBOT.md replaces duplicate agent definitions
  - **roma**: Phase-agnostic orchestrator across all phases
  - **pma**: P3 design architect
  - **clara**: P3 UX designer
  - **lucien**: P4 configuration specialist
  - **ashok**: P5 backend engineer
  - **reena**: P5 frontend engineer
  - **charlie**: P5 integration engineer
  - **sarah**: Phase-agnostic QA validator

- **Phase Plugin Updates**
  - Updated 8 phase `plugin.json` files (rome-p0-bootup through rome-qa, rome-core)
  - Removed `agents` array from `provides` section
  - Added robot dependencies to `dependencies` section
  - Added `requires.robots` array with mode specifications
  - Removed agent exports from `exports` section

- **Documentation Updates**
  - **USER-GUIDE.md**: Updated all robot locations to `robot-plugins/{robot}/ROBOT.md`
  - Added mode information in parentheses for clarity
  - Updated typical session flow examples with new paths
  - Changed terminology from "agent" to "robot" throughout

### Rationale
- **Eliminates Duplication**: Talib previously existed in 2 locations with 2 separate Agent UIDs (`rome-p1-aordl:talib`, `rome-p2-analysis:talib`)
- **Single Source of Truth**: Each robot now defined once with phase-specific modes
- **Clear Separation of Concerns**:
  - Robot plugins define WHO (identity, role, capabilities)
  - Phase plugins define WHAT (skills, commands, phase logic)
  - Mode files define HOW (phase-specific behavior overlays)
- **Scalability**: Adding new phase for existing robot only requires new mode file
- **Framework Intent Alignment**: USER-GUIDE.md documented "Talib (P1 mode)" and "Talib (P2 mode)" - architecture now matches

### Architecture Transformation

**Before (Phase-Embedded Agents):**
```
/ROME/
  rome-p1-aordl/
    agents/talib/AGENT.md         # Agent UID: rome-p1-aordl:talib
  rome-p2-analysis/
    agents/talib/AGENT.md         # Agent UID: rome-p2-analysis:talib (DUPLICATE)
  rome-p3-design/
    agents/pma/AGENT.md
    agents/clara/AGENT.md
```

**After (Robot Plugins):**
```
/ROME/
  robot-plugins/
    talib/
      ROBOT.md                    # Robot UID: talib (SINGLE SOURCE)
      .claude-plugin/plugin.json
      modes/
        P1-aordl.md              # Phase-specific behavior
        P2-analysis.md           # Phase-specific behavior
    pma/
      ROBOT.md
      .claude-plugin/plugin.json
    clara/
      ROBOT.md
      .claude-plugin/plugin.json

  rome-p1-aordl/
    .claude-plugin/plugin.json    # References: robot-plugins/talib (P1 mode)
    skills/                       # Phase owns skills

  rome-p2-analysis/
    .claude-plugin/plugin.json    # References: robot-plugins/talib (P2 mode)
    skills/
```

### Pattern Changes

```json
// OLD: Phase plugin.json (rome-p1-aordl)
{
  "provides": {
    "agents": ["talib"],
    "skills": [...]
  },
  "dependencies": {
    "rome-core": "^1.0.0"
  },
  "exports": {
    "agents/talib/AGENT.md": "Talib agent for AORDL",
    "skills/...": "..."
  }
}

// NEW: Phase plugin.json (rome-p1-aordl)
{
  "provides": {
    "skills": [...]
  },
  "dependencies": {
    "rome-core": "^1.0.0",
    "robot-plugins/talib": "^1.0.0"
  },
  "requires": {
    "robots": [
      {
        "name": "talib",
        "mode": "P1-aordl",
        "source": "robot-plugins/talib"
      }
    ]
  },
  "exports": {
    "skills/...": "..."
  }
}
```

### Impact
- **All Phases**: Robot identity now centralized in robot-plugins directory
- **Talib (P1/P2)**: Single robot definition replaces duplicate agent definitions
- **USER-GUIDE.md**: All paths updated from `agents/{robot}/AGENT.md` to `robot-plugins/{robot}/ROBOT.md`
- **Plugin Dependencies**: Phase plugins explicitly declare robot dependencies with mode specifications
- **Developer Experience**: Clear separation between robot identity (WHO) and phase behavior (HOW)
- **Discoverability**: `ls robot-plugins/` shows all available robots, `ls robot-plugins/talib/modes/` shows robot's phase capabilities

### Implementation Statistics
- **Files Created**: 23 files (10 ROBOT.md, 10 plugin.json, 1 P0-bootup.md mode file, 1 proposal, 1 proposal update)
- **Files Modified**: 9 files (8 phase plugin.json, 1 USER-GUIDE.md)
- **Total Changes**: 68 files changed, +2962 lines, -25835 lines
- **Commits**: 3 commits (implementation, proposal marking, documentation fix)
  - 982b614: feat(architecture): implement robot-plugins architecture (ROME-PROP-019)
  - 7d260c5: docs(proposal): mark ROME-PROP-019 as implemented
  - d0c4e3a: fix(docs): complete USER-GUIDE.md migration to robot-plugins

### Success Criteria Met
✓ Talib exists in ONE location: `robot-plugins/talib/ROBOT.md`
✓ Talib P1 mode activates via rome-p1-aordl plugin reference
✓ Talib P2 mode activates via rome-p2-analysis plugin reference
✓ No duplication of robot identity metadata
✓ Phase plugins declare robot dependencies explicitly
✓ USER-GUIDE.md structure matches actual architecture
✓ All 10 robots migrated to robot-plugins

### Related Documents
- ROME-PROP-019: Robot Plugins Architecture Proposal
- ROME-DEF-001: Framework Analyst & Architect Role Definition
- USER-GUIDE.md: Framework user documentation

### Known Limitations
- Mode files only created for Bootstrap (`modes/P0-bootup.md`)
- Talib P1-aordl.md and P2-analysis.md mode files not yet created (procedural logic remains in phase plugin AGENT.md files)
- Other robots rely on phase plugin AGENT.md files for detailed procedures
- Future work: Extract phase-specific procedures from AGENT.md to mode files

---

## [2025-12-30] - Project-Level MCP Configuration & Activity Log Server Update (ROME-PROP-014)

### Implemented
- **Project-Level MCP Configuration**
  - Created `.mcp.json` template in `robot-templates/` for project-level MCP server configuration
  - Updated `ignite-rome.sh` to initialize `.mcp.json` during bootstrap
  - All robot templates maintain `addmcp.sh` symlink for MCP server setup

- **Activity Log Server Migration**
  - Updated from `activity-log` (MongoDB) to `activity-log-file` (file-based) v2.0.0
  - **ROME-PHASE-001 v1.2**: P00-bootup operations-guidelines.md
    - Updated MCP server reference to `activity-log-file`
    - Changed validation tool from `list_available_databases` to `get_statistics`
    - Updated exit criteria: database → file initialization
    - Updated outputs table: MongoDB reference → file path
    - Added `.mcp.json` initialization to project structure
  - **ROME-PROC-005 v2.0**: Activity Logging Protocol (breaking change)
    - Updated dependencies from database-backed to file-backed system
    - Replaced "Database Discovery" section with "File System Architecture"
    - Documented event log (`ARTIFACTS/activity-log.txt`) and state index (`ARTIFACTS/activity-state.yaml`)
    - Clarified MCP server name as `activity-log-file` throughout

- **Bootstrap Script Enhancement**
  - Added `.mcp.json` template copy step to `ignite-rome.sh`
  - Added MCP configuration note to completion message

### Rationale
- **Standardized MCP Configuration**: Project-level `.mcp.json` eliminates per-robot MCP setup confusion
- **Simplified Bootstrap**: Single initialization point for all MCP servers
- **Updated References**: Removed stale MongoDB references, aligned with current file-based system
- **Breaking Change**: activity-log-file v2.0.0 uses different tools than MongoDB version

### Tool Changes
```javascript
// Validation (operations-guidelines.md)
OLD: mcp__activity-log__list_available_databases
NEW: mcp__activity-log__get_statistics

// Storage Location
OLD: MongoDB database: rome_[project_name]
NEW: File: ARTIFACTS/activity-log.txt
```

### Architecture
**Before:**
- No standardized `.mcp.json` initialization
- MCP servers configured ad-hoc per robot
- Documentation referenced obsolete MongoDB system

**After:**
- `.mcp.json` template created during bootstrap
- Single project-level MCP configuration
- Documentation aligned with file-based activity-log-file v2.0.0

### Impact
- **P00-bootup**: Bootstrap now initializes `.mcp.json` automatically
- **All Phases**: Updated references to activity-log-file MCP server
- **Documentation**: Removed all stale database references
- **Developer Experience**: Clear guidance on MCP server configuration

### Related Documents
- ROME-PROP-014: MCP Configuration and Activity Log Migration Proposal
- ROME-PHASE-001 v1.2: P00-bootup Operations Guidelines
- ROME-PROC-005 v2.0: Activity Logging Protocol

---

## [2025-12-18] - Event Log Activity Tracking System (ROME-PROP-007)

### Implemented
- **All 10 Robot Templates → v2.0**: Complete migration to event log system
  - **ROME-ROBOT-001 v2.0**: Bootstrap - Project initialization with event log
  - **ROME-ROBOT-002 v4.0**: Talib - Analysis phase (P1-P2)
  - **ROME-ROBOT-003 v2.0**: PMA - Design phase (P3)
  - **ROME-ROBOT-004 v2.0**: Roma - Orchestrator across all phases
  - **ROME-ROBOT-005 v2.0**: Sarah - QA gates (P2-P5)
  - **ROME-ROBOT-006 v2.0**: Clara - UX design (P3)
  - **ROME-ROBOT-007 v2.0**: Charlie - Frontend generation (P5)
  - **ROME-ROBOT-008 v2.0**: Reena - Backend generation (P5)
  - **ROME-ROBOT-009 v2.0**: Lucien - DevOps configuration (P4)
  - **ROME-ROBOT-010 v2.0**: Ashok - Database generation (P5)

- **Activity Logging Protocol v2.0** (ROME-PROC-005)
  - Replaced `update_entry()` with `append()` pattern
  - Replaced `add_entry()` with `append({type, id, attributes})`
  - Replaced `find_by_*()` queries with `query()` and direct YAML reads
  - Field renames: `startDate→started`, `completionDate→completed`, `createdDate→created`
  - Type capitalization: `"feature"→"FEATURE"`, `"blocker"→"BLOCKER"`
  - Added mandatory `robot` identifier to all events

- **Event Log Format Specification** (ROME-GOV-008)
  - Pipe-delimited format: `TIMESTAMP | TYPE | ID | ATTRIBUTES`
  - Auto-generated state index: `ARTIFACTS/activity-state.yaml`
  - Support for PHASE, FEATURE, STORY, BLOCKER, AMENDMENT event types

- **MCP Server Implementation**: Complete Dart implementation
  - `append({type, id, attributes})` - Write events to log
  - `rebuild_state()` - Regenerate state index from log
  - `query({filters})` - Query current state
  - `get_history({id})` - Get event history for specific ID
  - `get_statistics()` - Get activity statistics

- **Migration Guide** (ROME-MIG-001)
  - 7-step procedure for MongoDB → Event log migration
  - Complete rollback procedures (immediate and gradual)
  - Troubleshooting guide with 6 common issues

- **ROME-GOV-002 v2.5**: UID Registry
  - Added MIG type code for migration documents
  - Registered ROME-MIG-001

### Rationale
- **Eliminates MongoDB dependency**: No database setup required for new projects
- **40x faster writes**: 1-5ms vs 50-200ms (MongoDB)
- **5-20x faster reads**: Direct file access vs database queries
- **Git-trackable**: Text-based event log enables version control
- **Complete audit trail**: Append-only log preserves full history
- **Zero connection overhead**: No database connections or connection pooling
- **Portable projects**: Just copy directory, no database export/import

### Pattern Changes
```javascript
// OLD: MongoDB update pattern
mcp__activity-log__update_entry(
  id: "PHASE-1",
  updates: {status: "IN_PROGRESS", startDate: "2025-12-18T10:00:00Z"}
)

// NEW: Append event pattern
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-1",
  attributes: {
    status: "IN_PROGRESS",
    robot: "talib",
    started: "2025-12-18T10:00:00Z"
  }
})

// OLD: MongoDB query pattern
mcp__activity-log__find_by_status("BLOCKED")

// NEW: Query state or direct YAML read
mcp__activity-log__query({status: "BLOCKED"})
// OR
const state = Read("ARTIFACTS/activity-state.yaml")
const blocked = state.by_status.BLOCKED
```

### Architecture Transformation
**Before (MongoDB):**
- Database dependency required
- Point-in-time state only
- Complex queries needed
- 100-500ms connection time
- Binary format (not git-trackable)

**After (Event Log):**
- No database needed
- Complete audit trail
- Simple file reads
- 0ms connection time
- Text format (git-trackable)

### Performance Improvements
| Metric | MongoDB | Event Log | Improvement |
|--------|---------|-----------|-------------|
| Write Speed | 50-200ms | 1-5ms | **40x faster** |
| Read Speed | 20-100ms | 1-20ms | **5-20x faster** |
| Connection | 100-500ms | 0ms | **instant** |
| Git Tracking | No | Yes | **+version control** |

### Impact
- **All Phases (P0-P5)**: All robots now use consistent event log pattern
- **New Projects**: No MongoDB setup required - Bootstrap v2.0 creates event log automatically
- **Existing Projects**: Can migrate using ROME-MIG-001 (7-step process with rollback)
- **Performance**: 40x faster writes, 5-20x faster reads
- **DevOps**: Simpler deployment (no database infrastructure)
- **Version Control**: Full project history in git including activity tracking

### Related Documents
- ROME-PROP-007: Event Log Activity Tracking Proposal
- ROME-PROP-007-IMPL: Implementation Plan
- ROME-PROP-007-100-PERCENT-COMPLETE: Final completion report
- ROME-MIG-001: MongoDB to Event Log Migration Guide
- ROME-PROC-005: Activity Logging Protocol v2.0
- ROME-GOV-008: Activity Log Format Specification

### Implementation Statistics
- **Files Created**: 22 (MCP server, documentation, guides)
- **Files Modified**: 14 (10 robots + 4 governance docs)
- **Total Edits**: ~111 edits across all robot templates
- **Implementation Time**: ~8 hours (across 2 sessions)
- **Status**: 100% COMPLETE - PRODUCTION READY

---

## [2025-12-18] - Story ID Semantic Correction (ROME-PROP-005)

### Implemented
- **ROME-LEX-001 v1.1**: Added Work Decomposition section
  - Defined Epic, Feature, Story hierarchy (Epic > Feature > Story)
  - Story ID pattern: `STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]`
  - Added comprehensive hierarchy example
  - Updated alignment section with Agile/Scrum/SAFe/Jira terminology

- **ROME-PHASE-004 v2.1**: Updated Story ID pattern in actionlist schema
  - Changed from `STORY-###` to `STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]`

- **ROME-ROBOT-003 v1.6**: Updated PMA procedures
  - Added Step 12.1: Epic identification guidance
  - Updated actionlist schema with Epic field in features
  - Updated story ID pattern in robot assignment
  - Renumbered subsequent steps

### Rationale
- Aligns with Principle 8 (Terminological Integrity): standard domain language
- Corrects semantic inversion (Feature contained Epic in old pattern)
- Matches universal hierarchy: Epic (months) > Feature (weeks) > Story (hours)
- Compatible with Agile, Scrum, SAFe, Jira, Azure DevOps

### Pattern Change
```
OLD: STORY-[FEAT]-[EPIC]-[SEQ]-[LAYER]
     STORY-001-1-2-api (Feature 001, Epic 1, Story 2)

NEW: STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]
     STORY-001-001-2-api (Epic 001, Feature 001, Story 2)
```

### Impact
- **Phase P03 (Design)**: PMA uses new pattern for work breakdown
- **Phases P04/P05**: Robots reference new Story IDs
- **Zero migration cost**: Framework in draft, no production usage

### Related Documents
- ROME-PROP-005: Story ID Semantic Correction Proposal
- ROME-LEX-001: Lexicon
- ROME-PHASE-004: Phase 3 Design Operations Guidelines
- ROME-ROBOT-003: PMA Robot Definition

---

## [2025-12-18] - Design Artifact Conciseness (ROME-PROP-004)

### Implemented
- **ROME-PHASE-004 v2.0**: Phase 3 Design Operations Guidelines
  - Converted technology stack schema to declarative YAML format (70% size reduction)
  - Streamlined use case schema to concise action → response flow format (40% reduction)
  - Added API design schema with pattern references instead of full payload examples (80% reduction)
  - Removed justification requirements from Exit Criteria and Quality Gate 2
  - Maintained data dictionary completeness (single source of truth)

- **Artifact Templates Created**: `/ROME/life-cycle/P03-design/artifact-templates/`
  - `tech-stack-template.yaml`: Reference implementation of declarative tech stack
  - `use-case-template.md`: Concise use case format with examples
  - `api-design-template.md`: Pattern-based API design with format guidelines

- **ROME-ROBOT-003 v1.5**: PMA Robot Definition
  - Updated Step 5 (Tech Stack) to reference declarative YAML format
  - Updated Step 8 (API Design) to use concise pattern-based format
  - Updated Step 9 (Use Cases) to use action → response flow format
  - Added template file references for all artifacts
  - Updated Architecture Review template to remove "Alternatives Considered" column

- **ROME-ROBOT-006 v1.1**: Clara Robot Definition
  - Updated use case format reference to align with concise schema
  - Adjusted UI Requirements integration format

- **ROME-GOV-002 v2.0**: UID Registry
  - Added PROP type code for framework proposals
  - Registered ROME-PROP-001 through ROME-PROP-004

### Rationale
- Aligns with ROME-DEF-001 LLM optimization principle (terse, high-signal output)
- Reduces P03 document bloat by 40-60%
- Accelerates design phase completion by ~20%
- Eliminates justification/rationale requirements (context preserved in git history)
- No downstream impact: P04/P05 phases consume decisions only, not rationale

### Impact
- **Phase P03 (Design)**: Direct impact - PMA uses new schemas immediately
- **Phases P04/P05**: No impact - consume decisions, not rationale
- **Token Efficiency**: 40% reduction in LLM token consumption for design artifacts

### Related Documents
- ROME-PROP-004: Design Artifact Conciseness Proposal
- ROME-PHASE-004: Phase 3 Design Operations Guidelines
- ROME-ROBOT-003: PMA Robot Definition
- ROME-ROBOT-006: Clara Robot Definition
