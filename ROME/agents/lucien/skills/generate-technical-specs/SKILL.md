# generate-technical-specs

## Metadata
- **Skill ID**: generate-technical-specs
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P4 (Config)
- **Category**: Documentation
- **Plugin**: rome-p4-config@1.0.0

## Description

Generates comprehensive technical specifications document. Documents workspace details, technology stack, directory structure, build commands, environment variables, and implementation guidelines for P5 robots.

## Parameters

### Required
- `actionlist_file` (string): Path to actionlist.md from P3
- `tech_stack_file` (string): Path to tech-stack.yaml from P3

### Optional
- `output_file` (string): Path to write technical specifications
  - Default: ARTIFACTS/_config/technical-specs/technical-specs.md

## Output

Returns comprehensive technical specification document for all workspaces.

## Related Skills

- scaffold-workspace, create-scaffolding-manifest

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p4-config plugin |
