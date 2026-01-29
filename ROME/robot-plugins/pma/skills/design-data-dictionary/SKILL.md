# design-data-dictionary

## Metadata
- **Skill ID**: design-data-dictionary
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: Data Modeling
- **Plugin**: rome-p3-design@1.0.0

## Description

Generates data dictionary from requirements matrix. Extracts entities, defines fields with types (database, API, UI), specifies relationships, validations, business rules, and examples. The data dictionary is the SINGLE SOURCE OF TRUTH for all layers.

## Parameters

### Required
- `requirements_matrix_file` (string): Path to requirements-matrix.yaml from P2
  - Validation: file_exists

### Optional
- `output_file` (string): File path to write data-dictionary.yaml
  - Default: ARTIFACTS/_design/data-models/data-dictionary.yaml

## Execution

- **Timeout**: 90000ms (90 seconds)
- **Retry**: Enabled
  - Max attempts: 2
  - Backoff: linear

## Output

Returns:
- `entities_defined` (integer): Number of entities defined
- `total_fields` (integer): Total fields across all entities
- `relationships_mapped` (integer): Number of entity relationships
- `business_rules_defined` (integer): Number of business rules

## Usage Example

```bash
/design-data-dictionary \
  --requirements_matrix_file ARTIFACTS/_requirements/requirements-matrix.yaml \
  --output_file ARTIFACTS/_design/data-models/data-dictionary.yaml
```

## Dependencies

- rome-core@^1.0.0 (SkillInvoker, SkillRegistry, aordlParser)
- js-yaml (for YAML parsing and generation)

## Algorithm

1. Load requirements matrix from P2
2. Extract entities from data_model dimension
3. For each entity:
   - Define all fields with:
     - Logical type (string, integer, boolean, date, etc.)
     - database_type (VARCHAR(255), INT, BOOLEAN, TIMESTAMP, etc.)
     - api_type (string, number, boolean, ISO8601, etc.)
     - ui_type (text, number, checkbox, datetime-local, etc.)
     - Constraints (required, unique, indexed, sensitive, pii)
     - Description and example
   - Map relationships (one-to-one, one-to-many, many-to-many)
   - Define validations (required, format, min_length, max_length, pattern, enum)
   - Extract business rules from AORDL Invariants
4. Generate data-dictionary.yaml following ROME-PHASE-004 schema
5. Write to output file

## Data Dictionary Schema

```yaml
entities:
  EntityName:
    description: "[Purpose]"
    table_name: "[database table]"
    fields:
      field_name:
        type: "[Logical type]"
        database_type: "[DB-specific type]"
        api_type: "[JSON type]"
        ui_type: "[Form input type]"
        required: true|false
        unique: true|false
        indexed: true|false
        sensitive: true|false
        pii: true|false
        description: "[Field purpose]"
        example: "[Sample value]"
    relationships:
      relationship_name:
        type: one-to-one|one-to-many|many-to-many
        target_entity: "[Entity name]"
        foreign_key: "[field]"
        on_delete: CASCADE|SET NULL|RESTRICT
    validations:
      field_name:
        - rule: required|format|min_length|max_length|pattern|unique|enum
          value: "[constraint value]"
          message: "[Error message]"
    business_rules:
      - id: "BR-ENTITY-###"
        description: "[Rule description]"
        level: critical|high|medium|low
        enforced_by: [database|api|ui]
```

## Notes

- CRITICAL: Data dictionary is SINGLE SOURCE OF TRUTH
- All layers (database, API, UI) derive from data dictionary
- Integrates with PMA's data dictionary workflow (Step 6)
- Traces to AORDL Invariants for business rules
- Supports Ashok (database), Reena (API models), Charlie (UI types)

## Related Skills

- validate-data-dictionary (Tier 1)
- design-dto-models (Tier 1)
- generate-api-spec (Tier 1)
- execute-p3-design (Tier 2)

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
