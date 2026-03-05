# rome-p1-aordl

ROME Phase 1 (AORDL) Plugin - Requirements capture and validation using Actor-Oriented Requirements Definition Language

**Version:** 1.0.0
**Status:** Active
**Phase:** P1-aordl

---

## Overview

The rome-p1-aordl plugin provides the Talib agent (P1 mode), skills, and commands for capturing and validating requirements using AORDL (Actor-Oriented Requirements Definition Language). AORDL enforces strict structure with 13 required fields, anti-pattern detection, and ambiguity resolution.

## Components

### Agents

- **talib** (P1 mode) - Requirements Engineer for AORDL capture and validation

### Skills

- **validate-aordl** - Validate AORDL requirement structure and content
- **transform-aordl-to-bdd** - Generate BDD scenarios from AORDL requirements
- **create-aordl-requirement** - Create new AORDL requirement from template

### Commands

- `/rome-p1:validate` - Validate AORDL requirement files
- `/rome-p1:create` - Create new AORDL requirement
- `/rome-p1:transform-bdd` - Transform AORDL to BDD Gherkin format

## Usage

### Typical AORDL Workflow

```bash
# 1. Create new requirement
/rome-p1:create --requirement-id REQ-001 --actor ProjectManager --intent "create project"

# 2. Edit REQ-001.yaml to fill in all 13 fields
# (Use editor or Claude to complete the requirement)

# 3. Validate in STRICT mode
/rome-p1:validate --requirement-file ARTIFACTS/_requirements/REQ-001.yaml --mode STRICT

# 4. Generate BDD scenarios for verification
/rome-p1:transform-bdd --requirement-file ARTIFACTS/_requirements/REQ-001.yaml

# 5. Repeat for all requirements

# 6. Validate entire catalog before GATE-P1
/rome-p1:validate --catalog-file ARTIFACTS/_requirements/requirements-catalog.md --mode STRICT
```

### AORDL Structure

Every AORDL requirement has 13 required fields:

```yaml
ID: REQ-001
Actor: ProjectManager              # Specific role (not "User")
Intent: create project             # Single atomic verb + object

Preconditions:                     # Required state before action
  - User is authenticated
  - User has ProjectManager role

Conditions:                        # Constraints during action
  - Project name must be unique
  - Project name length 3-50 chars

Postconditions:                    # Guaranteed state after action
  - Project exists in database
  - Project status is ACTIVE

Outcomes:                          # Observable results
  - Project is created and visible in project list
  - User receives confirmation message

Invariants:                        # Domain truths that never change
  - Project name must be unique
  - Every project has exactly one owner

NonFunctional:
  Performance:
    - Project creation completes within 2 seconds
  Security:
    - Only authenticated users with ProjectManager role can create projects
  Usability:
    - Creation form accessible via keyboard navigation

Errors:
  - error: "Project name already exists"
    message: "Project name must be unique"
    httpCode: 400
    userAction: "Choose a different project name"
  - error: "Invalid project name"
    message: "Project name must be 3-50 characters"
    httpCode: 400
    userAction: "Enter a valid project name"

ScopeBoundary:
  InScope:
    - Basic project creation
    - Name validation
  OutOfScope:
    - Project templates
    - Project cloning

OpenQuestions:
  - question: "Should project names be case-sensitive?"
    status: RESOLVED
    decision: "No, project names are case-insensitive"
    decisionDate: "2026-01-07T00:00:00Z"
    decisionBy: "Sponsor"

CopilotMode: STRICT
```

### Validation Modes

**STRICT:** Any violation = FAIL. Required for GATE-P1 approval.
- All 13 fields must be present and meaningful
- Zero anti-pattern violations
- All actors must be specific roles
- All intents must use approved atomic verbs
- All OpenQuestions must be RESOLVED

**GUIDED:** Only errors fail (warnings allowed).
- Structural issues cause failure
- Anti-patterns generate warnings
- Useful during development

**PERMISSIVE:** Always pass, just report issues.
- For initial exploration
- Never use for GATE-P1

### Anti-Patterns Detected

The validator detects and rejects:

- UI Language: "click button", "dropdown menu", "modal dialog"
- Technical Jargon: "POST /api/users", "Redux action", "SQL query"
- Generic Actors: "User", "System" (use specific roles)
- Ambiguous Verbs: "manage", "handle", "process" (use atomic verbs)
- Compound Intents: "create and assign project" (split into separate requirements)

### Approved Atomic Verbs

create, read, update, delete, view, list, search, filter, authenticate, authorize, assign, submit, approve, reject, export, import, validate, calculate, notify, schedule

## GATE-P1 Validation

Before exiting Phase 1, all requirements must pass GATE-P1:

| Check | Pass Criteria | Blocking |
|-------|---------------|----------|
| Structure Compliance | 100% valid YAML with 13 fields | Yes |
| Anti-Pattern Detection | Zero violations | Yes |
| Actor Specificity | All actors are specific roles | Yes |
| Intent Atomicity | All intents single verb + object | Yes |
| Field Completeness | All 13 fields meaningful content | Yes |
| Ambiguity Resolution | All OpenQuestions RESOLVED | Yes |
| BDD Scenarios | Generated for all requirements | Yes |
| Validation Rate | 100% pass /validate-aordl STRICT | Yes |

**CRITICAL:** GATE-P1 requires 100% pass rate in STRICT mode. No exceptions.

## Activity Logging

Talib logs using `talib` as robot identifier.

**Events:**
- `PHASE-1 IN_PROGRESS` - When starting P1
- `PHASE-1 COMPLETED` - When all requirements validated
- `BLOCKER` - For unresolved open questions
- `AMENDMENT` - When sponsor requests changes

## Dependencies

- **rome-core** ^1.0.0 - Foundation plugin (provides AORDL parser and validator)

## Exit Criteria

Before completing P1:
- All requirements in AORDL format (REQ-*.yaml)
- 100% pass rate in STRICT validation
- Zero anti-pattern violations
- All actors are specific roles
- All intents use approved atomic verbs
- All OpenQuestions RESOLVED
- BDD scenarios generated for all requirements
- Requirements catalog created
- Phase 1 handover document completed
- GATE-P1 approved
- Sponsor notified

## Post-Phase 1

After P1 completes:
1. All AORDL requirements in `ARTIFACTS/_requirements/`
2. Requirements catalog in `ARTIFACTS/_requirements/requirements-catalog.md`
3. BDD scenarios in `ARTIFACTS/_requirements/bdd/`
4. Phase 1 handover in `ARTIFACTS/_requirements/phase1-handover.md`
5. Ready for P2 Analysis transition

## Installation

```bash
# Plugin is auto-discovered via Claude Code plugin system
# No manual installation required
```

## Development

```bash
# Plugin structure
rome-p1-aordl/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── agents/
│   └── talib/
│       └── AGENT.md             # Talib agent (P1 mode)
├── skills/
│   ├── validate-aordl/
│   │   └── SKILL.md
│   ├── transform-aordl-to-bdd/
│   │   └── SKILL.md
│   └── create-aordl-requirement/
│       └── SKILL.md
├── commands/
│   ├── rome-p1-validate.md
│   ├── rome-p1-create.md
│   └── rome-p1-transform-bdd.md
├── package.json
└── README.md                    # This file
```

## License

MIT

## Repository

https://github.com/rome-framework/rome-p1-aordl

## Keywords

rome, phase-1, aordl, requirements, validation

