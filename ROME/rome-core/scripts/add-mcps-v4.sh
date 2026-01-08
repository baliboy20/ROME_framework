
#!/bin/bash
# ROME v10 MCP Server Setup Script v2
# Adds required MCP servers to Claude Code configuration
#
# Usage: ./setup-mcp-servers-v2.sh
#
# This script adds:
#   1. activity-log - Activity tracking database
#   2. Seez - Visual tabbed interface for diagrams and docs
#   3. rome-terminal - Terminal bridge for robot workspaces


set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_info() { echo -e "${CYAN}ℹ${NC} $1"; }

echo ""
echo "=========================================="
echo "ROME v10 MCP Server Setup"
echo "=========================================="
echo ""

# Check if claude command exists
if ! command -v claude &> /dev/null; then
    log_error "Claude Code CLI not found"
    log_error "Please install Claude Code first"
    exit 1
fi
log_success "Claude Code CLI found"



echo ""
log_info "Reset Project choices"
echo ""
claude mcp reset-project-choices


echo ""
log_info "Adding MCP servers..."
echo ""




# Add activity-log MCP server
echo "1. Adding activity-log MCP server..."
claude mcp add --scope local --transport stdio activity-log-file -- \
dart run /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp/bin/server.dart \
  || log_warning "activity-log may already exist or failed to add"
log_success "activity-log configured"

# Add Seez MCP server
echo ""
echo "2. Adding Seez MCP server..."
claude mcp add --scope local --transport stdio Seez -- \
  dart run /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/seez_mcp/bin/mcp_server.dart \
  || log_warning "Seez may already exist or failed to add"
log_success "Seez configured"

# Add iterm2-terminal MCP server
echo ""
echo "3. Adding iterm2-terminal MCP server..."
claude mcp add --scope local  --transport stdio iterm2-terminal -- \
  dart run /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/iterm2-mcp-server/bin/iterm2_mcp_server.dart \
  || log_warning "iterm2-terminal may already exist or failed to add"
log_success "iterm2-terminal configured"

echo ""
echo "=========================================="
echo "MCP Server Setup Complete"
echo "=========================================="
echo ""
echo "Added servers:"
echo "  • activity-log - Activity tracking database"
echo "  • Seez         - Visual tabbed interface"
echo "  • iterm2-terminal - Terminal bridge"
echo ""
echo "To verify, run:"
echo "  claude mcp list"
echo ""
echo "You may need to restart Claude Code for changes to take effect."
echo ""
