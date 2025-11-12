#!/bin/bash
# ROME Robot Directory Generator
# Usage: ./ROME/scripts/create-robot.sh <robot_name>
# Example: ./ROME/scripts/create-robot.sh pma

ROBOT_NAME=$1

# Find ROME root directory (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROME_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$ROME_ROOT/.." && pwd)"

# Robot directories should be created in PROJECT_ROOT (ROME's parent)
ROBOT_DIR="${PROJECT_ROOT}/robot_${ROBOT_NAME}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ -z "$ROBOT_NAME" ]; then
    echo -e "${RED}Error: Robot name required${NC}"
    echo "Usage: $0 <robot_name>"
    echo ""
    echo "Example: $0 pma"
    echo ""
    echo "Available robots:"
    echo "  - talib (Requirements Engineer - Phase 1)"
    echo "  - pma (Project Manager/Architect - Phase 2)"
    echo "  - clara (UX Designer - Phase 2A)"
    echo "  - sarah (System Auditor - Phase 2B)"
    echo "  - ashok (Data Architect - Phase 3)"
    echo "  - reena (Backend Engineer - Phase 3)"
    echo "  - charlie (Frontend Developer - Phase 3)"
    echo "  - roma (Project Coordinator - All Phases)"
    exit 1
fi

echo -e "${GREEN}Creating robot directory: ${ROBOT_DIR}${NC}"
echo ""

# Check if directory already exists
if [ -d "$ROBOT_DIR" ]; then
    echo -e "${YELLOW}Warning: ${ROBOT_DIR} already exists${NC}"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    rm -rf "$ROBOT_DIR"
fi

# Create structure
mkdir -p ${ROBOT_DIR}/.claude
mkdir -p ${ROBOT_DIR}/notes

# Symlink CLAUDE.md from templates
CLAUDE_TEMPLATE="${ROME_ROOT}/templates/claude-md/${ROBOT_NAME}.md"
if [ -f "$CLAUDE_TEMPLATE" ]; then
    ln -sf ../../ROME/templates/claude-md/${ROBOT_NAME}.md ${ROBOT_DIR}/.claude/CLAUDE.md
    echo -e "  ${GREEN}✓${NC} Linked CLAUDE.md template"
else
    echo -e "  ${YELLOW}⚠${NC}  No template found: ${CLAUDE_TEMPLATE}"
    echo "     Create template first, then re-run this script"
fi

# Copy .mcp.json for MCP server configuration
MCP_TEMPLATE="${ROME_ROOT}/templates/.mcp.json"
if [ -f "$MCP_TEMPLATE" ]; then
    cp "$MCP_TEMPLATE" ${ROBOT_DIR}/.claude/.mcp.json
    echo -e "  ${GREEN}✓${NC} Copied .mcp.json for MCP server access"
else
    echo -e "  ${YELLOW}⚠${NC}  No .mcp.json template found: ${MCP_TEMPLATE}"
    echo "     MCP functions may not be available in this robot"
fi

# Map robot names to their phase folders (compatible with macOS bash)
case "$ROBOT_NAME" in
    talib)      ROLE_PATH="${ROME_ROOT}/02-phase1-requirements/role-talib.md" ;;
    pma)        ROLE_PATH="${ROME_ROOT}/03-phase2-architecture/role-pma.md" ;;
    clara)      ROLE_PATH="${ROME_ROOT}/04-phase2a-ux/role-clara.md" ;;
    sarah)      ROLE_PATH="${ROME_ROOT}/05-phase2b-audit/role-sarah.md" ;;
    chaperone)  ROLE_PATH="${ROME_ROOT}/05-phase2b-audit/role-sarah.md" ;;  # legacy name
    ashok)      ROLE_PATH="${ROME_ROOT}/06-phase3-development/role-ashok.md" ;;
    reena)      ROLE_PATH="${ROME_ROOT}/06-phase3-development/role-reena.md" ;;
    charlie)    ROLE_PATH="${ROME_ROOT}/06-phase3-development/role-charlie.md" ;;
    roma)       ROLE_PATH="${ROME_ROOT}/99-reference/role-roma.md" ;;
    *)          ROLE_PATH="" ;;
esac

# Symlink README.md from role docs (relative symlink)
if [ -n "$ROLE_PATH" ] && [ -f "$ROLE_PATH" ]; then
    # Extract just the relative path from ROME root
    ROLE_RELATIVE_PATH=$(echo "$ROLE_PATH" | sed "s|${ROME_ROOT}/||")
    ln -sf ../ROME/$ROLE_RELATIVE_PATH ${ROBOT_DIR}/README.md
    echo -e "  ${GREEN}✓${NC} Linked README from ROME/$ROLE_RELATIVE_PATH"
else
    echo -e "  ${YELLOW}⚠${NC}  No role doc found for ${ROBOT_NAME}"
    echo "     Expected: $ROLE_PATH"
fi

# Copy note templates
cp ${ROME_ROOT}/templates/robot-notes/current_work.md ${ROBOT_DIR}/notes/
cp ${ROME_ROOT}/templates/robot-notes/completed_features.md ${ROBOT_DIR}/notes/
cp ${ROME_ROOT}/templates/robot-notes/blockers.md ${ROBOT_DIR}/notes/
echo -e "  ${GREEN}✓${NC} Created notes directory with templates"

# Create gitignore for project-specific files
cat > ${ROBOT_DIR}/.gitignore <<EOF
# Project-specific files (not in git)
notes/current_work.md
notes/completed_features.md
notes/blockers.md
.claude/settings.local.json

# Keep template structure in git
!notes/.gitkeep
!.claude/.gitkeep
!.claude/.mcp.json
EOF
echo -e "  ${GREEN}✓${NC} Created .gitignore"

# Create .gitkeep files
touch ${ROBOT_DIR}/notes/.gitkeep
touch ${ROBOT_DIR}/.claude/.gitkeep
echo -e "  ${GREEN}✓${NC} Created .gitkeep files"

echo ""
echo -e "${GREEN}✅ Robot ${ROBOT_DIR} created!${NC}"
echo ""
echo "Structure:"
echo "  ${ROBOT_DIR}/"
echo "  ├── .claude/"
echo "  │   ├── CLAUDE.md → ROME/templates/claude-md/${ROBOT_NAME}.md"
echo "  │   └── .gitkeep"
echo "  ├── notes/"
echo "  │   ├── current_work.md (gitignored)"
echo "  │   ├── completed_features.md (gitignored)"
echo "  │   ├── blockers.md (gitignored)"
echo "  │   └── .gitkeep"
echo "  ├── README.md → ROME/roles/role-${ROBOT_NAME}.md"
echo "  └── .gitignore"
echo ""
echo -e "${YELLOW}Note:${NC} To customize robot behavior, edit templates in:"
echo "  - ROME/templates/claude-md/${ROBOT_NAME}.md (instructions)"
echo "  - role-${ROBOT_NAME}.md (role specification)"
echo ""
echo "  Do NOT edit symlinked files in ${ROBOT_DIR} directly."
echo ""
