# ROME Framework: Setup Instructions

| Field | Value |
|-------|-------|
| **Document UID** | ROME-SETUP-001 |
| **Version** | 1.0 |
| **Date** | 2025-12-02T00:00:00Z |
| **Status** | Active |
| **Document Type** | Setup Guide |

## Prerequisites

- Claude Code CLI installed (`claude` command available)
- Dart runtime (for MCP servers)
- ROME framework cloned/downloaded locally

## Setup Steps

### 1. Configure MCP Servers (One-time)

```bash
cd /path/to/ROME/life-cycle/P00-bootup
./setup-mcp-servers-v3.sh
```

**Adds:**
- `activity-log` - Activity tracking database
- `Seez` - Visual tabbed interface
- `rome-terminal` - Terminal bridge

**Verify:**
```bash
claude mcp list
```

**Note:** Restart Claude Code after MCP setup.

### 2. Bootstrap New Project

```bash
cd /path/to/ROME/life-cycle/P00-bootup
./ignite-rome.sh [rome_path] [project_name] [project_path]
```

**Script performs:**
- Creates project folder structure
- Creates `robots/bootstrap/` workspace
- Copies bootstrap CLAUDE.md template
- Launches Claude Code in bootstrap workspace

**Interactive prompts if arguments omitted:**
- ROME framework path (auto-detected if run from ROME)
- Project name
- Project path (defaults to `./<project_name>`)

### 3. Initialize Project via Bootstrap Robot

**When Claude Code starts:**
```
"Bootstrap this project: <project_name>"
```

**Bootstrap robot creates:**
- Full folder structure (robots/, SOURCE/, ARTIFACTS/)
- ROME symlink (read-only framework access)
- `.rome-project.json` metadata
- Activity-log database: `rome_<project_name>`
- All 8 robot workspaces

**Validation checks:**
- ROME symlink readable
- MCP servers responsive
- Database initialized
- All folders present

### 4. Post-Bootstrap

**Control transfers to Roma orchestrator:**
- Working directory: `<project>/robots/roma/`
- Roma coordinates subsequent phases

## Quick Start Example

```bash
# One-time MCP setup
cd /path/to/ROME/life-cycle/P00-bootup
./setup-mcp-servers-v2.sh

# Bootstrap new project
./ignite-rome.sh ~/ROME my_app ~/projects/my_app

# In Claude Code (auto-launched):
# > "Bootstrap this project: my_app"
```

## Folder Structure Created

```
[project]/
├── ROME/              → Symlink to framework (read-only)
├── robots/            → 8 robot workspaces
│   ├── bootstrap/
│   ├── talib/
│   ├── pma/
│   ├── roma/
│   ├── sarah/
│   ├── clara/
│   ├── charlie/
│   └── reena/
├── SOURCE/            → Generated application code
└── ARTIFACTS/         → Phase outputs and deliverables
    ├── 00-bootup/
    ├── 01-ingest/
    ├── 02-analysis/
    ├── 03-design/
    ├── 04-config/
    ├── 05-generation/
    └── reference/
```

## Troubleshooting

**MCP servers not found:**
- Verify Dart paths in `setup-mcp-servers-v2.sh` match your system
- Check `claude mcp list` output

**ROME symlink invalid:**
- Verify ROME path contains `foundation/core-principles.md`
- Check symlink: `test -L <project>/ROME && ls <project>/ROME`

**Bootstrap robot fails:**
- Check MCP connectivity: activity-log, Seez, rome-terminal must respond
- Verify project path is writable

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2025-12-02T00:00:00Z | Initial setup instructions |
