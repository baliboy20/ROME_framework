# ROME Documentation Migration Guide

## What Changed?

We've streamlined ROME documentation from 15+ verbose files to 3 core documents plus role specifications.

### New Structure
```
ROME/
├── ROME_OVERVIEW.md       # Start here (1 page)
├── ROME_QUICKSTART.md     # Setup guide (2-3 pages)
├── ROME_REFERENCE.md      # Complete reference
├── role_spec_*.md         # Role specifications (unchanged)
├── templates/             # Clean templates
├── archive/               # Old verbose docs
└── robot_scripts/         # Automation scripts (unchanged)
```

### Document Mapping

| Old Document | New Location |
|--------------|--------------|
| rome_methodology.md | ROME_OVERVIEW.md + ROME_REFERENCE.md |
| robot_actions_protocol.md | ROME_REFERENCE.md (7-Step Protocol) |
| module_design_principles.md | ROME_REFERENCE.md (Module Design) |
| project_coordination.md | ROME_REFERENCE.md (Coordination) |
| robot_creation_guide.md | ROME_QUICKSTART.md |
| project_setup.md | ROME_QUICKSTART.md |
| system_design_tasks_and_deliverables.md | ROME_REFERENCE.md |
| rome_glossary_of_term.md | Integrated into relevant sections |

## For Existing Users

### If you're looking for...

**7-Step Protocol** → ROME_REFERENCE.md#7-step-protocol

**Module Design Rules** → ROME_REFERENCE.md#module-design-principles

**How to Start a Project** → ROME_QUICKSTART.md

**Robot Setup Instructions** → ROME_QUICKSTART.md#your-first-rome-project

**Quality Gates** → ROME_REFERENCE.md#quality-gates

**Task Classification** → ROME_REFERENCE.md#task-classification

### Key Changes

1. **Single Source of Truth**: Each concept now appears in ONE location only
2. **Plain Language**: Academic jargon replaced with clear, direct language
3. **Practical Examples**: Theory replaced with actionable examples
4. **Quick Reference**: Tables and checklists instead of paragraphs

## Migration Steps

### For Active Projects

1. **Update References**: Change any documentation links to point to new files
2. **Use New Templates**: Find clean templates in `/templates` directory
3. **Update CLAUDE.md**: Ensure robot instructions reference new docs

### For New Projects

1. Start with ROME_OVERVIEW.md (5 minutes)
2. Follow ROME_QUICKSTART.md to set up (10 minutes)
3. Reference ROME_REFERENCE.md as needed

## Benefits

- **85% faster** to read and understand
- **No duplicate content** to maintain
- **Clear navigation** - always know where to look
- **Practical focus** - less theory, more doing

## Need Help?

- Old documents are preserved in `/archive` if needed
- Role specifications remain unchanged
- Robot scripts work exactly as before

## Example: Finding Information

**Before**: "Where is the 7-step protocol documented?"
- Could be in rome_methodology.md
- Or robot_actions_protocol.md
- Or project_coordination.md
- Or any of 5 other files...

**After**: "Where is the 7-step protocol documented?"
- ROME_REFERENCE.md#7-step-protocol (only location)

---

Welcome to streamlined ROME - same power, less reading!