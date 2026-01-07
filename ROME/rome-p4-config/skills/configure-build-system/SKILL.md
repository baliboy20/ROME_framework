# configure-build-system

## Metadata
- **Skill ID**: configure-build-system
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P4 (Config)
- **Category**: Build Configuration
- **Plugin**: rome-p4-config@1.0.0

## Description

Configures build system for workspaces. Sets up build tools (webpack, vite, rollup, gradle, etc.), transpilation, bundling, optimization, and build scripts based on technology stack.

## Parameters

### Required
- `workspace` (string): Workspace directory path
- `tech_stack_file` (string): Path to tech-stack.yaml from P3

### Optional
- `output_doc` (string): Path to write build configuration documentation
  - Default: ARTIFACTS/_config/technical-specs/build-config.md

## Output

Returns build configuration files and documentation for the workspace.

## Related Skills

- scaffold-workspace, setup-test-framework

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p4-config plugin |
