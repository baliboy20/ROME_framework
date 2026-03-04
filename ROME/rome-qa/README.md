# rome-qa

ROME Quality Assurance Plugin - Quality gates and validation across all phases

## Overview

This plugin provides quality gate validation and traceability verification across the entire ROME Framework lifecycle through the Sarah agent.

## Version

1.0.0

## Dependencies

- **rome-core**: ^1.0.0 (required)

## Agent

### Sarah (Quality Gatekeeper)

System Auditor & Quality Gatekeeper responsible for:

- Quality gate validation at all phase transitions
- Requirements coverage verification (100% traceability)
- Technical decision assessment
- Traceability validation (REQ→FUNC→UC→Code)
- Blocker creation and management
- Change request approval/rejection
- Gate decision documentation

**Authority**: Phase transitions BLOCKED without Sarah APPROVAL.

## Quality Gates

### GATE-P1 (AORDL Validation)
- Validate AORDL structure (all 13 fields)
- Detect anti-patterns (UI language, generic actors, ambiguous verbs)
- Verify atomic intents
- Confirm ambiguities resolved

### GATE-P2 (Analysis → Design)
- Validate 8-dimension coverage (Functional, Data, UI, Integration, Security, Performance, Quality, Deployment)
- Verify requirements decomposition
- Check acceptance criteria quality (SMART)
- Validate handover document completeness
- Verify AORDL→Feature traceability (REQ-###→FUNC-###)

### GATE-P3 (Design → Config)
- Validate 100% requirements coverage
- Verify data dictionary completeness
- Assess tech stack decisions
- Validate API design completeness
- Check system architecture meets NFRs
- Verify Feature→Use Case traceability (FUNC-###→UC-###)

### GATE-P4 (Config → Generation)
- Validate configuration completeness
- Verify environment specifications
- Check scaffolding instructions
- Validate security configuration

### GATE-P5 (Generation → Delivery)
- Validate all workspaces implemented
- Verify all tests passing
- Check complete AORDL→Code traceability
- Validate documentation completeness
- Verify Use Case→Code traceability (UC-###→Code via TRACEABILITY.md)

## Skills

### Quality & Validation
- validate-aordl-structure
- validate-requirements-coverage
- validate-data-dictionary
- verify-traceability

### Quality Gates
- quality-gate-p2
- quality-gate-p3

## Core Principle

**Be thorough, not pedantic.**

Sarah blocks on:
- Missing requirements
- Security/compliance gaps
- Architectural contradictions
- Unproven scalability for stated requirements

Sarah does NOT block on:
- Typos
- Style preferences
- Optimization opportunities
- Minor documentation gaps

## Change Management

Sarah reviews and approves change requests:

1. **Review CR**: Impact analysis, effort, risk assessment
2. **Approve/Reject**: Update CR-###.yaml
3. **Verify Implementation**: Check traceability intact after implementation
4. **Approve Deployment**: Only after verification passes

## Verification Checklist

After CR implementation, Sarah verifies:
- [ ] All affected requirements have changeHistory
- [ ] All affected design docs have Change History
- [ ] All affected features have updated TRACEABILITY.md
- [ ] REQ → FUNC → UC → Code chain intact
- [ ] All tests pass
- [ ] Activity log updated
- [ ] Git commits reference CR-###

## Installation

This plugin is part of the ROME Framework v3 architecture and requires rome-core to be installed.

## Usage

### Slash Commands

The plugin provides two primary slash commands for quality assurance:

#### /rome-qa:validate

Execute validation checks for current phase artifacts

```bash
# Validate AORDL structure in Phase 1
/rome-qa:validate

# Validate requirements coverage in Phase 2
/rome-qa:validate

# Validate data dictionary in Phase 3
/rome-qa:validate

# Verify traceability at any phase
/rome-qa:validate
```

**Phase-Specific Validations:**

**P1 (AORDL Validation):**
- AORDL structure completeness (13 fields)
- Anti-pattern detection
- Intent atomicity
- Ambiguity resolution

**P2 (Analysis Validation):**
- Requirements coverage
- 8-dimension completeness
- Acceptance criteria quality
- Handover document structure

**P3 (Design Validation):**
- Data dictionary structure
- API design completeness
- UI design coverage
- System architecture consistency

**P5 (Implementation Validation):**
- Code traceability
- Test coverage
- Documentation completeness

#### /rome-qa:quality-gate

Execute comprehensive quality gate validation for phase transitions

```bash
# Execute Phase 2 quality gate (Analysis → Design)
/rome-qa:quality-gate

# Execute Phase 3 quality gate (Design → Configuration)
/rome-qa:quality-gate
```

**Gate Decision:**
- APPROVE: Phase transition permitted
- BLOCK: Critical issues must be resolved before transition

**Outputs:**
- Gate decision report (gate-decision-p2.yaml or gate-decision-p3.yaml)
- Validation results for all checks
- List of blockers (if BLOCK decision)
- Recommendations for next phase

### Quality Gate Workflow

Sarah executes quality gates at critical phase transitions:

```yaml
# Quality Gate Execution Flow

Phase 1 → Phase 2 Transition (GATE-P1)
  Trigger: AORDL requirements complete
  Command: /rome-qa:validate
  Checks:
    - AORDL structure validation
    - Anti-pattern detection
    - Intent atomicity
  Decision: APPROVE/BLOCK
  Blocker Example: "REQ-007 contains UI language in Intent"

Phase 2 → Phase 3 Transition (GATE-P2)
  Trigger: Analysis phase complete
  Command: /rome-qa:quality-gate
  Checks:
    - 8 Dimensions coverage (100%)
    - Requirements traceability
    - Acceptance criteria quality
    - Handover completeness
  Decision: APPROVE/BLOCK
  Blocker Example: "Performance dimension missing quantified targets"

Phase 3 → Phase 4 Transition (GATE-P3)
  Trigger: Design phase complete
  Command: /rome-qa:quality-gate
  Checks:
    - Data dictionary completeness
    - API design coverage
    - UI design completeness
    - System architecture validation
    - Traceability verification
  Decision: APPROVE/BLOCK
  Blocker Example: "API endpoint POST /users missing error responses"

Phase 5 → Delivery (GATE-P5)
  Trigger: Code generation complete
  Command: /rome-qa:validate
  Checks:
    - Implementation completeness
    - Test coverage
    - End-to-end traceability
    - Documentation
  Decision: APPROVE/BLOCK
  Blocker Example: "REQ-003 not traced to implementation"
```

### Traceability Verification

Sarah maintains bidirectional traceability throughout the ROME lifecycle:

```
Forward Traceability:
REQ-001 (AORDL)
  → FUNC-001 (Feature)
    → US-001 (User Story)
      → AC-001 (Acceptance Criteria)
        → Entity: User (Data Dictionary)
          → POST /api/users (API Design)
            → UserRegistrationScreen (UI Design)
              → UserModel, UserController, UserScreen (Code)
                → test_user_registration.spec.ts (Tests)

Backward Traceability:
UserRegistrationScreen (Code)
  ← ui-design.md (UI Design)
    ← api-design.md (API Design)
      ← data-dictionary.yaml (Data Model)
        ← US-001 (User Story)
          ← FUNC-001 (Feature)
            ← REQ-001 (AORDL)
```

### Example Gate Decision Report

```yaml
gate_decision:
  gate: GATE-P2
  phase_transition: "Analysis → Design"
  decision: APPROVE
  date: 2026-01-07T16:00:00Z
  reviewer: sarah

validation_results:
  - check: "8 Dimensions Coverage"
    status: PASS
    coverage: 100%
  - check: "Requirements Traceability"
    status: PASS
    requirements: 15
    features: 15
    stories: 45
    coverage: 100%
  - check: "Acceptance Criteria Quality"
    status: PASS
    criteria: 120
    smart_compliant: 100%
  - check: "Handover Complete"
    status: PASS

blockers: []

recommendations:
  - "Consider load testing strategy in P3 Design"
  - "Document API versioning approach in P3"
  - "Plan caching strategy for frequently accessed data"

approval:
  transition_approved: true
  next_phase: "P3 - Design"
  approved_by: "sarah"
  approved_at: 2026-01-07T16:00:00Z
```

### Change Request Validation

Sarah validates change requests (Change Request Protocol):

```bash
# Validate change request impact
/rome-qa:validate

# Verify implementation after change
/rome-qa:validate
```

**CR Validation Steps:**
1. Review CR impact analysis
2. Verify traceability updates
3. Check affected artifacts updated
4. Validate tests still pass
5. Approve or reject CR

### Integration with Other Plugins

**Dependencies:**
- rome-core: Foundation orchestration and activity logging

**Validates Output From:**
- rome-p1-aordl: AORDL requirements validation
- rome-p2-analysis: Requirements decomposition validation
- rome-p3-design: Design artifact validation
- rome-p5-generation: Generated code validation

**Blocks Phase Transitions:**
Sarah's APPROVE decision is required before phase transitions can proceed.

## Core Principle

**Be thorough, not pedantic.**

Sarah blocks on:
- Missing requirements
- Security/compliance gaps
- Architectural contradictions
- Unproven scalability for stated requirements
- Broken traceability chains
- Critical design flaws

Sarah does NOT block on:
- Typos or formatting issues
- Style preferences
- Optimization opportunities (provides recommendations instead)
- Minor documentation gaps (provides warnings)

## License

MIT
