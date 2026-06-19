# design-validation-layer

## Metadata
- **Skill ID**: design-validation-layer
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: API Design
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs input validation layer for API requests and UI forms. Defines validation rules, error messages, client-side and server-side validation strategies based on data dictionary constraints.

## Parameters

### Required
- `data_dictionary_file` (string): Path to data-dictionary.yaml from P3

### Optional
- `output_file` (string): File path to write validation design
  - Default: ARTIFACTS/_design/architecture/validation-layer.md

## Output

Returns validation design document with validation decorators, rules, error messages, and validation libraries (class-validator, joi, etc.).

## Related Skills

- design-data-dictionary, design-dto-models, design-error-handling

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
