# /rome-p0:bootstrap Command

| Field | Value |
|-------|-------|
| **Command UID** | rome-p0-bootup:bootstrap |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Slash Command Definition |
| **Plugin** | rome-p0-bootup |

---

## Purpose

Initialize a new ROME project by executing the bootstrap procedure defined in the Bootstrap agent.

## Usage

```bash
/rome-p0:bootstrap
```

## Behavior

When invoked, this command:

1. Checks for `.bootstrap-config` file in current directory
2. If config exists, loads PROJECT_NAME, PROJECT_PATH, ROME_PATH
3. If config missing, prompts user for these values via AskUserQuestion
4. Executes the bootstrap procedure from Bootstrap agent:
   - Create project folder structure
   - Create ROME symlink
   - Initialize robot workspaces
   - Initialize activity log
   - Validate MCP connectivity
   - Mark Phase 0 complete
5. Notifies sponsor of completion
6. Hands off to Roma orchestrator

## Prerequisites

- MCP servers running: activity-log-file, Seez, rome-terminal
- ROME framework location known
- Project name and path determined

## Exit Criteria

- All folders created
- All 10 robot workspaces initialized
- ROME symlink functional
- Activity log initialized with PHASE-0 events
- MCP connectivity verified
- Sponsor notified

## Related

- Agent: rome-p0-bootup:bootstrap
- Phase: P00-bootup

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial command definition for rome-p0-bootup plugin |
