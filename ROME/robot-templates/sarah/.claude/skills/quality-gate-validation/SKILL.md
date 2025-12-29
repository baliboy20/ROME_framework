---
name: quality-gate-validation
description: Validate phase transitions against ROME quality gate criteria. Use when reviewing deliverables at GATE-P1, GATE-P2, GATE-P3, GATE-P4, or GATE-P5. Ensures completeness, traceability, and quality standards before approving phase transitions.
---

# Quality Gate Validation Skill

## Purpose

Sarah's primary responsibility: validate that all phase deliverables meet ROME quality standards before approving transition to the next phase.

## When to Use

Invoke this skill at every quality gate:
- **GATE-P1**: After Talib completes AORDL requirements
- **GATE-P2**: After Reena completes analysis
- **GATE-P3**: After Clara completes design
- **GATE-P4**: After Talib completes configuration
- **GATE-P5**: After Charlie/Lucien complete code generation

## Quick Reference

### Gate Decision Outcomes

- **APPROVED**: All criteria met, proceed to next phase
- **APPROVED WITH CONDITIONS**: Minor warnings, can proceed but address in parallel
- **BLOCKED**: Critical gaps, must fix before proceeding

---

## GATE-P1: AORDL Validation

**Validates**: Talib's P1 AORDL requirements

### Validation Checklist

#### ✅ Structure Compliance

- [ ] All requirements in `ARTIFACTS/01-requirements/` directory
- [ ] File naming: `REQ-###.yaml` (3-digit zero-padded)
- [ ] Requirements catalog exists: `requirements-catalog.md`
- [ ] Requirements index exists: `requirements-index.json`

#### ✅ AORDL Field Completeness (13 Required Fields)

