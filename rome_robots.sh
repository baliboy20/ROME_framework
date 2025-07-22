#!/bin/bash

# ROME Robot Launcher
# Convenience script to launch robot automation from project root

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROBOT_SCRIPTS_DIR="$SCRIPT_DIR/ROME/robot_scripts"

# Check if robot_scripts directory exists
if [[ ! -d "$ROBOT_SCRIPTS_DIR" ]]; then
    echo "Error: ROME robot_scripts directory not found at $ROBOT_SCRIPTS_DIR"
    echo "Make sure you're running this from the project root directory."
    exit 1
fi

# Check if quick launcher exists
QUICK_LAUNCHER="$ROBOT_SCRIPTS_DIR/launch_robots.sh"
if [[ ! -f "$QUICK_LAUNCHER" ]]; then
    echo "Error: launch_robots.sh not found at $QUICK_LAUNCHER"
    exit 1
fi

# Forward all arguments to the quick launcher
"$QUICK_LAUNCHER" "$@"