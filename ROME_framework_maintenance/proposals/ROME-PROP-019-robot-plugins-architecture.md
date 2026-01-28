# ROME-PROP-019: Robot Plugins Architecture

| Field | Value |
|-------|-------|
| **Proposal ID** | ROME-PROP-019 |
| **Title** | Robot Plugins Architecture - Separate Robot Identity from Phase Behavior |
| **Status** | Draft |
| **Created** | 2026-01-28 |
| **Updated** | 2026-01-28 |
| **Version** | 1.0 |
| **Author** | Framework Analyst & Architect |
| **Priority** | HIGH |
| **Complexity** | Medium |
| **Dependencies** | All phase plugins (rome-p0 through rome-p5, rome-qa) |
| **Scope** | Restructure robot definitions from phase-embedded to standalone robot-plugins |

---

## Problem Statement

**Current Architecture Issue:**

Robots are embedded within phase plugins, creating **duplication and tight coupling** when a single robot works across multiple phases.

**Example: Talib (Requirements Engineer)**

Currently exists in TWO locations:
- `/ROME/rome-p1-aordl/agents/talib/AGENT.md` (Agent UID: `rome-p1-aordl:talib`)
- `/ROME/rome-p2-analysis/agents/talib/AGENT.md` (Agent UID: `rome-p2-analysis:talib`)

**Issues:**

1. **Identity Duplication** - Same robot defined twice with different UIDs
2. **Metadata Redundancy** - Robot metadata (name, role, identity) duplicated across phases
3. **Version Management Confusion** - Which version is canonical? P1 or P2?
4. **Unclear Ownership** - Is Talib a P1 robot or P2 robot? (Answer: Neither - Talib is a Requirements Engineer)
5. **Scalability Problem** - If Talib works in P3, need THIRD definition
6. **Framework Intent Violation** - USER-GUIDE.md explicitly documents "Talib (P1 mode)" and "Talib (P2 mode)" - same robot, different modes

**Evidence from USER-GUIDE.md:226-228:**

```markdown
| Agent | Phase | Use For |
| Talib | P1    | AORDL requirements capture |
| Talib | P2    | Requirements analysis |
```

Framework treats Talib as ONE robot with MULTIPLE phase assignments, but current architecture forces separate definitions.

---

## Root Cause Analysis

**Plugin Architecture Assumption:**

Phase plugins were designed assuming **one-to-one mapping** between robots and phases:
- P1 has Talib
- P3 has PMA + Clara
- P5 has Ashok, Reena, Charlie

This works for phase-specific robots (PMA, Clara, Ashok, Reena, Charlie) but **breaks for cross-phase robots** (Talib).

**Talib's Reality:**

Talib is a **Requirements Engineer** who works in:
- **P1 (AORDL mode)** - Transform raw sponsor materials into AORDL requirements
- **P2 (Analysis mode)** - Decompose AORDL requirements into features, stories, entities

Same robot, same core skills, different phase-specific behaviors.

---

## Proposed Solution

**Separate Robot Identity from Phase Behavior**

Create `robot-plugins/` directory structure where robot identity lives independently, with phase plugins providing phase-specific behavior overlays.

### Proposed Structure

