# Session Notes - Nov 24, 2025

## Terminal Notifier Commands

Working notification command with custom image:
```bash
terminal-notifier -title "Oz Alert" -subtitle "Important" -contentImage /Users/will/flutterProjects/Exercises/nov/romev10/ROME_architect/pma.png -message "the wizard of oz"

terminal-notifier -title "Oz Alert" -subtitle "Important" -appIcon /Users/will/flutterProjects/Exercises/nov/romev10/ROME_architect/pma.png -message "the wizard of oz"
```

## iMessage Command
```bash
osascript -e 'tell application "Messages" to send "message here" to buddy "+447412367761"'
```

## MCP Server Setup

Claude Code MCP add commands:
```bash
claude mcp add --transport stdio activity-log -- dart run /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_mcp/bin/server_with_web.dart

claude mcp add --transport stdio Seez -- dart run /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/seez_mcp/bin/mcp_server.dart

claude mcp add --transport stdio rome-terminal -- dart run /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/ro-term/bin/mcp_bridge_server.dart
```

Setup script: `/Users/will/flutterProjects/Exercises/nov/romev10/ROME/robot-templates/add-rome-mcps.sh`

## Key Paths
- PMA icon: `/Users/will/flutterProjects/Exercises/nov/romev10/ROME_architect/pma.png`
- MCP config: `/Users/will/flutterProjects/Exercises/nov/romev10/ROME_architect/.mcp.json`
