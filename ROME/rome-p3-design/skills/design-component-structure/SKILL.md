# design-component-structure

## Metadata
- **Skill ID**: design-component-structure
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: Architecture Design
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs component architecture for frontend applications. Defines component hierarchy, state management patterns, component communication, and reusable component library based on use cases and Clara's design system.

## Parameters

### Required
- `use_cases_file` (string): Path to use-cases.md from P3
- `tech_stack_file` (string): Path to tech-stack.yaml from P3

### Optional
- `design_system_file` (string): Path to design-system.md from Clara (if available)
- `output_file` (string): File path to write component structure
  - Default: ARTIFACTS/_design/architecture/components.json

## Output

Returns component structure JSON with component hierarchy, props, state, and communication patterns.

## Related Skills

- design-testing-structure, generate-architecture-diagram

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