```
/ROME/
  robot-plugins/
    talib/
      .claude-plugin/
        plugin.json           # Robot plugin metadata
      ROBOT.md                # Core robot identity & baseline behavior
      modes/
        P1-aordl.md           # P1-specific instructions/skills
        P2-analysis.md        # P2-specific instructions/skills
    pma/
      .claude-plugin/
        plugin.json
      ROBOT.md                # Architecture & design robot
      modes/
        P3-design.md
    clara/
      .claude-plugin/
        plugin.json
      ROBOT.md                # UX designer robot
      modes/
        P3-design.md
    roma/
      .claude-plugin/
        plugin.json
      ROBOT.md                # Orchestrator (phase-agnostic)
    lucien/
      .claude-plugin/
        plugin.json
      ROBOT.md
      modes/
        P4-config.md
    ashok/
      .claude-plugin/
        plugin.json
      ROBOT.md
      modes/
        P5-generation.md
    reena/
      .claude-plugin/
        plugin.json
      ROBOT.md
      modes/
        P5-generation.md
    charlie/
      .claude-plugin/
        plugin.json
      ROBOT.md
      modes/
        P5-generation.md
    sarah/
      .claude-plugin/
        plugin.json
      ROBOT.md                # QA validator (phase-agnostic)
    bootstrap/
      .claude-plugin/
        plugin.json
      ROBOT.md                # P0 bootstrap (phase-specific)
      modes/
        P0-bootup.md

  rome-p1-aordl/
    .claude-plugin/
      plugin.json             # References: robot-plugins/talib (P1 mode)
    skills/
      validate-aordl/
      create-aordl-requirement/
      transform-aordl-to-bdd/

  rome-p2-analysis/
    .claude-plugin/
      plugin.json             # References: robot-plugins/talib (P2 mode)
    skills/
      analyze-requirement/
      batch-analyze-requirements/
      generate-user-stories/

  rome-p3-design/
    .claude-plugin/
      plugin.json             # References: robot-plugins/pma, robot-plugins/clara
    skills/
      design-api-controllers/
      design-dto-models/
      generate-architecture-diagram/
```

---

## Implementation Details

### Robot Plugin Metadata (plugin.json)

**Example: robot-plugins/talib/.claude-plugin/plugin.json**

```json
{
  "name": "talib",
  "version": "1.0.0",
  "description": "Talib - Requirements Engineer robot for ROME framework",
  "type": "robot-plugin",
  "role": "Requirements Engineer",
  "provides": {
    "robot": "talib",
    "modes": [
      "P1-aordl",
      "P2-analysis"
    ]
  },
  "dependencies": {
    "rome-core": "^1.0.0"
  },
  "exports": {
    "ROBOT.md": "Core robot identity and baseline behavior",
    "modes/P1-aordl.md": "P1 AORDL requirements capture mode",
    "modes/P2-analysis.md": "P2 requirements analysis mode"
  },
  "author": "ROME Framework Team",
  "license": "MIT",
  "keywords": [
    "rome",
    "robot",
    "requirements-engineer",
    "talib",
    "multi-phase"
  ]
}
```

### Robot Identity File (ROBOT.md)

**Example: robot-plugins/talib/ROBOT.md**

```markdown
# Talib - Requirements Engineer Robot

| Field | Value |
|-------|-------|
| **Robot UID** | talib |
| **Version** | 1.0.0 |
| **Role** | Requirements Engineer |
| **Type** | Multi-Phase |
| **Phases** | P1 (AORDL), P2 (Analysis) |
| **Status** | Active |

## Identity

Talib is the Requirements Engineer robot in the ROME framework, responsible for transforming sponsor materials into structured, validated requirements and performing functional decomposition.

## Core Capabilities

- AORDL requirements authoring (13-field structure)
- Requirements validation and anti-pattern detection
- Functional decomposition and feature extraction
- Entity modeling and dependency analysis
- User story generation with acceptance criteria

## Phase Modes

### P1 Mode (AORDL)
**Purpose:** Transform raw sponsor materials into AORDL requirements
**Skills:** create-aordl-requirement, validate-aordl, transform-aordl-to-bdd
**Output:** AORDL requirement files in ARTIFACTS/_requirements/aordl/

### P2 Mode (Analysis)
**Purpose:** Decompose requirements into features, stories, and entities
**Skills:** analyze-requirement, batch-analyze-requirements, generate-user-stories
**Output:** Analysis artifacts in ARTIFACTS/_analysis/

## Baseline Behavior

[Core instructions that apply across all phases]

- Strict adherence to AORDL structure (13 required fields)
- Anti-pattern detection and resolution
- Sponsor clarification requests via Seez MCP
- Activity logging via activity-log-file MCP
- Traceability maintenance (REQ → FUNC → UC)

## Mode Loading

When invoked in a specific phase context:
1. Load ROBOT.md (this file) for core identity
2. Load modes/{PHASE}.md for phase-specific instructions
3. Merge behaviors (phase-specific overrides baseline where applicable)
```

### Phase Mode File (modes/P1-aordl.md)

**Example: robot-plugins/talib/modes/P1-aordl.md**

