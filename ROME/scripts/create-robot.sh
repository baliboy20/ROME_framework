#!/bin/bash
# ROME Robot Directory Generator
# Usage: ./ROME/scripts/create-robot.sh <robot_name>
# Example: ./ROME/scripts/create-robot.sh pma

ROBOT_NAME=$1
ROBOT_DIR="robot_${ROBOT_NAME}"

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
    echo "  - pma (Project Manager/Architect)"
    echo "  - chaperone (Specification Specialist)"
    echo "  - htm_decomposer (HTM Requirements Engineer)"
    echo "  - clara (UX Designer)"
    echo "  - charlie (Frontend Developer)"
    echo "  - reena (Backend Engineer)"
    echo "  - ashok (Data Architect)"
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
if [ -f "ROME/templates/claude-md/${ROBOT_NAME}.md" ]; then
    ln -sf ../../ROME/templates/claude-md/${ROBOT_NAME}.md ${ROBOT_DIR}/.claude/CLAUDE.md
    echo -e "  ${GREEN}✓${NC} Linked CLAUDE.md template"
else
    echo -e "  ${YELLOW}⚠${NC}  No template found: ROME/templates/claude-md/${ROBOT_NAME}.md"
    echo "     Create template first, then re-run this script"
fi

# Symlink README.md from role docs
if [ -f "ROME/roles/role-${ROBOT_NAME}.md" ]; then
    ln -sf ../ROME/roles/role-${ROBOT_NAME}.md ${ROBOT_DIR}/README.md
    echo -e "  ${GREEN}✓${NC} Linked README from ROME/roles/role-${ROBOT_NAME}.md"
elif [ -f "role-${ROBOT_NAME}.md" ]; then
    ln -sf ../role-${ROBOT_NAME}.md ${ROBOT_DIR}/README.md
    echo -e "  ${GREEN}✓${NC} Linked README from role-${ROBOT_NAME}.md"
else
    echo -e "  ${YELLOW}⚠${NC}  No role doc found for ${ROBOT_NAME}"
    echo "     Create role doc first: role-${ROBOT_NAME}.md"
fi

# Copy note templates
cp ROME/templates/robot-notes/current_work.md ${ROBOT_DIR}/notes/
cp ROME/templates/robot-notes/completed_features.md ${ROBOT_DIR}/notes/
cp ROME/templates/robot-notes/blockers.md ${ROBOT_DIR}/notes/
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
