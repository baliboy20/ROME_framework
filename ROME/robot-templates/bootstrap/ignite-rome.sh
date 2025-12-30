#!/bin/bash
# ROME v10 Bootstrap Ignition Script
# Prepares project folder and launches Bootstrap robot in Claude Code
#
# Usage: ./ignite_bootstrap-robot.sh [rome_path] [project_name] [project_path]
#
# Arguments (will prompt if not provided):
#   rome_path     - Path to ROME framework directory
#   project_name  - Name of the project (e.g., 'my_app')
#   project_path  - Absolute path where project will be created
#
# This script:
#   1. Locates ROME framework and bootstrap template
#   2. Creates project root directory
#   3. Creates robots/bootstrap/ workspace
#   4. Copies Bootstrap CLAUDE.md template
#   5. Launches Claude Code from bootstrap workspace

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
log_prompt() { echo -e "${CYAN}?${NC} $1"; }

echo ""
echo "=========================================="
echo "ROME v10 Bootstrap Ignition"
echo "=========================================="
echo ""

# Get ROME path (from arg or prompt)
if [ -n "$1" ]; then
    ROME_PATH="$1"
else
    # Try to detect if script is running from within ROME
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    DETECTED_ROME="$(cd "$SCRIPT_DIR/../.." 2>/dev/null && pwd)" || DETECTED_ROME=""

    if [ -n "$DETECTED_ROME" ] && [ -f "$DETECTED_ROME/foundation/core-principles.md" ]; then
        log_prompt "Enter ROME framework path:"
        echo "  (press Enter for detected: $DETECTED_ROME)"
        read -p "  > " ROME_PATH
        if [ -z "$ROME_PATH" ]; then
            ROME_PATH="$DETECTED_ROME"
        fi
    else
        log_prompt "Enter ROME framework path (e.g., /path/to/ROME):"
        read -p "  > " ROME_PATH
        if [ -z "$ROME_PATH" ]; then
            log_error "ROME path cannot be empty"
            exit 1
        fi
    fi
fi

# Convert to absolute path if relative
if [[ "$ROME_PATH" != /* ]]; then
    ROME_PATH="$(pwd)/$ROME_PATH"
fi

# Validate ROME path
if [ ! -f "$ROME_PATH/foundation/core-principles.md" ]; then
    log_error "Invalid ROME path: $ROME_PATH"
    log_error "Could not find foundation/core-principles.md"
    exit 1
fi
log_success "ROME framework validated at: $ROME_PATH"

# Validate bootstrap template exists
BOOTSTRAP_TEMPLATE="$ROME_PATH/robot-templates/bootstrap/CLAUDE.md"
if [ ! -f "$BOOTSTRAP_TEMPLATE" ]; then
    log_error "Bootstrap template not found: $BOOTSTRAP_TEMPLATE"
    exit 1
fi
log_success "Bootstrap template found"

echo ""

# Get project name (from arg or prompt)
if [ -n "$2" ]; then
    PROJECT_NAME="$2"
else
    log_prompt "Enter project name (e.g., my_app):"
    read -p "  > " PROJECT_NAME
    if [ -z "$PROJECT_NAME" ]; then
        log_error "Project name cannot be empty"
        exit 1
    fi
fi

echo ""

# Get project path (from arg or prompt)
if [ -n "$3" ]; then
    PROJECT_PATH="$3"
else
    # Suggest default path based on current directory
    DEFAULT_PATH="$(pwd)/$PROJECT_NAME"
    log_prompt "Enter project path:"
    echo "  (press Enter for default: $DEFAULT_PATH)"
    read -p "  > " PROJECT_PATH
    if [ -z "$PROJECT_PATH" ]; then
        PROJECT_PATH="$DEFAULT_PATH"
    fi
fi

# Convert to absolute path if relative
if [[ "$PROJECT_PATH" != /* ]]; then
    PROJECT_PATH="$(pwd)/$PROJECT_PATH"
fi

echo ""
echo "=========================================="
echo "Configuration"
echo "=========================================="
echo "Project Name: $PROJECT_NAME"
echo "Project Path: $PROJECT_PATH"
echo "ROME Path:    $ROME_PATH"
echo "=========================================="
echo ""

# Confirm before proceeding
log_prompt "Proceed with these settings? (Y/n):"
read -p "  > " CONFIRM
if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
    echo "Aborted."
    exit 1
fi

echo ""

# Check if project already exists
if [ -d "$PROJECT_PATH" ]; then
    log_warning "Project directory already exists: $PROJECT_PATH"
    log_prompt "Continue anyway? (y/N):"
    read -p "  > " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "Aborted."
        exit 1
    fi
fi

# Create project root
mkdir -p "$PROJECT_PATH"
log_success "Created project root: $PROJECT_PATH"

# Create bootstrap workspace
BOOTSTRAP_DIR="$PROJECT_PATH/robots/bootstrap"
mkdir -p "$BOOTSTRAP_DIR"
log_success "Created bootstrap workspace: $BOOTSTRAP_DIR"

# Copy bootstrap template
cp "$BOOTSTRAP_TEMPLATE" "$BOOTSTRAP_DIR/CLAUDE.md"
log_success "Copied Bootstrap CLAUDE.md template"

# Create config file for bootstrap robot to read
cat > "$BOOTSTRAP_DIR/.bootstrap-config" << EOF
PROJECT_NAME=$PROJECT_NAME
PROJECT_PATH=$PROJECT_PATH
ROME_PATH=$ROME_PATH
EOF
log_success "Created bootstrap config"

# Initialize project-level MCP configuration
MCP_TEMPLATE="$ROME_PATH/robot-templates/.mcp.json"
if [ -f "$MCP_TEMPLATE" ]; then
    cp "$MCP_TEMPLATE" "$PROJECT_PATH/.mcp.json"
    log_success "Initialized project MCP configuration"
else
    log_warning "MCP template not found, skipping .mcp.json initialization"
fi

echo ""
echo "=========================================="
echo "Bootstrap Preparation Complete"
echo "=========================================="
echo ""
echo "Launching Claude Code in: $BOOTSTRAP_DIR"
echo ""
echo "Once Claude starts, tell it:"
echo "  \"Bootstrap this project: $PROJECT_NAME\""
echo ""
echo "Note: Use ./addmcp.sh from any robot workspace to"
echo "      configure MCP servers in .mcp.json"
echo ""
echo "=========================================="
echo ""

# Navigate to bootstrap directory and launch Claude
cd "$BOOTSTRAP_DIR"
claude