```markdown
# Talib P1 Mode: AORDL Requirements Capture

| Field | Value |
|-------|-------|
| **Mode UID** | talib:P1-aordl |
| **Phase** | P1 (AORDL) |
| **Plugin** | rome-p1-aordl |

## Phase-Specific Purpose

Transform raw sponsor materials (PRD, BRD, verbal requirements) into AORDL-compliant requirement files.

## Phase-Specific Skills

### create-aordl-requirement
[Skill invocation details for P1]

### validate-aordl
[Skill invocation details for P1]

### transform-aordl-to-bdd
[Skill invocation details for P1]

## Phase-Specific Instructions

[P1-specific behavior, constraints, outputs]

## Inputs (P1)
- _user_input/raw-requirements/
- Sponsor clarifications via Seez

## Outputs (P1)
- ARTIFACTS/_requirements/aordl/*.yaml
- AORDL validation reports

## Quality Gate
Sarah validates AORDL structure before P1→P2 transition.
```

### Phase Plugin References Robot

**Example: rome-p1-aordl/.claude-plugin/plugin.json**

```json
{
  "name": "rome-p1-aordl",
  "version": "1.0.0",
  "description": "ROME Phase 1 (AORDL) - Requirements capture using AORDL",
  "type": "phase-plugin",
  "phase": "P01-aordl",
  "provides": {
    "skills": [
      "validate-aordl",
      "transform-aordl-to-bdd",
      "create-aordl-requirement"
    ],
    "commands": [
      "rome-p1:validate",
      "rome-p1:create",
      "rome-p1:transform-bdd"
    ]
  },
  "requires": {
    "robots": [
      {
        "name": "talib",
        "mode": "P1-aordl",
        "source": "robot-plugins/talib"
      }
    ],
    "mcpServers": [
      {
        "name": "activity-log-file",
        "reason": "Track AORDL requirement creation",
        "optional": false
      }
    ]
  },
  "dependencies": {
    "rome-core": "^1.0.0",
    "robot-plugins/talib": "^1.0.0"
  }
}
```

---

## Benefits

### 1. Single Source of Truth
- Robot identity defined once in `robot-plugins/{robot}/ROBOT.md`
- No duplication of robot metadata across phases
- Clear versioning per robot (not per phase)

### 2. Clear Separation of Concerns
- **Robot plugins:** Define WHO (identity, role, core capabilities)
- **Phase plugins:** Define WHAT (skills, commands, phase logic)
- **Mode files:** Define HOW (phase-specific behavior overlay)

### 3. Scalability
- Add new phase for existing robot: Just add `modes/P{N}-{name}.md`
- No need to duplicate entire robot definition
- Cross-phase robots naturally supported

### 4. Discoverability
- List all robots: `ls robot-plugins/`
- Find robot's phases: `ls robot-plugins/talib/modes/`
- Understand robot capabilities: Read `robot-plugins/talib/ROBOT.md`

### 5. Framework Intent Alignment
- USER-GUIDE.md documents "Talib (P1 mode)" and "Talib (P2 mode)"
- Architecture now matches documented behavior
- Single robot UID: `talib` (not `rome-p1-aordl:talib` vs `rome-p2-analysis:talib`)

### 6. Plugin Dependency Clarity
- Phase plugins explicitly declare robot dependencies
- Robot version pinning independent of phase version
- Clear upgrade path for robots vs phases

---

## Migration Path

### Phase 1: Create robot-plugins Structure
1. Create `/ROME/robot-plugins/` directory
2. For each unique robot, create `robot-plugins/{robot}/` directory
3. Extract robot identity from phase plugin AGENT.md → ROBOT.md

### Phase 2: Extract Phase-Specific Behavior
1. Create `robot-plugins/{robot}/modes/` directory
2. Extract phase-specific instructions from AGENT.md → modes/P{N}-{name}.md
3. Leave skills in phase plugins (skills are phase-owned, not robot-owned)

### Phase 3: Update Phase Plugin Metadata
1. Update phase `plugin.json` to reference robot plugins
2. Add `requires.robots[]` section
3. Add dependency on robot plugin

### Phase 4: Update Documentation
1. Update USER-GUIDE.md to reference robot-plugins structure
2. Update PLUGIN-MANIFEST.md with robot plugin listing
3. Update SETUP_INSTRUCTIONS.md (currently outdated)

