#!/bin/bash
# ROME v10 MCP Server Setup Script
# Adds required MCP servers to Claude Code session
#
# Usage: ./add-rome-mcps.sh
#
# Run this script from within a Claude Code session terminal
# to add the ROME MCP servers (activity-log, Seez, rome-terminal)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

echo ""
echo "=========================================="
echo "ROME v10 MCP Server Setup"
echo "=========================================="
echo ""

# MCP Server paths
ACTIVITY_LOG_PATH="/Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_mcp/bin/server_with_web.dart"
SEEZ_PATH="/Users/will/flutterProjects/Apps/Local/mcps/rome/version7/seez_mcp/bin/mcp_server.dart"
ROME_TERMINAL_PATH="/Users/will/flutterProjects/Apps/Local/mcps/rome/version7/ro-term/bin/mcp_bridge_server.dart"

# Verify paths exist
echo "Verifying MCP server paths..."

if [ ! -f "$ACTIVITY_LOG_PATH" ]; then
    log_error "activity-log server not found: $ACTIVITY_LOG_PATH"
    exit 1
fi
log_success "activity-log server found"

if [ ! -f "$SEEZ_PATH" ]; then
    log_error "Seez server not found: $SEEZ_PATH"
    exit 1
fi
log_success "Seez server found"

if [ ! -f "$ROME_TERMINAL_PATH" ]; then
    log_error "rome-terminal server not found: $ROME_TERMINAL_PATH"
    exit 1
fi
log_success "rome-terminal server found"

echo ""
echo "Adding MCP servers to Claude Code session..."
echo ""

# Add activity-log MCP server
echo "Adding activity-log..."
claude mcp add --transport stdio activity-log -- dart run "$ACTIVITY_LOG_PATH"
log_success "activity-log added"

# Add Seez MCP server
echo "Adding Seez..."
claude mcp add --transport stdio Seez -- dart run "$SEEZ_PATH"
log_success "Seez added"

# Add rome-terminal MCP server
echo "Adding rome-terminal..."
claude mcp add --transport stdio rome-terminal -- dart run "$ROME_TERMINAL_PATH"
log_success "rome-terminal added"

echo ""
echo "=========================================="
echo "MCP Server Setup Complete"
echo "=========================================="
echo ""
echo "Added servers:"
echo "  - activity-log (Activity tracking database)"
echo "  - Seez (Markdown/Mermaid visualization)"
echo "  - rome-terminal (Multi-terminal management)"
echo ""
echo "Restart Claude Code or run '/mcp' to verify."
echo ""
