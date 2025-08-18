#!/bin/bash

# ROME TMux Session Manager
# Alternative launcher using tmux for better session management

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROME_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROME_DIR")"
SESSION_NAME="rome_robots"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[ROME-TMUX]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if tmux is available
check_tmux() {
    if ! command -v tmux >/dev/null 2>&1; then
        error "tmux is not installed. Please install tmux first:"
        echo "  macOS: brew install tmux"
        echo "  Ubuntu/Debian: sudo apt install tmux"
        echo "  RHEL/CentOS: sudo yum install tmux"
        exit 1
    fi
}

# Detect robots
detect_robots() {
    local robots=()
    for dir in "$PROJECT_ROOT"/claude_*; do
        if [[ -d "$dir" && -f "$dir/CLAUDE.md" ]]; then
            robot_name=$(basename "$dir")
            robots+=("$robot_name")
        fi
    done
    echo "${robots[@]}"
}

# Get robot role
get_robot_role() {
    local robot_name="$1"
    local claude_file="$PROJECT_ROOT/$robot_name/CLAUDE.md"
    
    if [[ -f "$claude_file" ]]; then
        grep "^## Your Role:" "$claude_file" | sed 's/## Your Role: //' || echo "Unknown"
    else
        echo "No Role"
    fi
}

# Start tmux session with all robots
start_session() {
    local robots=($1)
    
    if [[ ${#robots[@]} -eq 0 ]]; then
        error "No robots found to start"
        return 1
    fi
    
    # Kill existing session if it exists
    tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
    
    log "Creating tmux session: $SESSION_NAME"
    
    # Create new session with first robot
    local first_robot="${robots[0]}"
    local first_role=$(get_robot_role "$first_robot")
    
    tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_ROOT/$first_robot" \
        "echo 'ROME Robot: $first_robot ($first_role)'; echo 'Starting...'; claude --start-with-file CLAUDE.md"
    
    # Rename first window
    tmux rename-window -t "$SESSION_NAME:0" "$first_robot"
    
    # Add remaining robots as new windows
    for ((i=1; i<${#robots[@]}; i++)); do
        local robot="${robots[$i]}"
        local role=$(get_robot_role "$robot")
        
        tmux new-window -t "$SESSION_NAME" -c "$PROJECT_ROOT/$robot" \
            "echo 'ROME Robot: $robot ($role)'; echo 'Starting...'; claude --start-with-file CLAUDE.md"
        
        tmux rename-window -t "$SESSION_NAME:$i" "$robot"
    done
    
    success "Started tmux session with ${#robots[@]} robots"
    log "Use 'tmux attach -t $SESSION_NAME' to connect"
    log "Use Ctrl+B then 'w' to switch between robots"
    log "Use './rome_tmux_launcher.sh attach' for quick access"
}

# Attach to existing session
attach_session() {
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        log "Attaching to existing session: $SESSION_NAME"
        tmux attach -t "$SESSION_NAME"
    else
        error "No active session found. Use 'start' to create one."
        return 1
    fi
}

# Stop session
stop_session() {
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        log "Stopping tmux session: $SESSION_NAME"
        tmux kill-session -t "$SESSION_NAME"
        success "Session stopped"
    else
        log "No active session to stop"
    fi
}

# Show session status
show_status() {
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        log "Active tmux session: $SESSION_NAME"
        echo
        tmux list-windows -t "$SESSION_NAME" -F "#{window_index}: #{window_name} (#{window_active})"
        echo
        log "Use 'attach' to connect to the session"
    else
        log "No active tmux session"
        local robots=($(detect_robots))
        if [[ ${#robots[@]} -gt 0 ]]; then
            echo "Available robots: ${robots[*]}"
            log "Use 'start' to create a new session"
        fi
    fi
}

# List available windows in session
list_windows() {
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        log "Robot windows in session $SESSION_NAME:"
        tmux list-windows -t "$SESSION_NAME" -F "  #{window_index}: #{window_name}"
    else
        error "No active session found"
        return 1
    fi
}

# Show help
show_help() {
    cat << EOF
ROME TMux Session Manager

Manages all robot sessions in a single tmux session for easy switching.

USAGE:
    ./rome_tmux_launcher.sh [ACTION]

ACTIONS:
    start     Create new tmux session with all robots
    attach    Attach to existing session  
    stop      Stop the tmux session
    status    Show session status
    windows   List robot windows
    help      Show this help

TMUX QUICK REFERENCE:
    Ctrl+B, w     - List and switch between windows
    Ctrl+B, n     - Next window
    Ctrl+B, p     - Previous window
    Ctrl+B, 0-9   - Switch to window number
    Ctrl+B, d     - Detach from session (keeps running)
    
EXAMPLES:
    ./rome_tmux_launcher.sh start    # Start all robots in tmux
    ./rome_tmux_launcher.sh attach   # Reconnect to session
    ./rome_tmux_launcher.sh stop     # Stop all robots

BENEFITS:
    - All robots in one terminal window
    - Easy switching between robots
    - Sessions persist when detached
    - Better resource management

EOF
}

# Main function
main() {
    check_tmux
    
    local action="${1:-help}"
    local robots=($(detect_robots))
    
    case "$action" in
        "start")
            start_session "${robots[*]}"
            ;;
        "attach"|"connect")
            attach_session
            ;;
        "stop"|"kill")
            stop_session
            ;;
        "status")
            show_status
            ;;
        "windows"|"list")
            list_windows
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

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi