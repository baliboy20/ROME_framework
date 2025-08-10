#!/bin/bash

# ROME Robot Orchestrator
# Automated script to launch multiple robot sessions simultaneously
# Usage: ./rome_orchestrator.sh [action] [robot_names...]
# Actions: start, stop, status, restart

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROME_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROME_DIR")"
ROBOTS_DIR="$PROJECT_ROOT"
LOG_DIR="$PROJECT_ROOT/PROJECT/dev/logs"
PIDS_FILE="$PROJECT_ROOT/.rome_pids"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[ROME]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Create necessary directories
setup_directories() {
    mkdir -p "$LOG_DIR"
    touch "$PIDS_FILE"
}

# Detect available robots
detect_robots() {
    local robots=()
    for dir in "$ROBOTS_DIR"/claude_*; do
        if [[ -d "$dir" && -f "$dir/CLAUDE.md" ]]; then
            robot_name=$(basename "$dir")
            robots+=("$robot_name")
        fi
    done
    echo "${robots[@]}"
}

# Get robot role from notit.txt
get_robot_role() {
    local robot_name="$1"
    local claude_file="$ROBOTS_DIR/$robot_name/CLAUDE.md"
    
    if [[ -f "$claude_file" ]]; then
        # Extract role from "## Your Role: [Role Title]" line
        grep "^## Your Role:" "$claude_file" | sed 's/## Your Role: //' || echo "Unknown Role"
    else
        echo "No Role Defined"
    fi
}

# Start a single robot
start_robot() {
    local robot_name="$1"
    local robot_dir="$ROBOTS_DIR/$robot_name"
    local log_file="$LOG_DIR/${robot_name}.log"
    local role=$(get_robot_role "$robot_name")
    
    if [[ ! -d "$robot_dir" ]]; then
        error "Robot directory not found: $robot_dir"
        return 1
    fi
    
    if [[ ! -f "$robot_dir/CLAUDE.md" ]]; then
        error "CLAUDE.md not found for robot: $robot_name"
        return 1
    fi
    
    log "Starting robot: $robot_name ($role)"
    
    # Kill existing session if running
    stop_robot_silent "$robot_name"
    
    # macOS/Linux terminal detection and launch
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - use Terminal.app
        osascript -e "
        tell application \"Terminal\"
            activate
            set newTab to do script \"cd '$robot_dir' && echo 'ROME Robot: $robot_name ($role)' && echo 'Starting...' && claude --start-with-file CLAUDE.md\"
            set custom title of newTab to \"$robot_name - $role\"
        end tell
        " > /dev/null 2>&1 &
        
        # Get the process ID and save it
        local pid=$!
        echo "$robot_name:$pid" >> "$PIDS_FILE"
        
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - try multiple terminal emulators
        if command -v gnome-terminal >/dev/null 2>&1; then
            gnome-terminal --title="$robot_name - $role" --working-directory="$robot_dir" -- bash -c "echo 'ROME Robot: $robot_name ($role)'; claude --start-with-file CLAUDE.md" &
        elif command -v xterm >/dev/null 2>&1; then
            xterm -title "$robot_name - $role" -e "cd '$robot_dir' && echo 'ROME Robot: $robot_name ($role)' && claude --start-with-file CLAUDE.md" &
        elif command -v konsole >/dev/null 2>&1; then
            konsole --title "$robot_name - $role" --workdir "$robot_dir" -e bash -c "echo 'ROME Robot: $robot_name ($role)'; claude --start-with-file CLAUDE.md" &
        else
            error "No supported terminal emulator found (tried: gnome-terminal, xterm, konsole)"
            return 1
        fi
        
        local pid=$!
        echo "$robot_name:$pid" >> "$PIDS_FILE"
        
    else
        error "Unsupported operating system: $OSTYPE"
        return 1
    fi
    
    success "Started robot: $robot_name (PID: $pid)"
    return 0
}

# Stop a single robot (silent version)
stop_robot_silent() {
    local robot_name="$1"
    
    if [[ -f "$PIDS_FILE" ]]; then
        local pids=$(grep "^$robot_name:" "$PIDS_FILE" | cut -d: -f2)
        for pid in $pids; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done
        # Remove entries for this robot
        grep -v "^$robot_name:" "$PIDS_FILE" > "${PIDS_FILE}.tmp" && mv "${PIDS_FILE}.tmp" "$PIDS_FILE"
    fi
}

# Stop a single robot
stop_robot() {
    local robot_name="$1"
    log "Stopping robot: $robot_name"
    stop_robot_silent "$robot_name"
    success "Stopped robot: $robot_name"
}

