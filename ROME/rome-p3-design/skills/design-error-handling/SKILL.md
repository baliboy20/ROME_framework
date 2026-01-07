# design-error-handling

## Metadata
- **Skill ID**: design-error-handling
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: Architecture Design
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs error handling strategy across all layers. Defines exception hierarchy, error codes, error responses, logging patterns, and client-facing error messages based on AORDL Errors specifications.

## Parameters

### Required
- `requirements_matrix_file` (string): Path to requirements-matrix.yaml from P2
- `api_design_file` (string): Path to api-design.md from P3

### Optional
- `output_file` (string): File path to write error handling design
  - Default: ARTIFACTS/03-design/architecture/error-handling-design.md

## Output

Returns error handling design document with exception classes, error codes, response formats, and logging strategies.

## Related Skills

- design-service-layer, design-api-controllers, design-logging-strategy

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
