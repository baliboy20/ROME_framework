# create-scaffolding-manifest

## Metadata
- **Skill ID**: create-scaffolding-manifest
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P4 (Config)
- **Category**: Documentation
- **Plugin**: rome-p4-config@1.0.0

## Description

Creates scaffolding manifest documenting all created artifacts. Lists workspaces, configuration files, CI/CD pipelines, environment files, and provides verification checklist for GATE-P4 review.

## Parameters

### Optional
- `output_file` (string): Path to write scaffolding manifest
  - Default: ARTIFACTS/04-config/scaffolding-plans/scaffolding-manifest.md

## Output

Returns scaffolding manifest document listing all created artifacts and verification status.

## Related Skills

- scaffold-workspace, generate-technical-specs, validate-workspace-structure

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p4-config plugin |
