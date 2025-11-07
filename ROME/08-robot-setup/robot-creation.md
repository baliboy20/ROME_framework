# Robot Setup Guide

**Version:** 5.0
**Date:** 2025-11-06
**Purpose:** How to create and manage robot directories in ROME

---

## Quick Start

Create any robot directory from templates:

```bash
./ROME/scripts/create-robot.sh <name>
```

**Example:**
```bash
./ROME/scripts/create-robot.sh pma
```

This creates a fully configured robot directory with symlinks to templates.

---

## Available Robots

| Name | Directory | Role | Phase |
|------|-----------|------|-------|
| **pma** | robot_pma | Project Manager/Architect | Phase 2 |
| **chaperone** | robot_chaperone | Specification Specialist | Phase 2B |
| **htm_decomposer** | robot_htm_decomposer | HTM Requirements Engineer | Phase 1 |
| **clara** | robot_clara | UX Designer | Phase 2A |
| **charlie** | robot_charlie | Frontend Developer | Phase 3 |
| **reena** | robot_reena | Backend Engineer | Phase 3 |
| **ashok** | robot_ashok | Data Architect | Phase 3 |

---

## Manual Setup

If you prefer to create robot directories manually:

### 1. Create Directory Structure

```bash
mkdir -p robot_<name>/.claude
mkdir -p robot_<name>/notes
```

### 2. Link CLAUDE.md Template

```bash
ln -sf ../../ROME/templates/claude-md/<name>.md robot_<name>/.claude/CLAUDE.md
```

### 3. Link README from Role Doc

```bash
ln -sf ../role-<name>.md robot_<name>/README.md
```

### 4. Copy Notes Templates

```bash
cp ROME/templates/robot-notes/*.md robot_<name>/notes/
```

### 5. Create .gitignore

```bash
cat > robot_<name>/.gitignore <<EOF
# Project-specific files (not in git)
notes/current_work.md
notes/completed_features.md
notes/blockers.md
.claude/settings.local.json

# Keep structure in git
!notes/.gitkeep
!.claude/.gitkeep
EOF
```

### 6. Create .gitkeep Files

```bash
touch robot_<name>/notes/.gitkeep
touch robot_<name>/.claude/.gitkeep
```

---

## Robot Directory Structure

```
robot_<name>/
├── .claude/
│   ├── CLAUDE.md              → symlink to ROME/templates/claude-md/<name>.md
│   ├── settings.local.json    (gitignored, project-specific)
│   └── .gitkeep               (tracked)
├── notes/
│   ├── current_work.md        (gitignored, project-specific)
│   ├── completed_features.md  (gitignored, project-specific)
│   ├── blockers.md            (gitignored, project-specific)
│   └── .gitkeep               (tracked)
├── README.md                  → symlink to role-<name>.md
└── .gitignore
```

**Key points:**
- `.claude/CLAUDE.md` and `README.md` are **symlinks** (not real files)
- `notes/*.md` files are **gitignored** (project-specific)
- `.gitkeep` files are **tracked** (maintain structure)

---

## Understanding Symlinks

### What is a Symlink?

A symlink (symbolic link) is a pointer to another file. When you edit a symlink, you're actually editing the target file.

### Why Symlinks?

**Single Source of Truth:**
- Templates in `/ROME/templates/` are authoritative
- Robot directories reference templates via symlinks
- Updates to templates propagate to all robots automatically

**Example:**
```bash
# Edit template (single source of truth)
nano ROME/templates/claude-md/pma.md

# Change appears in ALL robot_pma instances
# Because robot_pma/.claude/CLAUDE.md → ROME/templates/claude-md/pma.md
```

### Verifying Symlinks

```bash
ls -la robot_pma/.claude/CLAUDE.md
# Output: robot_pma/.claude/CLAUDE.md -> ../../ROME/templates/claude-md/pma.md
```

The `->` indicates it's a symlink.

---

## Customization

### Updating Robot Instructions

**✅ Correct way (edit template):**
```bash
nano ROME/templates/claude-md/pma.md
# Changes apply to all robot_pma instances
```

**❌ Wrong way (edit symlink directly):**
```bash
nano robot_pma/.claude/CLAUDE.md
# This edits the template anyway, but confusing
```

### Creating New Robot Template

1. **Create template:**
   ```bash
   cp ROME/templates/claude-md/_base-template.md ROME/templates/claude-md/newbot.md
   nano ROME/templates/claude-md/newbot.md
   ```

2. **Create role doc:**
   ```bash
   cp role-pma.md role-newbot.md
   nano role-newbot.md
   ```

3. **Generate robot:**
   ```bash
   ./ROME/scripts/create-robot.sh newbot
   ```

---

## Project-Specific Files

These files are gitignored and project-specific:

### notes/current_work.md
**Purpose:** Track what robot is currently working on
**Updated:** Continuously

