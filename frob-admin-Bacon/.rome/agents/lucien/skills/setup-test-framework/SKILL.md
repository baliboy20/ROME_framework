# setup-test-framework

## Metadata
- **Skill ID**: setup-test-framework
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P4 (Config)
- **Category**: Test Configuration
- **Plugin**: rome-p4-config@1.0.0

## Description

Configures testing framework for workspaces. Sets up test runners (Jest, Vitest, pytest, flutter_test), test configuration, coverage tools, and test scripts based on technology stack and test architecture from P3.

## Parameters

### Required
- `workspace` (string): Workspace directory path
- `tech_stack_file` (string): Path to tech-stack.yaml from P3
- `test_architecture_file` (string): Path to test-architecture.md from P3

### Optional
- `output_doc` (string): Path to write test configuration documentation
  - Default: ARTIFACTS/_config/technical-specs/test-config.md

## Output

Returns test framework configuration files and documentation.

## Related Skills

- scaffold-workspace, configure-build-system

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p4-config plugin |
