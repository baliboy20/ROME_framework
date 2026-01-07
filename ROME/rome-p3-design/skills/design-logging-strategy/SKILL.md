# design-logging-strategy

## Metadata
- **Skill ID**: design-logging-strategy
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: Architecture Design
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs logging and monitoring strategy. Defines log levels, log formats, log aggregation, monitoring metrics, and alerting patterns based on NonFunctional.Performance specifications.

## Parameters

### Required
- `system_architecture_file` (string): Path to system-architecture.md from P3
- `nfr_file` (string): Path to non-functional-requirements.md from P2

### Optional
- `output_file` (string): File path to write logging strategy design
  - Default: ARTIFACTS/03-design/architecture/logging-strategy.md

## Output

Returns logging strategy document with log levels, formats, tools (Winston, Pino, etc.), and monitoring setup.

## Related Skills

- design-error-handling, design-service-layer

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
