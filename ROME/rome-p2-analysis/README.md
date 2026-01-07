# rome-p2-analysis

ROME Phase 2 (Analysis) Plugin - Requirements analysis and functional decomposition from AORDL

**Version:** 1.0.0
**Status:** Active
**Phase:** P02-analysis

---

## Overview

The rome-p2-analysis plugin provides the Talib agent (P2 mode), skills, and commands for analyzing AORDL requirements and performing functional decomposition into Features, User Stories, and Acceptance Criteria with full traceability across 8 dimensions.

## Components

### Agents

- **talib** (P2 mode) - Requirements Engineer for analysis and decomposition

### Skills

- **analyze-requirement** - Comprehensive analysis of single AORDL requirement
- **batch-analyze-requirements** - Batch analysis with cross-requirement insights
- **generate-user-stories** - Auto-generate user stories from AORDL

### Commands

- `/rome-p2:analyze` - Analyze single requirement
- `/rome-p2:batch-analyze` - Batch analyze multiple requirements
- `/rome-p2:generate-stories` - Generate user stories from AORDL

## Usage

### Typical P2 Analysis Workflow

```bash
# 1. Analyze individual requirements
/rome-p2:analyze --requirement-file ARTIFACTS/_requirements/REQ-001.yaml

# 2. Batch analyze all requirements
/rome-p2:batch-analyze --requirements-dir ARTIFACTS/_requirements

# 3. Generate user stories from AORDL
/rome-p2:generate-stories --source-file ARTIFACTS/_requirements/requirements-catalog.md

# 4. Review analysis outputs:
# - Individual requirement analyses
# - Cross-requirement dependencies
# - Actor coverage analysis
# - Complexity distribution
# - User stories with acceptance criteria
```

### Analysis Components

Each requirement analysis includes:

1. **Validation** - AORDL STRICT mode validation
2. **Entity Extraction** - Domain entities and relationships
3. **Invariant Classification** - Business rules categorization
4. **API Derivation** - HTTP endpoint mapping from Intent
5. **Complexity Calculation** - Requirement complexity scoring
6. **Recommendations** - Improvement suggestions

### Batch Analysis Components

Batch analysis provides system-wide insights:

1. **Individual Analyses** - All requirements analyzed
2. **Cross-Requirement Analysis** - Dependencies and conflicts
3. **Coverage Analysis** - Actor coverage, CRUD completeness
4. **Complexity Distribution** - System-wide metrics
5. **Consolidated Recommendations** - System improvements

### User Story Generation

Transforms AORDL to user story format:

**From AORDL:**
```yaml
ID: REQ-001
Actor: ProjectManager
Intent: create project
Outcomes:
  - Project is created and visible in project list
```

**To User Story:**
```markdown
## FUNC-001: Create Project

**As a** ProjectManager
**I want to** create project
**So that** project is created and visible in project list

**Traced from:** REQ-001

### Acceptance Criteria
- [ ] Project is created and visible in project list
- [ ] Project status is ACTIVE
- [ ] User receives confirmation message
```

## 8-Dimension Analysis Framework

P2 analysis covers all 8 dimensions derived from AORDL:

1. **Functional** - From Intent, Outcomes
2. **Data Model** - From Invariants, Postconditions
3. **Business Rules** - From Conditions, Invariants
4. **Security** - From NonFunctional.Security
5. **Performance** - From NonFunctional.Performance
6. **Quality** - From Errors, Conditions
7. **Integration** - From Actor interactions
8. **Deployment** - From NonFunctional constraints

## AORDL to P2 Transformation

| From AORDL | To P2 Artifact |
|------------|----------------|
| REQ-### | Feature (FUNC-###) |
| Actor | User role in stories |
| Intent | User story capability |
| Outcomes | Acceptance criteria |
| NonFunctional | NFR specification |
| Errors | Error handling requirements |

## Output Artifacts

P2 produces the following artifacts:

- `ARTIFACTS/_requirements/requirements-matrix.yaml` - 8-dimension coverage matrix
- `ARTIFACTS/_requirements/user-stories.md` - Generated user stories
- `ARTIFACTS/_requirements/acceptance-criteria.md` - Testable acceptance criteria
- `ARTIFACTS/_requirements/non-functional-requirements.md` - NFR aggregation
- `ARTIFACTS/_requirements/phase2-handover.md` - P2 exit documentation

## Complexity Scoring

Requirements are scored based on:
- Number of preconditions and postconditions
- Number of invariants and business rules
- Number of error scenarios
- Non-functional requirement complexity
- Entity relationship complexity

Scoring:
- **Low:** 1-10 - Simple CRUD operations
- **Medium:** 11-20 - Moderate business logic
- **High:** 21+ - Complex multi-entity operations

High-complexity requirements should be decomposed into atomic requirements.

## Cross-Requirement Analysis

Batch analysis identifies:

**Dependencies:**
- Sequential: REQ-B requires REQ-A completion
- Conditional: REQ-C only valid if REQ-A exists
- Referential: REQ-D references REQ-A entities

**Conflicts:**
- Contradictory business rules
- Overlapping scope boundaries
- Competing non-functional requirements

**Coverage Gaps:**
- Missing CRUD operations
- Unaddressed actors
- Incomplete error handling

## Activity Logging

Talib logs using `talib` as robot identifier.

**Events:**
- `PHASE-2 IN_PROGRESS` - When starting P2
- `PHASE-2 COMPLETED` - When all artifacts ready
- `BLOCKER` - For ambiguities requiring resolution
- `AMENDMENT` - When sponsor requests changes

## Dependencies

- **rome-core** ^1.0.0 - Foundation plugin

## Entry Criteria

Before starting P2:
- PHASE-1 = COMPLETED
- AORDL requirements exist (REQ-*.yaml files)
- GATE-P1 = APPROVED (100% STRICT mode validation)
- requirements-catalog.md exists
- Roma approved P1 → P2 transition

## Exit Criteria

Before completing P2:
- All requirements analyzed
- Cross-requirement dependencies identified
- User stories generated with traceability
- Acceptance criteria defined
- 8-dimension coverage matrix completed
- Requirements matrix created
- Phase 2 handover document completed
- Sponsor notified
- Phase gate approval obtained

## Post-Phase 2

After P2 completes:
1. Requirements matrix in `ARTIFACTS/_requirements/`
2. User stories with full traceability
3. Acceptance criteria ready for testing
4. Non-functional requirements aggregated
5. Phase 2 handover for PMA (design phase)
6. Ready for P3 Design transition

## Installation

```bash
# Plugin is auto-discovered via Claude Code plugin system
# No manual installation required
```

## Development

```bash
# Plugin structure
rome-p2-analysis/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── agents/
│   └── talib/
│       └── AGENT.md             # Talib agent (P2 mode)
├── skills/
│   ├── analyze-requirement/
│   │   └── SKILL.md
│   ├── batch-analyze-requirements/
│   │   └── SKILL.md
│   └── generate-user-stories/
│       └── SKILL.md
├── commands/
│   ├── rome-p2-analyze.md
│   ├── rome-p2-batch-analyze.md
│   └── rome-p2-generate-stories.md
├── package.json
└── README.md                    # This file
```

## License

MIT

## Repository

https://github.com/rome-framework/rome-p2-analysis

## Keywords

rome, phase-2, analysis, requirements, user-stories

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial release of rome-p2-analysis plugin |
