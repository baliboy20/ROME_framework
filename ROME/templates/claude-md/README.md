# CLAUDE.md Templates

This directory contains CLAUDE.md instruction templates for each robot role in ROME v5.0.

## Available Templates

| Template | Robot | Role | Phase |
|----------|-------|------|-------|
| **sarah.md** | robot_sarah | Specification Specialist | Phase 2B (Validation) |
| **pma.md** | robot_pma | Project Manager/Architect | Phase 2 (Architecture) |
| **htm-decomposer.md** | robot_htm_decomposer | HTM Decomposer | Phase 1 (Requirements) |
| **clara.md** | robot_clara | UX Designer | Phase 2A (Design) |
| **charlie.md** | robot_charlie | Frontend Developer | Phase 3 (Development) |
| **reena.md** | robot_reena | Backend Engineer | Phase 3 (Development) |
| **ashok.md** | robot_ashok | Data Architect | Phase 3 (Development) |

## Usage

### Creating a Robot Directory

Use the script:
```bash
./ROME/scripts/create-robot.sh <name>
```

Or manually:
```bash
mkdir -p robot_<name>/.claude
ln -sf ../../ROME/templates/claude-md/<name>.md robot_<name>/.claude/CLAUDE.md
```

### Updating Templates

**To update robot instructions:**
1. Edit the template in `/ROME/templates/claude-md/<name>.md`
2. Changes propagate automatically to all robot instances via symlink

**Do NOT edit:**
- `robot_<name>/.claude/CLAUDE.md` directly (it's a symlink)

## Template Structure

Each CLAUDE.md should include:

1. **Header** - Robot name, role, directory
2. **Mission** - High-level purpose
3. **Workflow** - Step-by-step instructions
4. **Resources** - References to docs, templates, MCPs
5. **User Interaction** - When/how to ask questions
6. **Success Criteria** - How to know work is complete

## Notes

- Templates are the single source of truth
- Robot directories are ephemeral and can be regenerated
- Keep templates consistent with role specifications in `/ROME/role-*.md`

## Base Template

`_base-template.md` provides a starting structure for creating new robot templates.
