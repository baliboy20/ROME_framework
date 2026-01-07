# Validate AORDL Structure

**ID**: validate-aordl-structure
**Category**: Quality & Validation
**Phase**: GATE-P1
**Robot**: Sarah

## Purpose

Validate AORDL requirement structure and completeness against specification

## Inputs

- REQ-*.yaml files (AORDL requirements)
- ROME-PHASE-002 (AORDL specification)

## Outputs

- Validation report
- List of anti-patterns detected
- Completeness score

## Validation Checks

1. **All 13 Required Fields Present**:
   - id, intent, actor, preconditions, flow, postconditions
   - outcomes, invariants, errors, nonFunctional
   - priority, dependencies, openQuestions

2. **Anti-Pattern Detection**:
   - UI language in intent (button, click, screen)
   - Technical jargon (API, database, REST)
   - Generic actors (user, admin)
   - Ambiguous verbs (manage, handle, process)

3. **Atomic Intent Check**:
   - Single verb + object
   - Not compound (and/or)

4. **Ambiguity Resolution**:
   - All openQuestions status = RESOLVED

## Example Output

```yaml
validation_result:
  requirement_id: REQ-001
  status: PASS
  checks:
    - name: "All fields present"
      status: PASS
    - name: "No UI language"
      status: PASS
    - name: "Atomic intent"
      status: PASS
    - name: "Ambiguities resolved"
      status: PASS
```

## GATE-P1 Criteria

- STRICT validation mode
- Zero anti-patterns
- All ambiguities resolved
- All 13 fields populated