# Check if robot is running
is_robot_running() {
    local robot_name="$1"
    
    if [[ -f "$PIDS_FILE" ]]; then
        local pids=$(grep "^$robot_name:" "$PIDS_FILE" | cut -d: -f2)
        for pid in $pids; do
            if kill -0 "$pid" 2>/dev/null; then
                return 0
            fi
        done
    fi
    return 1
}

# Show robot status
show_robot_status() {
    local robot_name="$1"
    local role=$(get_robot_role "$robot_name")
    
    if is_robot_running "$robot_name"; then
        echo -e "${GREEN}●${NC} $robot_name ($role) - Running"
    else
        echo -e "${RED}●${NC} $robot_name ($role) - Stopped"
    fi
}

# Start all robots
start_all() {
    local robots=($1)
    local selected_robots=("${@:2}")
    
    if [[ ${#selected_robots[@]} -eq 0 ]]; then
        selected_robots=("${robots[@]}")
    fi
    
    if [[ ${#selected_robots[@]} -eq 0 ]]; then
        error "No robots found to start"
        return 1
    fi
    
    log "Starting ${#selected_robots[@]} robots..."
    
    for robot in "${selected_robots[@]}"; do
        if [[ " ${robots[*]} " =~ " ${robot} " ]]; then
            start_robot "$robot"
            sleep 2  # Stagger launches to avoid overwhelming the system
        else
            error "Robot not found: $robot"
        fi
    done
    
    success "All robots started!"
}

# Stop all robots
stop_all() {
    local robots=($1)
    local selected_robots=("${@:2}")
    
    if [[ ${#selected_robots[@]} -eq 0 ]]; then
        selected_robots=("${robots[@]}")
    fi
    
    log "Stopping robots..."
    
    for robot in "${selected_robots[@]}"; do
        stop_robot "$robot"
    done
    
    success "All robots stopped!"
}

# Show status of all robots
show_status() {
    local robots=($1)
    
    if [[ ${#robots[@]} -eq 0 ]]; then
        warn "No robots found"
        return 0
    fi
    
    log "ROME Robot Status:"
    echo
    for robot in "${robots[@]}"; do
        show_robot_status "$robot"
    done
    echo
}

# Show help
show_help() {
    cat << EOF
ROME Robot Orchestrator

USAGE:
    ./rome_orchestrator.sh [ACTION] [ROBOT_NAMES...]

ACTIONS:
    start     Start robots (all if none specified)
    stop      Stop robots (all if none specified)  
    restart   Restart robots (all if none specified)
    status    Show status of all robots
    list      List available robots
    help      Show this help message

EXAMPLES:
    ./rome_orchestrator.sh start                    # Start all robots
    ./rome_orchestrator.sh start claude_reena       # Start specific robot
    ./rome_orchestrator.sh start claude_reena claude_luc  # Start multiple robots
    ./rome_orchestrator.sh stop                     # Stop all robots
    ./rome_orchestrator.sh status                   # Show robot status
    ./rome_orchestrator.sh restart claude_charlie   # Restart specific robot

ROBOT MANAGEMENT:
    - Robots are detected automatically from claude_* directories
    - Each robot must have a CLAUDE.md file to be recognized
    - Terminal sessions are launched with descriptive titles
    - Process IDs are tracked for proper cleanup

EOF
}

# List available robots
list_robots() {
    local robots=($1)
    
    if [[ ${#robots[@]} -eq 0 ]]; then
        warn "No robots found"
        echo "To create robots, follow the ROME Robot Creation Guide."
        return 0
    fi
    
    log "Available robots:"
    echo
    for robot in "${robots[@]}"; do
        local role=$(get_robot_role "$robot")
        echo "  • $robot ($role)"
    done
    echo
}

# Main function
main() {
    setup_directories
    
    local action="${1:-help}"
    local robots=($(detect_robots))
    local selected_robots=("${@:2}")
    
    case "$action" in
        "start")
            start_all "${robots[*]}" "${selected_robots[@]}"
            ;;
        "stop")
            stop_all "${robots[*]}" "${selected_robots[@]}"
            ;;
        "restart")
            stop_all "${robots[*]}" "${selected_robots[@]}"
            sleep 2
            start_all "${robots[*]}" "${selected_robots[@]}"
            ;;
        "status")
            show_status "${robots[*]}"
            ;;
        "list")
            list_robots "${robots[*]}"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            error "Unknown action: $action"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
