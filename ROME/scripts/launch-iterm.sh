#!/bin/bash
# ROME v6.0 iTerm Launcher
# Launches iTerm split-pane workspace for existing robots
# Does NOT create robots - use create-robot.sh first

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Launching ROME iTerm workspace..."
echo "Project root: $PROJECT_ROOT"

# Check if robots exist
MISSING_ROBOTS=()
for robot in talib pma sarah roma clara ashok reena charlie; do
    if [ ! -d "$PROJECT_ROOT/robot_$robot" ]; then
        MISSING_ROBOTS+=("robot_$robot")
    fi
done

if [ ${#MISSING_ROBOTS[@]} -gt 0 ]; then
    echo "ERROR: Missing robot directories:"
    for robot in "${MISSING_ROBOTS[@]}"; do
        echo "  - $robot"
    done
    echo ""
    echo "Create robots first using:"
    echo "  ./ROME/scripts/create-robot.sh <robot_name>"
    exit 1
fi

# Launch AppleScript
osascript "$SCRIPT_DIR/launch-iterm-workspace.applescript" "$PROJECT_ROOT"
