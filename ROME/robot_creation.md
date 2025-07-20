# Robot Creation and Instantiation Guide

## Overview
This document provides explicit instructions for creating and instantiating Claude terminal service sessions for robot developers in the ROME methodology.

## Prerequisites
- Claude CLI installed and configured
- Terminal access
- Project directory structure created
- CLAUDE.md files prepared for each robot

## Robot Creation Process

### 1. Directory Setup
Each robot requires its own dedicated directory with a CLAUDE.md instruction file:

```bash
# Create robot directory
mkdir claude_[robot_name]

# Create instruction file with robot identity
echo "# Robot Identity and Instructions

## Robot Profile
- **Name**: [Robot Name] (e.g., Reena, Charlie, Luc)
- **Role**: [Role Title] (e.g., Backend Developer, Frontend Developer, DevOps/DBA)
- **Module Assignment**: Module [N] - [Module Description]
- **Specialization**: [Technical Focus Area]

## Task Instructions
Execute the following tasks:
1) Confirm your identity and role from the profile above
2) Read all the documents in the ../ROME folder to understand the methodology
3) Read and understand your assigned module, steps and tasks in the ../actionlist.md in accordance to the ROME methodology
4) Execute the plan following the 7-step ROME protocol for each task

## Important Notes
- Follow ROME 7-step task execution process for every task
- Log all activities in ../PROJECT/dev/project_tasks.log
- Update ../PROJECT/dev/project_activity.status regularly
- Communicate blockers immediately to PMA
- Work only within your assigned module boundaries" > claude_[robot_name]/CLAUDE.md
```

### 2. Robot Permissions Configuration

Each robot requires a `.claude/settings.local.json` file to define permissions and minimize workflow interruptions. This prevents robots from needing user confirmation for routine development tasks.

#### Create Settings Directory Structure
```bash
# Create .claude directory for each robot
mkdir -p claude_[robot_name]/.claude
```

#### Backend Developer (Reena) Settings
```json
{
  "permissions": {
    "allow": [
      "Bash(mkdir:*)",
      "Bash(npm init:*)",
      "Bash(npm install:*)",
      "Bash(npm test:*)",
      "Bash(npm run:*)",
      "Bash(npm start:*)",
      "Bash(npm run build:*)",
      "Bash(npm run dev:*)",
      "Bash(node:*)",
      "Bash(nodemon:*)",
      "Bash(ts-node:*)",
      "Bash(tsc:*)",
      "Bash(jest:*)",
      "Bash(chmod:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Write(**/src/**)",
      "Write(**/tests/**)",
      "Write(**/test/**)",
      "Write(**/*.js)",
      "Write(**/*.ts)",
      "Write(**/*.json)",
      "Write(**/*.md)",
      "Edit(**/src/**)",
      "Edit(**/tests/**)",
      "Edit(**/*.js)",
      "Edit(**/*.ts)",
      "Edit(**/*.json)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Write(../actionlist.md)",
      "Edit(../actionlist.md)",
      "Write(../ROME/**)",
      "Edit(../ROME/**)"
    ]
  }
}
```

#### Frontend Developer (Charlie) Settings
```json
{
  "permissions": {
    "allow": [
      "Bash(mkdir:*)",
      "Bash(flutter create:*)",
      "Bash(flutter pub get:*)",
      "Bash(flutter pub add:*)",
      "Bash(flutter pub upgrade:*)",
      "Bash(flutter analyze:*)",
      "Bash(flutter build:*)",
      "Bash(flutter test:*)",
      "Bash(flutter run:*)",
      "Bash(flutter clean:*)",
      "Bash(dart:*)",
      "Bash(chmod:*)",
      "Write(**/lib/**)",
      "Write(**/test/**)",
      "Write(**/web/**)",
      "Write(**/*.dart)",
      "Write(**/*.yaml)",
      "Write(**/*.json)",
      "Write(**/*.md)",
      "Edit(**/lib/**)",
      "Edit(**/test/**)",
      "Edit(**/*.dart)",
      "Edit(**/*.yaml)",
      "Edit(**/*.json)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Write(../actionlist.md)",
      "Edit(../actionlist.md)",
      "Write(../ROME/**)",
      "Edit(../ROME/**)"
    ]
  }
}
```

