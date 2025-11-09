# Robot Directory Restructure Plan

**Date:** 2025-11-06
**Purpose:** Make robot directories ephemeral with all authoritative content in `/ROME/`
**Principle:** Single Source of Truth

---

## 1. AUDIT: Current Robot Directory Contents

### robot_chaperone/
```
robot_chaperone/
├── CLAUDE.md           (454 lines) - ⚠️ AUTHORITATIVE, should be template
├── README.md           (380 lines) - ⚠️ AUTHORITATIVE, duplicates role doc
└── __start.sh          (script)    - ✅ Can stay (ephemeral helper)
```

**Analysis:**

**CLAUDE.md** - Contains:
- Mission statement
- 5-phase workflow (Initialize, Analyze, Question, Produce, Coordinate)
- 8 technical analysis dimensions (Data Model, Flows, Auth, Caching, Tech Stack, Deployment, Testing, System)
- Execution steps
- Success criteria
- Useful commands

**Status:** ⚠️ Template content - Should be in `/ROME/templates/claude-md/`

**README.md** - Contains:
- Role overview
- How to use guide
- 8 technical dimensions explained
- Process timeline (Day 1-3)
- Success criteria
- When to use Chaperone

**Status:** ⚠️ Largely duplicates `/ROME/role-chaperone.md` - Should reference, not duplicate

---

### robot_pma/
```
robot_pma/
├── .claude/
│   └── settings.local.json  (config)     - ✅ Project-specific, gitignore
├── CLAUDE.md                 (18 lines)  - ⚠️ Stub, needs template
├── README.md                 (minimal)   - ⚠️ Needs content
├── notes/
│   ├── current_work.md       (template)  - ✅ Keep, project-specific
│   ├── completed_features.md (template)  - ✅ Keep, project-specific
│   └── blockers.md           (template)  - ✅ Keep, project-specific
└── templates/
    └── README.md             (35 lines)  - ⚠️ References missing templates
```

**Analysis:**

**CLAUDE.md** - Contains:
- Minimal stub (18 lines)
- References ROME docs
- Incomplete

**Status:** ⚠️ Needs proper template from `/ROME/templates/claude-md/pma.md`

**README.md** - Minimal, needs expansion

**Status:** ⚠️ Should symlink to `/ROME/roles/role-pma.md`

**templates/README.md** - References templates that don't exist:
- data_model_template.md (missing)
- use_cases_template.md (missing)
- actionlist_template.md (missing)
- design_specification_template.md (missing)

**Status:** ⚠️ Templates should be in `/ROME/templates/` not `robot_pma/templates/`

---

## 2. RESTRUCTURE PLAN

### Phase 1: Create Central Template Repository

**Create `/ROME/templates/claude-md/`**

Move authoritative CLAUDE.md templates here:

```
/ROME/templates/claude-md/
├── chaperone.md          ← From robot_chaperone/CLAUDE.md
├── pma.md                ← Create proper version (expand stub)
├── htm-decomposer.md     ← Already exists: /role-htm-decomposer.md content
├── clara.md              ← Extract from /role-ux-clara.md
├── charlie.md            ← Extract from /role-frontend.md
├── reena.md              ← Extract from /role-backend.md
├── ashok.md              ← Extract from /role-data.md
└── README.md             ← Index of templates
```

**Create `/ROME/templates/project/`**

Artifact templates that robots use:

```
/ROME/templates/project/
├── data_model.md                    ← From existing /ROME/template-data-model.txt
├── use_cases.md                     ← From existing /ROME/template-use-cases.txt
├── actionlist.md                    ← From existing /ROME/template-actionlist.md
├── project-activity-status.json     ← JSON format activity log (v6.1+)
├── augmented_specification.md       ← From existing /ROME/template-augmented-specification.md
├── prototype_ui.md                  ← From existing /ROME/template-prototype-ui.md
└── README.md                        ← Index of project templates
```

**Create `/ROME/templates/robot-notes/`**

Standard notes templates for all robots:

```
/ROME/templates/robot-notes/
├── current_work.md          ← Standardized template
├── completed_features.md    ← Standardized template
├── blockers.md              ← Standardized template
└── README.md                ← Usage guide
```

---

### Phase 2: Create Robot Generation Script

**Create `/ROME/scripts/create-robot.sh`**