### Phase 5: Validation
1. Verify all robots load correctly from new structure
2. Verify phase-specific behaviors still work
3. Test cross-phase robot (Talib) transitions

---

## Impact Analysis

### Files Changed
- `/ROME/rome-p1-aordl/.claude-plugin/plugin.json` (add robot reference)
- `/ROME/rome-p2-analysis/.claude-plugin/plugin.json` (add robot reference)
- `/ROME/rome-p3-design/.claude-plugin/plugin.json` (add robot references)
- `/ROME/rome-p4-config/.claude-plugin/plugin.json` (add robot reference)
- `/ROME/rome-p5-generation/.claude-plugin/plugin.json` (add robot references)
- `/ROME/rome-qa/.claude-plugin/plugin.json` (add robot reference)
- `/ROME/rome-p0-bootup/.claude-plugin/plugin.json` (add robot reference)
- `/ROME/rome-core/.claude-plugin/plugin.json` (add robot reference for Roma)

### Files Created
- `/ROME/robot-plugins/bootstrap/` (10 directories, 20+ files)
- `/ROME/robot-plugins/{robot}/ROBOT.md` (10 files)
- `/ROME/robot-plugins/{robot}/modes/*.md` (varies per robot)
- `/ROME/robot-plugins/{robot}/.claude-plugin/plugin.json` (10 files)

### Files Removed
- `/ROME/rome-p1-aordl/agents/talib/AGENT.md` (content moved to robot-plugins)
- `/ROME/rome-p2-analysis/agents/talib/AGENT.md` (content moved to robot-plugins)
- All other `/ROME/rome-p*/agents/*/AGENT.md` files (content moved)

### Backward Compatibility
- **Breaking Change:** Yes - phase plugins now reference robot-plugins
- **Migration Required:** Yes - all phase plugins must be updated
- **User Impact:** Minimal - user workflow unchanged (still open AGENT.md files)
- **File Paths Change:** Yes - AGENT.md paths change from `rome-p1-aordl/agents/talib/` to `robot-plugins/talib/`

---

## Risks & Mitigations

### Risk 1: Complex Migration
**Mitigation:** Phased rollout, start with single robot (Talib), validate, then migrate others

### Risk 2: Plugin Loading Order Dependencies
**Mitigation:** Document robot-plugins must load before phase-plugins, update bootstrap sequence

### Risk 3: Existing Projects Break
**Mitigation:** Provide migration script, document upgrade path, maintain compatibility shim

### Risk 4: Increased Complexity
**Mitigation:** Strong documentation, clear examples, update USER-GUIDE.md with new structure

---

## Open Questions

1. **Plugin Loading Mechanism:** How do phase plugins load robot plugins? Via Claude Code plugin system or manual file reference?
2. **Mode Activation:** How is mode selected? Environment variable (`ROME_PHASE`)? File path context?
3. **Backward Compatibility:** Support legacy phase-embedded agents during transition?
4. **Roma Orchestrator:** Does Roma need special handling as phase-agnostic orchestrator?
5. **Bootstrap Special Case:** Bootstrap is phase-specific (P0 only) - still belongs in robot-plugins?

---

## Success Criteria

1. Talib exists in ONE location: `robot-plugins/talib/ROBOT.md`
2. Talib P1 mode activates when invoked from `rome-p1-aordl` context
3. Talib P2 mode activates when invoked from `rome-p2-analysis` context
4. No duplication of robot identity metadata across phase plugins
5. Phase plugins declare robot dependencies explicitly
6. USER-GUIDE.md structure matches actual architecture
7. All 10 robots successfully migrated to robot-plugins
8. Existing projects can migrate with documented upgrade path

---

## Related Documents

- **USER-GUIDE.md** - Documents "Talib (P1 mode)" and "Talib (P2 mode)" pattern
- **PLUGIN-MANIFEST.md** - Plugin catalog (needs update with robot-plugins)
- **SETUP_INSTRUCTIONS.md** - Currently outdated, needs update
- **ROME-GOV-BASELINE** (robot-baseline.md) - Robot behavioral standards
- **ROME-PROP-010** - Skill-based architecture (skills remain phase-owned)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-28 | Initial proposal - separate robot identity from phase behavior via robot-plugins architecture |
