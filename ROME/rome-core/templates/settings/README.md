# ROME Phase Settings Templates

SessionStart hook configurations for auto-loading phase agents with MCP server setup.

## Usage

Copy the appropriate settings file to your project's `.claude/settings.json`:

```bash
# Example: P1 AORDL Requirements phase
cp ROME/rome-core/templates/settings/p1-settings.json .claude/settings.json
```

## What These Do

Each settings file configures two SessionStart actions:

1. **Run MCP setup script** - Ensures activity-log, Seez, and rome-terminal servers are configured
2. **Load phase agent** - Automatically loads the agent for that phase

## Available Templates

| Template | Phase | Agent | Purpose |
|----------|-------|-------|---------|
| `p0-settings.json` | P0: Bootup | Bootstrap | Project initialization |
| `p1-settings.json` | P1: AORDL | Talib | Requirements capture |
| `p2-settings.json` | P2: Analysis | Talib | Requirements analysis |
| `p3-settings.json` | P3: Design | PMA | Architecture & design |
| `p4-settings.json` | P4: Config | Lucien | Workspace configuration |
| `p5-settings.json` | P5: Generation | Ashok | Code generation (backend) |
| `qa-settings.json` | QA | Sarah | Quality gates & validation |
| `core-settings.json` | Core | Roma | Orchestration |

## Multi-Agent Phases

### P3 (Design)
- **PMA** (default): Architecture & design
- **Clara**: Design validation

Replace path with `ROME/rome-p3-design/agents/clara/AGENT.md` for Clara.

### P5 (Generation)
- **Ashok** (default): Backend generation
- **Reena**: Frontend generation
- **Charlie**: Integration code

Replace path accordingly:
- Reena: `ROME/rome-p5-generation/agents/reena/AGENT.md`
- Charlie: `ROME/rome-p5-generation/agents/charlie/AGENT.md`

## MCP Setup Script

The script `ROME/rome-core/scripts/add-mcps-v4.sh` configures:

- **activity-log-file**: Activity tracking (required per ROME-PROC-005)
- **Seez**: Visual tabbed interface for sponsor interaction
- **rome-terminal**: Terminal bridge for robot workspaces

Script runs silently on session start (`> /dev/null 2>&1`). If servers already configured, it skips gracefully.

## Customization

Edit your `.claude/settings.json` to:

- Change which agent loads
- Add additional hooks
- Customize MCP script behavior
- Add project-specific initialization

## Example: Custom Configuration

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/ROME/rome-core/scripts/add-mcps-v4.sh\" > /dev/null 2>&1"
          },
          {
            "type": "command",
            "command": "cat \"$CLAUDE_PROJECT_DIR/ROME/rome-p1-aordl/agents/talib/AGENT.md\""
          },
          {
            "type": "command",
            "command": "echo 'Custom initialization complete'"
          }
        ]
      }
    ]
  }
}
```

## Reference

- **ROME-GOV-009**: MCP Server Dependencies
- **Claude Code Hooks**: [Documentation](https://docs.claude.ai/claude-code/hooks)