```bash
#!/bin/bash
# Usage: ./ROME/scripts/create-robot.sh <robot_name>
# Example: ./ROME/scripts/create-robot.sh pma

ROBOT_NAME=$1
ROBOT_DIR="robot_${ROBOT_NAME}"

if [ -z "$ROBOT_NAME" ]; then
    echo "Usage: $0 <robot_name>"
    echo "Example: $0 pma"
    exit 1
fi

echo "Creating robot directory: ${ROBOT_DIR}"

# Create structure
mkdir -p ${ROBOT_DIR}/.claude
mkdir -p ${ROBOT_DIR}/notes

# Symlink CLAUDE.md from templates
if [ -f "ROME/templates/claude-md/${ROBOT_NAME}.md" ]; then
    ln -sf ../../ROME/templates/claude-md/${ROBOT_NAME}.md ${ROBOT_DIR}/.claude/CLAUDE.md
    echo "  ✓ Linked CLAUDE.md template"
else
    echo "  ⚠ No template found for ${ROBOT_NAME} in ROME/templates/claude-md/"
fi

# Symlink README.md from role docs
if [ -f "ROME/roles/role-${ROBOT_NAME}.md" ]; then
    ln -sf ../ROME/roles/role-${ROBOT_NAME}.md ${ROBOT_DIR}/README.md
    echo "  ✓ Linked README from role doc"
elif [ -f "role-${ROBOT_NAME}.md" ]; then
    ln -sf ../role-${ROBOT_NAME}.md ${ROBOT_DIR}/README.md
    echo "  ✓ Linked README from role doc (root)"
else
    echo "  ⚠ No role doc found for ${ROBOT_NAME}"
fi

# Copy note templates
cp ROME/templates/robot-notes/current_work.md ${ROBOT_DIR}/notes/
cp ROME/templates/robot-notes/completed_features.md ${ROBOT_DIR}/notes/
cp ROME/templates/robot-notes/blockers.md ${ROBOT_DIR}/notes/
echo "  ✓ Created notes directory with templates"

# Create gitignore for project-specific files
cat > ${ROBOT_DIR}/.gitignore <<EOF
# Project-specific files (not in git)
notes/current_work.md
notes/completed_features.md
notes/blockers.md
.claude/settings.local.json

# Keep template structure in git
!notes/.gitkeep
EOF

touch ${ROBOT_DIR}/notes/.gitkeep

echo ""
echo "✅ Robot ${ROBOT_DIR} created!"
echo ""
echo "Structure:"
echo "  ${ROBOT_DIR}/.claude/CLAUDE.md → ROME/templates/claude-md/${ROBOT_NAME}.md"
echo "  ${ROBOT_DIR}/README.md → ROME/roles/role-${ROBOT_NAME}.md"
echo "  ${ROBOT_DIR}/notes/* (local, gitignored)"
echo ""
echo "To customize: Edit templates in /ROME/templates/, not in robot directory"
```

---

### Phase 3: Specific File Moves

#### Move 1: robot_chaperone/CLAUDE.md → ROME/templates/claude-md/chaperone.md

**Action:**
```bash
mv robot_chaperone/CLAUDE.md ROME/templates/claude-md/chaperone.md
```

**Update robot_chaperone:**
```bash
ln -sf ../../ROME/templates/claude-md/chaperone.md robot_chaperone/.claude/CLAUDE.md
```

---

#### Move 2: robot_chaperone/README.md → Symlink to role-chaperone.md

**Action:**
```bash
rm robot_chaperone/README.md
ln -sf ../ROME/role-chaperone.md robot_chaperone/README.md
```

**Note:** `/ROME/role-chaperone.md` exists but may need updates to match README content

---

#### Move 3: Create ROME/templates/claude-md/pma.md

**Action:** Create comprehensive PMA CLAUDE.md template based on:
- `/ROME/role-pma.md` (role definition)
- v5.0 Phase 2 workflow (6 steps, Step 2 expanded)
- HTM artifact reading requirements
- Architecture design responsibilities

**Content structure:**
```markdown
# robot_pma Instructions - Project Manager/Architect

**Robot**: robot_pma
**Role**: Project Manager/Architect (PMA)
**Phase**: Phase 2 - Technical Architecture & Planning

## Mission
[PMA role in ROME v5.0]

## Phase 2 Workflow
### Step 1: Read HTM Artifacts
[Read requirements-matrix.yaml, data-dictionary.yaml, component-registry.yaml]

### Step 2: Technical Architecture Design (EXPANDED in v5.0)
[Tech stack, API design, data architecture, auth, caching, deployment]

### Step 3-6: [Continue with other steps]

## Resources
- /ROME/role-pma.md
- /ROME/integration/htm-to-pma-handoff.md
- /Experts/ - Expert documentation
- MCP servers

## Success Criteria
[...]
```

