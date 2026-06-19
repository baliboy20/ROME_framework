# validate-workspace-structure

## Metadata
- **Skill ID**: validate-workspace-structure
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P4 (Config)
- **Category**: Validation
- **Plugin**: rome-p4-config@1.0.0

## Description

Validates workspace scaffolding completeness. Checks that all workspaces are created, dependencies installed, builds work, tests run, CI pipeline is valid, and environments are documented.

## Parameters

### Required
- `scaffolding_manifest_file` (string): Path to scaffolding-manifest.md

### Optional
- `run_builds` (boolean): Actually run build commands to verify
  - Default: true
- `run_tests` (boolean): Actually run test commands to verify
  - Default: false

## Output

Returns validation report with pass/fail status for each workspace and overall readiness assessment.

## Related Skills

- scaffold-workspace, create-scaffolding-manifest

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p4-config plugin |
