# rome-p3-design

ROME Framework P3 Design Phase Plugin

## Overview

This plugin provides agents and skills for Phase 3 (Design) of the ROME methodology. It transforms requirements and user stories from P2 into complete system architecture, data models, API designs, and implementation plans.

## Version

1.0.0

## Agents

### PMA (Project Manager / Architect)
- **Role**: Execute Phase 3 design activities
- **Responsibilities**: Technology stack selection, data dictionary creation, API design, use case elaboration, system architecture, work breakdown
- **Location**: `agents/pma/AGENT.md`

### Clara (UX Designer)
- **Role**: Optional UX design support within Phase 3
- **Responsibilities**: Design system creation, wireframes, user flows, accessibility specifications
- **Location**: `agents/clara/AGENT.md`

## Skills

### Tier 1 Skills

- **design-api-controllers**: Design API controller layer with routing and request handling
- **design-data-dictionary**: Generate data dictionary from requirements matrix
- **design-dto-models**: Design data transfer objects
- **design-service-layer**: Design business logic service layer
- **design-repository-layer**: Design data access repository layer
- **design-authentication**: Design authentication and authorization
- **design-error-handling**: Design error handling strategy
- **design-logging-strategy**: Design logging and monitoring
- **design-testing-structure**: Design test architecture
- **design-validation-layer**: Design input validation
- **design-component-structure**: Design component architecture

### Tier 2 Skills

- **generate-architecture-diagram**: Generate Mermaid architecture diagrams (layered, deployment, dataflow)

## Dependencies

### Required
- **rome-core@^1.0.0**: Foundation libraries, orchestrator, activity logging

### Peer Dependencies
- **rome-p2-analysis@>=1.0.0**: Analysis phase outputs (requirements matrix, user stories)

## Installation

```bash
npm install rome-p3-design
```

## Usage

This plugin is activated during Phase 3 when Roma assigns PMA to execute design activities.

### Typical Workflow

1. **Entry Criteria**: GATE-P2 approved, phase2-handover.md available
2. **PMA reads P2 outputs**: requirements-matrix.yaml, user-stories.md, etc.
3. **Stage 1 - Foundation**: Sponsor kickoff, technology stack selection
4. **Stage 2 - Core Design**: Data dictionary, API design, use cases, architecture (iterative)
5. **Stage 3 - Finalization**: Work breakdown (actionlist), test data spec, handover
6. **Exit Criteria**: Complete design artifacts, sponsor sign-off, GATE-P3 approved

### Invoking Skills

Skills are invoked via slash commands:

```bash
/design-data-dictionary \
  --requirements_matrix_file ARTIFACTS/02-analysis/requirements/requirements-matrix.yaml

/design-api-controllers \
  --api_spec_file ARTIFACTS/03-design/api-contracts/api-spec.yaml \
  --framework express

/generate-architecture-diagram \
  --component_structure_file ARTIFACTS/03-design/architecture/components.json \
  --diagram_type layered
```

## Outputs

Phase 3 produces the following artifacts in `ARTIFACTS/03-design/`:

- `tech-stack.yaml` - Technology selections with versions
- `data-dictionary.yaml` - Single source of truth for data models
- `api-design.md` - API endpoint specifications
- `use-cases.md` - Detailed use case flows
- `system-architecture.md` - Architecture documentation
- `actionlist.md` - Work breakdown structure for P5
- `test-architecture.md` - Test design specifications
- `phase3-handover.md` - Handover document for P4/P5

## AORDL Integration

This plugin maintains full traceability to AORDL requirements from P1:

- REQ-### → Feature (FUNC-###) → Use Case (UC-###)
- Actor → User Role → Use Case Actor
- Intent → User Story → Use Case Flow
- Invariants → Data Constraints → Data Dictionary Business Rules
- NonFunctional.Performance → NFR → System Architecture
- NonFunctional.Security → NFR → Tech Stack + API Auth

## License

MIT

## Repository

https://github.com/rome-framework/rome-p3-design
