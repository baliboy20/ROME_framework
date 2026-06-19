# scaffold-workspace

## Metadata
- **Skill ID**: scaffold-workspace
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P4 (Config)
- **Category**: Workspace Scaffolding
- **Plugin**: rome-p4-config@1.0.0

## Description

Creates workspace directory structure from actionlist.md. Initializes project based on technology stack, installs dependencies, and creates configuration files. Does NOT create internal src/tests structure - P5 robots create their own layouts.

## Parameters

### Required
- `actionlist_file` (string): Path to actionlist.md from P3
  - Validation: file_exists
- `tech_stack_file` (string): Path to tech-stack.yaml from P3
  - Validation: file_exists

### Optional
- `workspace_name` (string): Specific workspace to scaffold (if omitted, scaffolds all)
- `source_root` (string): Root directory for workspaces
  - Default: SOURCE/

## Execution

- **Timeout**: 120000ms (120 seconds)
- **Retry**: Enabled
  - Max attempts: 2
  - Backoff: exponential

## Output

Returns:
- `workspaces_scaffolded` (integer): Number of workspaces created
- `dependencies_installed` (boolean): Whether dependencies were installed
- `config_files_created` (array): List of configuration files created
- `workspace_paths` (array): List of created workspace paths

## Usage Example

```bash
/scaffold-workspace \
  --actionlist_file ARTIFACTS/_design/design-decisions/actionlist.md \
  --tech_stack_file ARTIFACTS/_design/design-decisions/tech-stack.yaml \
  --source_root SOURCE/
```

## Dependencies

- rome-core@^1.0.0 (SkillInvoker, SkillRegistry)
- js-yaml (for YAML parsing)
- node:child_process (for running init commands)
- node:fs (for directory creation)

## Algorithm

1. Load actionlist.md and tech-stack.yaml
2. Extract workspace definitions from actionlist
3. For each workspace:
   - Create workspace root directory
   - Determine technology from tech-stack
   - Run initialization command:
     - Node.js: `npm init -y`
     - Python: `python -m venv venv` + requirements.txt
     - Flutter: `flutter create`
     - Go: `go mod init`
     - Rust: `cargo init`
   - Install dependencies from tech-stack
   - Create configuration files:
     - Build config (tsconfig.json, webpack.config.js, etc.)
     - Lint config (.eslintrc, .prettierrc)
     - Test config (jest.config.js, pytest.ini)
     - Environment files (.env.example, .env.development)
   - Log workspace creation to activity log
4. Return scaffolding summary

## Created Structure

```
SOURCE/[workspace]/
├── package.json (or equivalent)
├── [build config files]
├── [lint config files]
├── [test config files]
└── .env.example
```

**Note:** Internal structure (src/, tests/, lib/, etc.) is created by P5 robots during feature implementation.

## Notes

- Integrates with Lucien's workspace scaffolding workflow (Step 5)
- Does NOT create internal directory structure - P5 robots own their layouts
- Installs dependencies specified in tech-stack.yaml
- Creates only root-level configuration files
- Logs each workspace creation to activity log

## Related Skills

- configure-environment (Tier 1)
- setup-cicd-pipeline (Tier 1)
- validate-workspace-structure (Tier 1)
- execute-p4-config (Tier 2)

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p4-config plugin |
