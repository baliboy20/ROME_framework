# Validate Data Dictionary

**ID**: validate-data-dictionary
**Category**: Quality & Validation
**Phase**: GATE-P3 (Design → Configuration transition)
**Robot**: Sarah

## Purpose

Validate data-dictionary.yaml structure, completeness, and consistency

## Inputs

- data-dictionary.yaml
- AORDL requirements (REQ-*.yaml)
- use-cases.md
- acceptance-criteria.md

## Outputs

- Validation report (PASS/FAIL)
- List of issues/warnings
- Coverage metrics

## Validation Checks

### 1. Structure Validation

- Valid YAML syntax
- Required top-level keys: entities, relationships, metadata
- Entity structure conformance
- Field definition completeness

### 2. Entity Validation

Each entity must have:
- Unique entity_id
- Entity name (PascalCase)
- Description
- At least one field
- Primary key identified

### 3. Field Validation

Each field must have:
- field_name (snake_case)
- type (string, integer, boolean, etc.)
- database_type (PostgreSQL, MySQL, etc. specific)
- required (true/false)
- description

Optional but recommended:
- default_value
- validation_rules
- indexed
- unique

### 4. Relationship Validation

- Valid relationship types (1:1, 1:N, N:M)
- Referenced entities exist
- Foreign keys defined correctly
- Junction tables for N:M relationships

### 5. Consistency Validation

- No orphaned entities (all referenced entities exist)
- No circular dependencies in relationships
- Field types consistent across relationships
- Primary/foreign key type matching

### 6. Coverage Validation

- All AORDL entities mapped to data dictionary
- All use case data requirements covered
- Business rules mapped to constraints

## Example Output

```yaml
validation_result:
  status: PASS
  timestamp: 2026-01-07T14:30:00Z
  validator: sarah

checks:
  - check: "YAML Syntax"
    status: PASS
  - check: "Entity Structure"
    status: PASS
    entities_validated: 12
  - check: "Field Definitions"
    status: PASS
    fields_validated: 87
  - check: "Relationships"
    status: PASS
    relationships_validated: 15
  - check: "Consistency"
    status: PASS
  - check: "AORDL Coverage"
    status: PASS
    coverage: 100%

warnings:
  - entity: "User"
    field: "profile_picture"
    message: "No validation rules specified for URL field"

recommendations:
  - "Consider adding indexes for email and username fields"
  - "Add unique constraint to User.email"
```

## AORDL Traceability

- AORDL Entities → Data Dictionary entities
- AORDL Relationships → Relationship definitions
- AORDL Invariants → Validation rules and constraints
