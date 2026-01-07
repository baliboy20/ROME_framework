# design-authentication

## Metadata
- **Skill ID**: design-authentication
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: Security Design
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs authentication and authorization system. Selects authentication strategy (JWT, session, OAuth), defines user roles, permissions, and access control patterns based on AORDL Actor and NonFunctional.Security specifications.

## Parameters

### Required
- `requirements_matrix_file` (string): Path to requirements-matrix.yaml from P2
- `nfr_file` (string): Path to non-functional-requirements.md from P2

### Optional
- `output_file` (string): File path to write authentication design
  - Default: ARTIFACTS/03-design/architecture/authentication-design.md

## Output

Returns authentication design document with strategy, user roles, permissions, endpoints, and token/session management specifications.

## Related Skills

- design-service-layer, design-api-controllers, design-error-handling

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
