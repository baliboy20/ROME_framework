#!/bin/bash
# ROME v5.0 Workspace Setup Launcher
# Executes the AppleScript to create project and iTerm workspace

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Pass base directory as argument to AppleScript
osascript "$SCRIPT_DIR/setup-rome-workspace.applescript" "$BASE_DIR"