---

#### Move 4: Consolidate Project Templates

**Current locations:**
- `/ROME/template-data-model.txt`
- `/ROME/template-use-cases.txt`
- `/ROME/template-actionlist.md`
- `/ROME/templates/project-activity-status.json` (v6.1+ JSON format)
- `/ROME/template-augmented-specification.md`
- `/ROME/template-prototype-ui.md`
- `/ROME/template-claude-md.txt`

**Action:** Organize into subdirectories

```bash
mkdir -p ROME/templates/project
mkdir -p ROME/templates/claude-md
mkdir -p ROME/templates/robot-notes

# Move project templates
mv ROME/template-data-model.txt ROME/templates/project/data_model.md
mv ROME/template-use-cases.txt ROME/templates/project/use_cases.md
mv ROME/template-actionlist.md ROME/templates/project/actionlist.md
# Note: activity_status.txt replaced by project-activity-status.json in v6.1
mv ROME/template-augmented-specification.md ROME/templates/project/augmented_specification.md
mv ROME/template-prototype-ui.md ROME/templates/project/prototype_ui.md
mv ROME/template-claude-md.txt ROME/templates/claude-md/_base-template.md
```

---

#### Move 5: Remove robot_pma/templates/

**Action:**
```bash
rm -rf robot_pma/templates/
```

**Reason:** Templates now centralized in `/ROME/templates/`

---

### Phase 4: Update .gitignore

**Add to root `.gitignore`:**
```
# Robot directories: Project-specific files
robot_*/notes/current_work.md
robot_*/notes/completed_features.md
robot_*/notes/blockers.md
robot_*/.claude/settings.local.json

# Keep structure
!robot_*/notes/.gitkeep
!robot_*/.claude/.gitkeep
```

**Reason:** Notes are project-specific, not part of methodology

---

### Phase 5: Create Documentation

**Create `/ROME/guide-robot-setup.md`**

Content:
```markdown
# Robot Setup Guide

## Quick Start

Create any robot directory from templates:
```bash
./ROME/scripts/create-robot.sh <name>
```

## Manual Setup

1. Create directory: `robot_<name>/`
2. Link CLAUDE.md: `ln -s ROME/templates/claude-md/<name>.md`
3. Link README: `ln -s ROME/roles/role-<name>.md`
4. Copy notes templates from ROME/templates/robot-notes/

## Available Robots

- **pma** - Project Manager/Architect
- **chaperone** - Specification Specialist
- **htm_decomposer** - HTM Requirements Engineer
- **clara** - UX Designer
- **charlie** - Frontend Developer
- **reena** - Backend Developer
- **ashok** - Data Architect

## Customization

Edit templates in `/ROME/templates/`, not in robot directories.
Robot directories are ephemeral and can be regenerated.
```

---

## 3. FINAL STRUCTURE

### After Restructure:

```
/ROME/
├── templates/
│   ├── claude-md/              ← NEW: CLAUDE.md templates
│   │   ├── chaperone.md
│   │   ├── pma.md
│   │   ├── htm-decomposer.md
│   │   ├── clara.md
│   │   ├── charlie.md
│   │   ├── reena.md
│   │   ├── ashok.md
│   │   ├── _base-template.md
│   │   └── README.md
│   ├── project/                ← REORGANIZED: Project artifact templates
│   │   ├── data_model.md
│   │   ├── use_cases.md
│   │   ├── actionlist.md
│   │   ├── project-activity-status.json (v6.1+ JSON format)
│   │   ├── augmented_specification.md
│   │   ├── prototype_ui.md
│   │   └── README.md
│   └── robot-notes/            ← NEW: Standard notes templates
│       ├── current_work.md
│       ├── completed_features.md
│       ├── blockers.md
│       └── README.md
├── scripts/
│   ├── create-robot.sh         ← NEW: Robot generator script
│   └── README.md
├── guide-robot-setup.md        ← NEW: How to create/recreate robots
└── [existing role docs remain]

/robot_chaperone/               ← EPHEMERAL
├── .claude/
│   └── CLAUDE.md               → symlink to ROME/templates/claude-md/chaperone.md
├── notes/                      (gitignored, project-specific)
│   ├── .gitkeep                (tracked)
│   ├── current_work.md         (gitignored)
│   ├── completed_features.md   (gitignored)
│   └── blockers.md             (gitignored)
├── README.md                   → symlink to ROME/role-chaperone.md
└── __start.sh                  (can stay, ephemeral helper)

/robot_pma/                     ← EPHEMERAL
├── .claude/
│   ├── CLAUDE.md               → symlink to ROME/templates/claude-md/pma.md
│   └── settings.local.json     (gitignored)
├── notes/                      (gitignored, project-specific)
│   ├── .gitkeep                (tracked)
│   ├── current_work.md         (gitignored)
│   ├── completed_features.md   (gitignored)
│   └── blockers.md             (gitignored)
└── README.md                   → symlink to ROME/role-pma.md
```