#### DevOps/DBA (Luc) Settings
```json
{
  "permissions": {
    "allow": [
      "Bash(mkdir:*)",
      "Bash(docker:*)",
      "Bash(docker-compose:*)",
      "Bash(kubectl:*)",
      "Bash(terraform:*)",
      "Bash(ansible:*)",
      "Bash(git:*)",
      "Bash(ssh:*)",
      "Bash(scp:*)",
      "Bash(rsync:*)",
      "Bash(mysql:*)",
      "Bash(psql:*)",
      "Bash(mongodb:*)",
      "Bash(npm:*)",
      "Bash(yarn:*)",
      "Bash(pip:*)",
      "Bash(chmod:*)",
      "Write(**/infrastructure/**)",
      "Write(**/docker/**)",
      "Write(**/scripts/**)",
      "Write(**/database/**)",
      "Write(**/*.yml)",
      "Write(**/*.yaml)",
      "Write(**/*.tf)",
      "Write(**/*.sql)",
      "Write(**/*.sh)",
      "Write(**/*.json)",
      "Write(**/*.md)",
      "Edit(**/infrastructure/**)",
      "Edit(**/docker/**)",
      "Edit(**/scripts/**)",
      "Edit(**/*.yml)",
      "Edit(**/*.yaml)",
      "Edit(**/*.tf)",
      "Edit(**/*.sql)",
      "Edit(**/*.sh)",
      "Edit(**/*.json)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Write(../actionlist.md)",
      "Edit(../actionlist.md)",
      "Write(../ROME/**)",
      "Edit(../ROME/**)"
    ]
  }
}
```

### 3. Manual Robot Instantiation

#### Method A: Direct Terminal Launch
1. Open a new terminal window/tab
2. Navigate to the robot's directory:
   ```bash
   cd /path/to/project/claude_[robot_name]
   ```
3. Start Claude with the execute command:
   ```bash
   claude --execute "Please read and execute the instructions in CLAUDE.md"
   ```

#### Method B: Using Claude Code Command
1. Open a new terminal window/tab
2. Navigate to the robot's directory:
   ```bash
   cd /path/to/project/claude_[robot_name]
   ```
3. Start Claude Code in the directory:
   ```bash
   claude code .
   ```
4. Once Claude starts, manually instruct it to read CLAUDE.md

### 4. Automated Launch Scripts

#### For macOS:
Create a launch script using AppleScript:

```bash
#!/bin/bash
# launch_robot.sh

ROBOT_NAME=$1
ROBOT_DIR=$2
BASE_DIR=$(pwd)

osascript <<EOF
tell application "Terminal"
    -- Create new window
    set newWindow to do script ""
    
    -- Set window title
    do script "printf '\\033]0;$ROBOT_NAME\\007'" in newWindow
    
    -- Navigate to robot directory
    do script "cd '$BASE_DIR/$ROBOT_DIR'" in newWindow
    
    -- Start Claude
    do script "claude --execute 'Please read and execute the instructions in CLAUDE.md'" in newWindow
end tell
EOF
```



#### For Linux:
Create a launch script using gnome-terminal or xterm:

```bash
#!/bin/bash
# launch_robot.sh

ROBOT_NAME=$1
ROBOT_DIR=$2
BASE_DIR=$(pwd)

# For gnome-terminal
gnome-terminal --title="$ROBOT_NAME" -- bash -c "cd '$BASE_DIR/$ROBOT_DIR' && claude --execute 'Please read and execute the instructions in CLAUDE.md'; exec bash"

# For xterm
# xterm -title "$ROBOT_NAME" -e "cd '$BASE_DIR/$ROBOT_DIR' && claude --execute 'Please read and execute the instructions in CLAUDE.md'; bash"
```

### 5. Batch Launch Script

Create a master script to launch all robots:

```bash
#!/bin/bash
# launch_all_robots.sh

echo "🤖 Launching Robot Development Team"
echo "=================================="

# Function to launch a single robot
launch_robot() {
    local name=$1
    local dir=$2
    
    echo "Starting $name..."
    
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript <<EOF
tell application "Terminal"
    set newTab to do script ""
    do script "cd '$(pwd)/$dir'" in newTab
    delay 1
    do script "claude --execute 'Please read and execute the instructions in CLAUDE.md'" in newTab
end tell
EOF
    # Linux
    else
        gnome-terminal --tab --title="$name" -- bash -c "cd '$(pwd)/$dir' && claude --execute 'Please read and execute the instructions in CLAUDE.md'; exec bash" &
    fi
    
    sleep 2  # Delay between launches
}

# Launch each robot
launch_robot "Reena - Backend" "claude_reena"
launch_robot "Charlie - Frontend" "claude_charlie"
launch_robot "Luc - DevOps" "claude_luc"

echo "✅ All robots launched!"
```

## Robot Instantiation Best Practices

### 6. Sequential Launch
- Launch robots one at a time with 2-3 second delays
- This prevents system overload and API rate limiting

### 7. Verification Steps
Before launching, verify:
- Robot directory exists
- CLAUDE.md file is present and correct
- actionlist.md is accessible from robot directory
- ROME documentation folder is accessible

### 8. Environment Setup
Each robot should have access to:
- Project root directory
- ROME methodology documents
- actionlist.md with task assignments
- PROJECT/dev folder for logging
- SOURCE folders for code development

### 9. Initial Robot Instructions
When a robot starts, it should:
1. Confirm its identity and role
2. Read ROME methodology documents
3. Identify its assigned module in actionlist.md
4. Begin sequential task execution
5. Log all activities as per ROME protocols

## PMA Configuration Responsibilities

The PMA must ensure proper robot configuration to minimize workflow interruptions:

### 1. Settings.json Creation
Create `.claude/settings.local.json` for each robot with appropriate permissions:

```bash
# Create settings directories
mkdir -p claude_reena/.claude
mkdir -p claude_charlie/.claude
mkdir -p claude_luc/.claude

# Copy appropriate settings template for each robot
cp robot_settings_backend.json claude_reena/.claude/settings.local.json
cp robot_settings_frontend.json claude_charlie/.claude/settings.local.json
cp robot_settings_devops.json claude_luc/.claude/settings.local.json
```

### 2. Permission Verification
Before launching robots, verify:
- Each robot has appropriate file system permissions
- Command permissions match their role requirements
- Deny permissions prevent unauthorized modifications
- Settings files are valid JSON format

### 3. Workflow Optimization
Configure permissions to allow:
- **Autonomous task execution** without user prompts
- **Role-specific tool access** (npm for backend, flutter for frontend, docker for DevOps)
- **File modification rights** within their module boundaries
- **Testing and building** capabilities for their technology stack

### 4. Security Boundaries
Ensure robots cannot:
- Modify ROME methodology documents
- Change project task lists (actionlist.md)
- Access other robots' assigned modules
- Execute potentially destructive commands (rm -rf, sudo)

## Troubleshooting

### Common Issues:

1. **Claude command not found**
   - Ensure Claude CLI is installed: `pip install claude-cli`
   - Verify PATH includes Claude installation

2. **Permission denied**
   - Make launch scripts executable: `chmod +x launch_script.sh`
   - Check directory permissions

3. **Robot not reading CLAUDE.md**
   - Manually instruct: "Please read and execute CLAUDE.md"
   - Verify CLAUDE.md exists in current directory

4. **Terminal window closes immediately**
   - Add `exec bash` or `read -p "Press enter to close"` at end of commands
   - Check for syntax errors in launch scripts

### Alternative Approaches:

1. **Screen/Tmux Sessions**
   ```bash
   # Create named screen session
   screen -S robot_reena
   cd claude_reena
   claude --execute "Please read and execute CLAUDE.md"
   # Detach with Ctrl+A, D
   ```

2. **Background Processes**
   ```bash
   # Run in background with logging
   cd claude_reena
   nohup claude --execute "Please read and execute CLAUDE.md" > reena.log 2>&1 &
   ```

## PMA Responsibilities

The PMA should:
1. Create robot directories and CLAUDE.md files
2. Verify actionlist.md is complete and accessible
3. Launch robots using appropriate method for OS
4. Monitor robot initialization in terminals
5. Verify robots begin task execution
6. Track progress via project logs

## Robot Lifecycle

1. **Creation**: Directory and CLAUDE.md setup
2. **Instantiation**: Launch Claude in robot directory
3. **Initialization**: Robot reads instructions and begins
4. **Execution**: Robot works through assigned tasks
5. **Monitoring**: PMA tracks progress via logs
6. **Completion**: Robot reports module completion