For each REQ-###.yaml:
- [ ] `ID` - Unique identifier (REQ-###)
- [ ] `Actor` - Specific role (not generic "User")
- [ ] `Intent` - Atomic action (single verb + object)
- [ ] `Outcomes` - Measurable success criteria
- [ ] `Preconditions` - Entry conditions
- [ ] `Postconditions` - Exit conditions
- [ ] `Invariants` - Business rules/constraints
- [ ] `Errors` - Error handling scenarios
- [ ] `NonFunctional` - Performance, security, usability
- [ ] `Priority` - CRITICAL, HIGH, MEDIUM, LOW
- [ ] `Copilot Mode` - STRICT, GUIDED, PERMISSIVE
- [ ] `Tier` - 1, 2, 3, or 4
- [ ] `OpenQuestions` - All resolved (status=RESOLVED) or empty

#### ✅ Anti-Pattern Detection

- [ ] No UI language (e.g., "click button", "select dropdown")
- [ ] No technical jargon in Actor (e.g., "API", "database admin")
- [ ] No compound intents (e.g., "create and update project")
- [ ] No generic actors (e.g., "User", "Admin")
- [ ] No ambiguous verbs (e.g., "manage", "handle")

#### ✅ Quality Standards

- [ ] All Intents are atomic (single verb + object)
- [ ] All Actors are specific business roles
- [ ] All OpenQuestions resolved (no status=OPEN)
- [ ] All Invariants are testable constraints
- [ ] All NonFunctional requirements quantified

### Gate Decision Format

```yaml
gate: GATE-P1
date: 2025-12-29T20:00:00Z
status: [APPROVED | APPROVED_WITH_CONDITIONS | BLOCKED]
validated_by: Sarah

validation_summary:
  total_requirements: 25
  requirements_validated: 25
  critical_violations: 0
  warnings: 2
  passed: true

violations: []

warnings:
  - requirement: REQ-018
    field: NonFunctional.Performance
    warning: Performance target not quantified (should specify response time)
    severity: MEDIUM

  - requirement: REQ-022
    field: NonFunctional.Usability
    warning: Accessibility requirements vague (should reference WCAG level)
    severity: LOW

approval_conditions:
  - Address warnings in P2 (quantify NFRs during analysis)
  - All other criteria met

next_phase: P2
next_robot: Reena
```

---

## GATE-P2: Requirements Coverage Validation

**Validates**: Reena's P2 analysis outputs

### Validation Checklist

#### ✅ Traceability (100% Coverage)

- [ ] Every REQ-### has corresponding analysis in `02-analysis/REQ-###-analysis.json`
- [ ] Every REQ-### mapped to FUNC-### (Feature)
- [ ] No orphaned features (FUNC without REQ)
- [ ] REQ→FUNC traceability documented

#### ✅ Data Dictionary Completeness

- [ ] `data-dictionary.json` exists
- [ ] All entities from all requirements included
- [ ] Primary entities identified (business objects from Intent)
- [ ] Secondary entities identified (supporting objects)
- [ ] Entity relationships documented
- [ ] Attributes defined for all entities

#### ✅ API Specification

- [ ] `unified-api-spec.yaml` exists (OpenAPI 3.0)
- [ ] All REQ Intents have corresponding API endpoints
- [ ] HTTP methods correct (Intent verb → POST/GET/PUT/DELETE/PATCH)
- [ ] Request/response schemas defined
- [ ] Authentication/authorization specified
- [ ] Error responses documented

#### ✅ Test Scenarios

- [ ] `04-test-scenarios/` directory exists
- [ ] Test scenarios for all requirements
- [ ] BDD format (Given/When/Then)
- [ ] Acceptance criteria from AORDL Outcomes mapped to tests

### Gate Decision Format

```yaml
gate: GATE-P2
status: APPROVED
validated_by: Sarah

validation_summary:
  requirements_coverage: 100%
  features_created: 25
  entities_extracted: 60
  api_endpoints: 25
  test_scenarios: 75
  critical_gaps: 0

traceability_verification:
  req_to_feature: 25/25 (100%)
  orphaned_features: 0
  traceability_complete: true

data_model_quality:
  primary_entities: 9
  secondary_entities: 51
  relationships: 18
  completeness: EXCELLENT

next_phase: P3
next_robot: Clara
```

---

## GATE-P3: Design Completeness Validation

**Validates**: Clara's P3 design artifacts

### Validation Checklist

#### ✅ Architecture Documentation

- [ ] Architecture diagram exists (`architecture-diagram.mmd`)
- [ ] Layering clearly defined (Presentation/Domain/Data)
- [ ] Component structure documented (`component-structure.json`)
- [ ] Technology stack decisions recorded (ADRs)

#### ✅ Design Artifacts

- [ ] Class diagrams exist (`class-diagrams.mmd`)
- [ ] Sequence diagrams for key flows (`sequence-diagrams.mmd`)
- [ ] API design complete (`api-controllers.json`)
- [ ] Service layer design (`service-layer.json`)
- [ ] Repository layer design (`repository-layer.json`)
- [ ] Authentication/authorization design (`authentication.json`)

#### ✅ Traceability (Requirements → Use Cases)

- [ ] Every FUNC-### mapped to UC-### (Use Case)
- [ ] Every UC-### traces back to REQ-###
- [ ] No orphaned use cases
- [ ] 100% requirements coverage

#### ✅ Quality Standards

- [ ] All ADRs have rationale
- [ ] Security considerations documented
- [ ] Performance considerations documented
- [ ] Scalability analysis present

### Gate Decision Format

```yaml
gate: GATE-P3
status: APPROVED
validated_by: Sarah

validation_summary:
  use_cases_created: 25
  traceability: 100% (REQ→FUNC→UC)
  architecture_decisions: 5 ADRs
  design_artifacts: Complete

architecture_quality:
  layering: CLEAR
  separation_of_concerns: EXCELLENT
  tech_stack: VALIDATED

next_phase: P4
next_robot: Talib
```

---

## GATE-P4: Configuration Readiness Validation

**Validates**: Talib's P4 configuration

### Validation Checklist

#### ✅ Environment Configuration

- [ ] `.env.development`, `.env.staging`, `.env.production` exist
- [ ] No secrets in version control
- [ ] All required environment variables defined
- [ ] Database connection strings templated

#### ✅ Deployment Configuration

- [ ] `Dockerfile` exists and builds successfully
- [ ] `docker-compose.yml` exists for local development
- [ ] CI/CD pipeline configured (`.github/workflows/ci.yml`)
- [ ] Deployment scripts exist and tested

#### ✅ Security Configuration

- [ ] Secrets management configured
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Authentication mechanisms configured

### Gate Decision Format

```yaml
gate: GATE-P4
status: APPROVED
validated_by: Sarah

validation_summary:
  environment_configs: COMPLETE
  deployment_configs: TESTED
  security_configs: VALIDATED
  ready_for_code_generation: true

next_phase: P5
next_robot: Charlie
```

---

## GATE-P5: Code Quality Validation

**Validates**: Charlie/Lucien's P5 code generation

### Validation Checklist

#### ✅ Code Completeness

- [ ] All UC-### implemented in code
- [ ] All tests exist and pass
- [ ] All linting passes
- [ ] Build succeeds

#### ✅ Traceability (Requirements → Code)

- [ ] Every UC-### has corresponding code files
- [ ] Code comments link to UC/FUNC/REQ
- [ ] `TRACEABILITY.md` files exist in features
- [ ] End-to-end REQ→FUNC→UC→Code chain intact

#### ✅ Quality Standards

- [ ] Test coverage ≥ 80%
- [ ] No critical security vulnerabilities
- [ ] Performance targets met
- [ ] Accessibility requirements met (if applicable)

### Gate Decision Format

```yaml
gate: GATE-P5
status: APPROVED
validated_by: Sarah

validation_summary:
  code_complete: true
  tests_passing: 100% (187/187)
  test_coverage: 87%
  build_status: SUCCESS
  traceability_complete: 100%

production_readiness:
  security: VALIDATED
  performance: MEETS_TARGETS
  accessibility: WCAG_AA_COMPLIANT
  ready_for_delivery: true

approved_for: PRODUCTION_DEPLOYMENT
```

---

## Blocker Protocol

When validation fails (BLOCKED status):

1. **Document specific violations** in gate decision
2. **Assign to responsible robot** for fixes
3. **Log blocker** to activity log
4. **Notify Roma** for coordination
5. **Wait for fixes** and re-validate
6. **Do not approve** until all critical violations resolved

---

## Related Skills

- `activity-logging` - Log gate decisions
- `rome-protocols` - Follow gate protocols

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-12-29
**Robot**: Sarah only
**Priority**: CRITICAL
