#!/bin/bash

# Advanced Robot Army Launcher with monitoring
# This script launches Claude sessions and monitors their progress

echo "🤖 Robot Army Command Center"
echo "============================"
echo ""

# Get the current directory
BASE_DIR=$(pwd)

# Create a log directory for monitoring
LOG_DIR="$BASE_DIR/robot_logs"
mkdir -p "$LOG_DIR"

# Initialize project status files
cat > "$LOG_DIR/project_status.md" <<EOF
# Robot Army Project Status
Generated: $(date)

## Active Robots
- Charlie: Frontend Development (Flutter/BLoC)
- Reena: Backend Development (Node.js/Express)

## Project: Reverse Text Web Application

### Module Status
EOF

# Function to create robot-specific instruction file
create_robot_instruction() {
    local robot_name=$1
    local robot_dir=$2
    local module=$3
    
    cat > "$BASE_DIR/$robot_dir/startup_prompt.txt" <<EOF
You are $robot_name, a robot developer following ROME methodology.

Your primary task is to execute the instructions in CLAUDE.md:
1. Read all documents in ../ROME folder
2. Understand your assigned module/steps/tasks in ../actionlist.md
3. Execute the plan for Module: $module

Remember to:
- Follow the 7-step task execution process
- Update task logs regularly
- Work sequentially through your tasks
- Communicate any blockers

Start by reading CLAUDE.md and then begin your assigned tasks.
EOF
}

# Create instruction files for each robot
create_robot_instruction "Charlie" "claude_charlie" "Frontend Development"
create_robot_instruction "Reena" "claude_reena" "Backend Development"

# Function to launch Claude with specific instructions
launch_robot_with_prompt() {
    local robot_name=$1
    local robot_dir=$2
    local prompt_file="$BASE_DIR/$robot_dir/startup_prompt.txt"
    
    echo "🚀 Launching $robot_name..."
    
    # Read the prompt
    local prompt=$(cat "$prompt_file")
    
    # Launch in new terminal with the prompt
    osascript <<EOF
tell application "Terminal"
    do script "cd '$BASE_DIR/$robot_dir' && claude code . --execute '$prompt'"
end tell
EOF
    
    echo "✅ $robot_name launched"
    
    # Create individual log file
    echo "Robot: $robot_name" > "$LOG_DIR/${robot_dir}_status.log"
    echo "Started: $(date)" >> "$LOG_DIR/${robot_dir}_status.log"
    echo "Module: $(grep Module: $prompt_file | cut -d: -f2)" >> "$LOG_DIR/${robot_dir}_status.log"
    echo "" >> "$LOG_DIR/${robot_dir}_status.log"
}

# Launch the robots
launch_robot_with_prompt "Charlie" "claude_charlie"
sleep 3
launch_robot_with_prompt "Reena" "claude_reena"

echo ""
echo "============================"
echo "🎯 Robot Army Deployed!"
echo ""
echo "📊 Monitoring:"
echo "- Status logs: $LOG_DIR/"
echo "- Project structure: $BASE_DIR/reverse_app/"
echo ""
echo "💡 Tips:"
echo "- Each robot works independently on their module"
echo "- They follow ROME methodology and protocols"
echo "- Check terminal windows for real-time progress"
echo ""
echo "🔧 To check overall status:"
echo "  cat $LOG_DIR/project_status.md"
echo ""
echo "Good luck, Commander! 🫡"