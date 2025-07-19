#!/bin/bash

# Launch Claude Code sessions for each robot developer
# This script starts separate Claude sessions that will execute CLAUDE.md instructions

echo "🤖 Starting Robot Army Development Team..."
echo "==========================================="

# Get the current directory
BASE_DIR=$(pwd)

# Function to launch Claude for a robot
launch_robot() {
    local robot_name=$1
    local robot_dir=$2
    
    echo "🚀 Launching $robot_name..."
    
    # Open new terminal window and run claude with the execute command
    osascript <<EOF
tell application "Terminal"
    do script "cd '$BASE_DIR/$robot_dir' && claude code . --execute 'Please read and execute the instructions in CLAUDE.md'"
end tell
EOF
    
    echo "✅ $robot_name launched in $robot_dir"
    echo ""
}

# Launch Charlie (Frontend Developer)
launch_robot "Charlie (Frontend Developer)" "claude_charlie"

# Wait a bit between launches to avoid overwhelming the system
sleep 2

# Launch Reena (Backend Developer)
launch_robot "Reena (Backend Developer)" "claude_reena"

echo "==========================================="
echo "🎯 All robots launched!"
echo ""
echo "Each robot will:"
echo "1. Read ROME methodology documents"
echo "2. Understand their assigned tasks from actionlist.md"
echo "3. Execute their development plan"
echo ""
echo "Monitor each terminal window for progress."
echo "The robots will work according to ROME protocols."