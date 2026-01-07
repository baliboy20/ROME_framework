# rome-p0-bootup

ROME Phase 0 (Bootup) Plugin - Project initialization and bootstrap

**Version:** 1.0.0
**Status:** Active
**Phase:** P00-bootup

---

## Overview

The rome-p0-bootup plugin provides the Bootstrap agent and commands for initializing new ROME projects. It creates the project folder structure, initializes robot workspaces, establishes the ROME framework symlink, and validates MCP server connectivity.

## Components

### Agents

- **bootstrap** - Single-execution agent that prepares project environment for ROME-based development

### Commands

- `/rome-p0:bootstrap` - Execute project bootstrap procedure

### Skills

None. Bootstrap is a mechanical setup process with no complex skills required.

## Usage

### Basic Bootstrap

```bash
# From project directory with .bootstrap-config file
/rome-p0:bootstrap
```

### Manual Bootstrap

If no `.bootstrap-config` exists, the command will prompt for:
- Project name
- Project path (absolute)
- ROME framework path (absolute)

### Bootstrap Procedure

The bootstrap process:

1. **Validates ROME Path** - Ensures framework is accessible
2. **Creates Project Structure** - Folders for robots, SOURCE, ARTIFACTS, _user_input
3. **Creates ROME Symlink** - Links project to framework
4. **Initializes Robot Workspaces** - Creates directories for all 10 robots
5. **Initializes Activity Log** - Creates event log and state index
6. **Validates MCP Connectivity** - Tests activity-log, Seez, rome-terminal servers
7. **Marks Phase 0 Complete** - Logs completion and updates project status
8. **Notifies Sponsor** - Desktop notification of completion
9. **Hands Off to Roma** - Transfers control to orchestrator

### Project Structure Created

```
project-name/
├── .rome-project.json          # Project metadata
├── ROME/                       # Symlink to ROME framework
├── robots/                     # Robot workspaces (10 robots)
│   ├── bootstrap/
│   ├── roma/
│   ├── talib/
│   ├── pma/
│   ├── sarah/
│   ├── clara/
│   ├── lucien/
│   ├── ashok/
│   ├── charlie/
│   └── reena/
├── SOURCE/                     # Generated application code
├── _user_input/               # Raw requirements from sponsor
└── ARTIFACTS/                  # Phase artifacts (00-05)
```

## Dependencies

- **rome-core** ^1.0.0 - Foundation plugin

## Exit Criteria

Before completing bootstrap:
- All folders created per specification
- All 10 robot workspaces initialized
- ROME symlink functional (read access verified)
- .rome-project.json created with metadata
- Activity log initialized with header
- PHASE-0 events logged (IN_PROGRESS → COMPLETED)
- State index generated
- MCP server connectivity verified
- Sponsor notified

## Activity Logging

Bootstrap logs using `bootstrap` as robot identifier.

**Events:**
- `PHASE-0 IN_PROGRESS` - When starting
- `PHASE-0 COMPLETED` - When all validation passes

## Post-Bootstrap

After bootstrap completes:
1. All robots access ROME via read-only symlink at `[project]/ROME/`
2. Roma orchestrator takes over coordination
3. Sponsor materials go to `_user_input/raw-requirements/`
4. Phase 1 (Ingest) can begin

## Installation

```bash
# Plugin is auto-discovered via Claude Code plugin system
# No manual installation required
```

## Development

```bash
# Plugin structure
rome-p0-bootup/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── agents/
│   └── bootstrap/
│       └── AGENT.md          # Bootstrap agent definition
├── commands/
│   └── rome-p0-bootstrap.md  # Bootstrap command definition
├── package.json
└── README.md                 # This file
```

## License

MIT

## Repository

https://github.com/rome-framework/rome-p0-bootup

## Keywords

rome, phase-0, bootup, bootstrap, project-initialization

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial release of rome-p0-bootup plugin |
