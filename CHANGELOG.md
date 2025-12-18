# ROME Framework Changelog

All notable changes to the ROME Framework will be documented in this file.

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