### notes/completed_features.md
**Purpose:** Log of finished features
**Updated:** When features complete

### notes/blockers.md
**Purpose:** Track blocking issues
**Updated:** When blockers identified/resolved

### .claude/settings.local.json
**Purpose:** Robot-specific settings (if needed)
**Updated:** As configuration changes

**These files should NOT be committed to git** - they're project-specific state.

---

## Regenerating Robot Directories

Robot directories are **ephemeral** - they can be recreated anytime.

### To Recreate from Scratch

```bash
# Delete robot directory
rm -rf robot_pma

# Regenerate from templates
./ROME/scripts/create-robot.sh pma

# Robot directory recreated with all templates
```

**What's lost:** Only project-specific notes (current_work.md, etc.)
**What's preserved:** All templates (they're in /ROME/)

---

## Troubleshooting

### Symlink Broken

**Symptom:** File not found when opening CLAUDE.md

**Fix:**
```bash
# Remove broken symlink
rm robot_pma/.claude/CLAUDE.md

# Recreate symlink
ln -sf ../../ROME/templates/claude-md/pma.md robot_pma/.claude/CLAUDE.md
```

### Template Not Found

**Symptom:** Script says "No template found"

**Fix:** Create template first:
```bash
cp ROME/templates/claude-md/_base-template.md ROME/templates/claude-md/<name>.md
# Edit template
./ROME/scripts/create-robot.sh <name>
```

### Changes Not Appearing

**Issue:** Edited robot file but changes don't show

**Check:** Are you editing a symlink?
```bash
ls -la robot_pma/.claude/CLAUDE.md
# If it shows "->", you're editing the template (correct)
```

---

## Best Practices

### 1. Always Edit Templates

**Don't edit:**
- `robot_*/...CLAUDE.md` (it's a symlink)
- `robot_*/README.md` (it's a symlink)

**Do edit:**
- `ROME/templates/claude-md/<name>.md`
- `role-<name>.md`

### 2. Don't Commit Project Files

**Gitignored (don't commit):**
- `robot_*/notes/current_work.md`
- `robot_*/notes/completed_features.md`
- `robot_*/notes/blockers.md`
- `robot_*/.claude/settings.local.json`

**Tracked (do commit):**
- `robot_*/notes/.gitkeep`
- `robot_*/.claude/.gitkeep`
- `robot_*/.gitignore`

### 3. Use Script for Consistency

**Always use:**
```bash
./ROME/scripts/create-robot.sh <name>
```

**Not:**
```bash
mkdir robot_<name>
# ... manual setup (error-prone)
```

### 4. Document Robot Names

**Robots known by human names:**
- Charlie (Frontend)
- Reena (Backend)
- Ashok (Data)
- Clara (UX)
- PMA (Project Manager)
- Chaperone (Specification Specialist)

See `/ROME/guide-robot-naming-conventions.md` for full details.

---

## Integration with ROME Workflow

### Phase 1: HTM Decomposer
```bash
./ROME/scripts/create-robot.sh htm_decomposer
cd robot_htm_decomposer
# Start Phase 1 work
```

### Phase 2: PMA
```bash
./ROME/scripts/create-robot.sh pma
cd robot_pma
# Start Phase 2 work
```

### Phase 2A: UX Clara
```bash
./ROME/scripts/create-robot.sh clara
cd robot_clara
# Start Phase 2A work
```

### Phase 2B: Chaperone
```bash
./ROME/scripts/create-robot.sh chaperone
cd robot_chaperone
# Start Phase 2B validation
```

### Phase 3: Development Robots
```bash
./ROME/scripts/create-robot.sh ashok
./ROME/scripts/create-robot.sh reena
./ROME/scripts/create-robot.sh charlie
# Start Phase 3 development
```

---

## Related Documentation

- `/ROME/templates/claude-md/README.md` - CLAUDE.md template documentation
- `/ROME/templates/project/README.md` - Project artifact templates
- `/ROME/templates/robot-notes/README.md` - Robot notes documentation
- `/ROME/guide-robot-naming-conventions.md` - Robot naming standards
- `/ROME/ROBOT-DIRECTORY-RESTRUCTURE-PLAN.md` - Architecture rationale

---

## FAQ

**Q: Can I have multiple instances of the same robot?**
A: Yes, create: `robot_pma_project1/`, `robot_pma_project2/`

**Q: Do I need to recreate robots for each project?**
A: Yes - robot directories are project-specific

**Q: What if I want robot-specific customization?**
A: Use `.claude/settings.local.json` (gitignored)

**Q: Can I use robots without Claude Code?**
A: Yes - methodology works with any AI tool or human roles

**Q: How do I know which robot to use for a task?**
A: See `/ROME/start-here.md` for phase-by-phase workflow

---

**Status:** Active
**Last Updated:** 2025-11-06
