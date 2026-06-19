# Validate Requirements Coverage

**ID**: validate-requirements-coverage
**Category**: Quality & Validation
**Phase**: GATE-P2, GATE-P3
**Robot**: Sarah

## Purpose

Verify 100% requirements coverage across phase transitions

## Inputs

**GATE-P2 (Analysis → Design)**:
- REQ-*.yaml (P1 AORDL requirements)
- requirements-matrix.yaml (P2 requirements)
- user-stories.md (P2 features)

**GATE-P3 (Design → Config)**:
- requirements-matrix.yaml (P2 requirements)
- use-cases.md (P3 design)
- data-dictionary.yaml (P3 design)
- api-design.md (P3 design)

## Outputs

- Coverage matrix
- Missing requirements report
- Traceability gaps

## Process

1. Extract all requirement IDs from source phase
2. Search for requirement IDs in target phase artifacts
3. Generate coverage matrix
4. Flag missing requirements

## Example Output

```yaml
coverage_summary:
  gate: GATE-P2
  total_requirements: 25
  covered: 25
  missing: 0
  coverage_percentage: 100%

coverage_matrix:
  - req_id: REQ-001
    source: P1 AORDL
    target: FUNC-001 (user-stories.md)
    status: COVERED
  - req_id: REQ-002
    source: P1 AORDL
    target: null
    status: MISSING
```

## GATE Criteria

- **GATE-P2**: Every AORDL REQ-### mapped to FUNC-### feature
- **GATE-P3**: Every P2 requirement addressed in P3 design
- **GATE-P5**: Every design element implemented in code

## Blocking Condition

If coverage < 100%, create CRITICAL blocker
