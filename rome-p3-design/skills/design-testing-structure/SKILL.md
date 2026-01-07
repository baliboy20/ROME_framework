# design-testing-structure

## Metadata
- **Skill ID**: design-testing-structure
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: Test Design
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs test architecture including unit tests, integration tests, e2e tests, test data fixtures, mock services, and test automation strategy. For Flutter apps, defines Page Objects and Flow Objects.

## Parameters

### Required
- `use_cases_file` (string): Path to use-cases.md from P3
- `data_dictionary_file` (string): Path to data-dictionary.yaml from P3

### Optional
- `output_file` (string): File path to write test architecture design
  - Default: ARTIFACTS/03-design/design-decisions/test-architecture.md

## Output

Returns test architecture document with test types, frameworks, Page Objects, Flow Objects, widget keys, and test data specifications.

## Related Skills

- design-service-layer, design-component-structure

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
