#!/bin/bash

# ROME Robot Quick Launcher
# Simple interface to the rome_orchestrator.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORCHESTRATOR="$SCRIPT_DIR/rome_orchestrator.sh"

# Check if orchestrator exists
if [[ ! -f "$ORCHESTRATOR" ]]; then
    echo "Error: rome_orchestrator.sh not found at $ORCHESTRATOR"
    exit 1
fi

# Quick commands
case "${1:-help}" in
    "go"|"start")
        echo "🚀 Launching all ROME robots..."
        "$ORCHESTRATOR" start
        ;;
    "stop"|"halt")
        echo "🛑 Stopping all ROME robots..."
        "$ORCHESTRATOR" stop
        ;;
    "check"|"status")
        "$ORCHESTRATOR" status
        ;;
    "list")
        "$ORCHESTRATOR" list
        ;;
    "restart"|"reboot")
        echo "🔄 Restarting all ROME robots..."
        "$ORCHESTRATOR" restart
        ;;
    *)
        echo "ROME Robot Quick Launcher"
        echo ""
        echo "Quick Commands:"
        echo "  ./launch_robots.sh go      - Start all robots"
        echo "  ./launch_robots.sh stop    - Stop all robots"
        echo "  ./launch_robots.sh check   - Show robot status"
        echo "  ./launch_robots.sh restart - Restart all robots"
        echo "  ./launch_robots.sh list    - List available robots"
        echo ""
        echo "For advanced options, use: ./rome_orchestrator.sh help"
        ;;
esac