# ROME Robot Automation Scripts

This directory contains all automation scripts for managing ROME robot sessions.

## Scripts Overview

### **Quick Launcher (`launch_robots.sh`)**
Simple interface for common robot management tasks.

```bash
./launch_robots.sh go      # Start all robots
./launch_robots.sh stop    # Stop all robots
./launch_robots.sh check   # Show robot status
./launch_robots.sh restart # Restart all robots
./launch_robots.sh list    # List available robots
```

### **Advanced Orchestrator (`rome_orchestrator.sh`)**
Full-featured robot session management with granular control.

```bash
# Start specific robots
./rome_orchestrator.sh start claude_reena claude_luc

# Show detailed status with roles
./rome_orchestrator.sh status

# List all available robots
./rome_orchestrator.sh list

# Stop all or specific robots
./rome_orchestrator.sh stop [robot_names...]

# Restart robots
./rome_orchestrator.sh restart [robot_names...]

# Show help
./rome_orchestrator.sh help
```

### **TMux Session Manager (`rome_tmux_launcher.sh`)**
Advanced session management using tmux for power users.

```bash
# Start all robots in single tmux session
./rome_tmux_launcher.sh start

# Attach to existing session
./rome_tmux_launcher.sh attach

# Show session status
./rome_tmux_launcher.sh status

# Stop tmux session
./rome_tmux_launcher.sh stop
```

## Features

### **Automated Robot Detection**
- Automatically finds all `claude_*` directories
- Extracts robot roles from `CLAUDE.md` files
- Validates robot configuration before launch

### **Cross-Platform Support**
- **macOS**: Uses Terminal.app with AppleScript
- **Linux**: Supports gnome-terminal, xterm, konsole
- **TMux**: Universal terminal multiplexer support

### **Process Management**
- PID tracking for clean shutdown
- Staggered launch to prevent system overload
- Graceful error handling and recovery

### **User Experience**
- Color-coded output for clarity
- Descriptive terminal titles showing robot roles
- Real-time status monitoring
- Comprehensive help systems

## Usage Examples

### **Basic Workflow**
```bash
# Navigate to robot_scripts directory
cd ROME/robot_scripts

# Start all robots
./launch_robots.sh go

# Check status
./launch_robots.sh check

# Stop when done
./launch_robots.sh stop
```

### **Selective Robot Management**
```bash
# Start only backend and database robots
./rome_orchestrator.sh start claude_reena claude_luc

# Later, add frontend robot
./rome_orchestrator.sh start claude_charlie

# Check which robots are running
./rome_orchestrator.sh status
```

### **TMux Power User Workflow**
```bash
# Start tmux session with all robots
./rome_tmux_launcher.sh start

# Detach and return later
./rome_tmux_launcher.sh attach

# Switch between robots with Ctrl+B, w
# Each robot has its own window with clear naming
```

## Configuration

### **Directory Structure Expected**
```
PROJECT_ROOT/
├── ROME/
│   └── robot_scripts/          # This directory
│       ├── launch_robots.sh
│       ├── rome_orchestrator.sh
│       └── rome_tmux_launcher.sh
├── claude_[robot_name]/        # Robot workspaces
│   ├── CLAUDE.md
│   └── claude-start.sh
└── PROJECT/dev/logs/           # Log files (created automatically)
```

### **Robot Requirements**
For robots to be detected and managed:
1. Directory named `claude_[robot_name]`
2. Valid `CLAUDE.md` file with role definition
3. Executable `claude-start.sh` script

### **Dependencies**
- **bash**: All scripts require bash shell
- **tmux**: Required only for `rome_tmux_launcher.sh`
- **Terminal applications**: 
  - macOS: Terminal.app (built-in)
  - Linux: gnome-terminal, xterm, or konsole

## Troubleshooting

### **Common Issues**

#### **"No robots found"**
- Verify robot directories exist in project root
- Check that `CLAUDE.md` files are present and readable
- Ensure proper directory naming: `claude_[name]`

#### **Scripts not executable**
```bash
chmod +x *.sh
```

#### **TMux not found**
```bash
# macOS
brew install tmux

# Ubuntu/Debian  
sudo apt install tmux

# RHEL/CentOS
sudo yum install tmux
```

#### **Terminal launch failures**
- On Linux, install a supported terminal emulator
- Check that the terminal application is in PATH
- Verify permissions for terminal application execution

### **Logging**
- Robot logs: `PROJECT/dev/logs/[robot_name].log`
- Process tracking: `PROJECT_ROOT/.rome_pids`
- TMux sessions: Use `tmux list-sessions` to view active sessions

## Integration with ROME Methodology

These scripts are integrated into the ROME robot creation process:
- Automatically configured during robot setup
- Referenced in robot creation documentation
- Designed to work with ROME project structure
- Support for all standard ROME robot roles

For complete ROME methodology documentation, see the parent `ROME/` directory.