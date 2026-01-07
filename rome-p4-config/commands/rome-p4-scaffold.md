# /rome-p4:scaffold

Scaffold a specific workspace from actionlist.md.

## Metadata
- **Command ID**: rome-p4:scaffold
- **Version**: 1.0.0
- **Phase**: P4 (Config)
- **Agent**: Lucien
- **Plugin**: rome-p4-config@1.0.0

## Description

Scaffolds a single workspace by creating its root directory structure, initializing the project, installing dependencies, and creating configuration files. Does NOT create internal src/tests structure - P5 robots create their own layouts.

## Usage

### Scaffold All Workspaces

```bash
/rome-p4:scaffold
```

### Scaffold Specific Workspace

```bash
/rome-p4:scaffold --workspace_name api-workspace
```

### Scaffold with Custom Source Root

```bash
/rome-p4:scaffold --workspace_name frontend --source_root SOURCE/
```

## Parameters

### Required
- `actionlist_file` (string): Path to actionlist.md from P3
  - Default: `ARTIFACTS/03-design/design-decisions/actionlist.md`
- `tech_stack_file` (string): Path to tech-stack.yaml from P3
  - Default: `ARTIFACTS/03-design/design-decisions/tech-stack.yaml`

### Optional
- `workspace_name` (string): Specific workspace to scaffold
  - If omitted, scaffolds all workspaces from actionlist.md
- `source_root` (string): Root directory for workspaces
  - Default: `SOURCE/`

## Workflow

1. Load actionlist.md and tech-stack.yaml
2. Extract workspace definition(s)
3. For each workspace:
   - Create workspace root directory
   - Determine technology from tech-stack
   - Run initialization command:
     - **Node.js**: `npm init -y`
     - **Python**: `python -m venv venv` + requirements.txt
     - **Flutter**: `flutter create [workspace]`
     - **Go**: `go mod init`
     - **Rust**: `cargo init`
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

## Outputs

Returns:
- `workspaces_scaffolded` (integer): Number of workspaces created
- `dependencies_installed` (boolean): Whether dependencies were installed
- `config_files_created` (array): List of configuration files created
- `workspace_paths` (array): List of created workspace paths

## Example: Node.js API Workspace

Running:
```bash
/rome-p4:scaffold --workspace_name api-workspace
```

Creates:
```
SOURCE/api-workspace/
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
├── .env.example
└── .env.development
```

## Example: Flutter Mobile Workspace

Running:
```bash
/rome-p4:scaffold --workspace_name mobile-app
```

Creates:
```
SOURCE/mobile-app/
├── pubspec.yaml
├── analysis_options.yaml
├── .env.example
└── (Flutter default structure)
```

## Notes

- Invokes `scaffold-workspace` skill (Tier 1)
- Part of Lucien's Step 5 (Scaffold Workspaces)
- Does NOT create internal directory structure
- Logs each workspace creation to activity log
- Can be run standalone or as part of `/rome-p4:configure`