---

## 4. BENEFITS

### Single Source of Truth ✅
- All authoritative content in `/ROME/`
- Robot directories are generated/ephemeral
- Updates propagate to all robots via symlinks

### Easy Regeneration ✅
```bash
rm -rf robot_pma
./ROME/scripts/create-robot.sh pma
# Robot recreated instantly from templates
```

### Version Control Clarity ✅
- Templates tracked in git
- Project-specific notes gitignored
- No duplication across robot directories

### Scalability ✅
- Add new robot: Create template in `/ROME/templates/claude-md/`
- Run `create-robot.sh <name>`
- Done

---

## 5. MIGRATION CHECKLIST

### Preparation
- [ ] Backup robot_chaperone/ and robot_pma/
- [ ] Review all files in robot directories
- [ ] Confirm nothing project-specific in CLAUDE.md or README.md

### Execute Phase 1 (Templates)
- [ ] Create `/ROME/templates/claude-md/`
- [ ] Move robot_chaperone/CLAUDE.md → chaperone.md
- [ ] Create comprehensive pma.md template
- [ ] Create `/ROME/templates/project/`
- [ ] Reorganize existing /ROME/template-* files
- [ ] Create `/ROME/templates/robot-notes/`
- [ ] Create standardized note templates

### Execute Phase 2 (Scripts)
- [ ] Create `/ROME/scripts/create-robot.sh`
- [ ] Test script with: `./create-robot.sh test_robot`
- [ ] Verify symlinks work correctly
- [ ] Delete test robot

### Execute Phase 3 (Restructure Existing)
- [ ] Update robot_chaperone/ to use symlinks
- [ ] Update robot_pma/ to use symlinks
- [ ] Remove robot_pma/templates/
- [ ] Verify robots still functional

### Execute Phase 4 (Gitignore)
- [ ] Update root `.gitignore`
- [ ] Run `git status` to confirm correct ignores
- [ ] Commit .gitkeep files for structure

### Execute Phase 5 (Documentation)
- [ ] Create `/ROME/guide-robot-setup.md`
- [ ] Update `/ROME/start-here.md` to reference new structure
- [ ] Update `/ROME/guide-robot-naming-conventions.md`

### Validation
- [ ] Test creating new robot from scratch
- [ ] Test editing template and seeing change in robot
- [ ] Test robot functionality unchanged
- [ ] Confirm gitignore working correctly
- [ ] Review all symlinks valid

### Cleanup
- [ ] Remove old template files from root /ROME/
- [ ] Update documentation references
- [ ] Commit all changes
- [ ] Push to remote

---

## 6. ROLLBACK PLAN

If issues occur:

1. **Restore backups:**
   ```bash
   cp -r robot_chaperone.backup robot_chaperone
   cp -r robot_pma.backup robot_pma
   ```

2. **Remove symlinks:**
   ```bash
   find robot_* -type l -delete
   ```

3. **Restore original files**

4. **Document what went wrong**

---

## 7. SUCCESS CRITERIA

Restructure considered successful when:

- [ ] All robot CLAUDE.md files are symlinks to `/ROME/templates/`
- [ ] All robot README.md files are symlinks to `/ROME/roles/`
- [ ] `create-robot.sh` successfully creates functional robots
- [ ] Robots work identically to before restructure
- [ ] No authoritative content remains in robot directories
- [ ] Templates can be updated centrally
- [ ] Documentation reflects new structure

---

**Next Step:** Review this plan, then execute Phase 1 (create template directories and move files).
