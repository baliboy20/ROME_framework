# Project Artifact Templates

This directory contains templates for project deliverables used throughout ROME workflow.

## Available Templates

| Template | Created By | Phase | Description |
|----------|------------|-------|-------------|
| **data_model.md** | PMA | Phase 2 | Database schema and entity definitions |
| **use_cases.md** | PMA | Phase 2 | User workflows and scenarios |
| **actionlist.md** | PMA | Phase 2 | Feature assignments to robots |
| **activity_status.txt** | All Robots | Throughout | Project activity log |
| **augmented_specification.md** | Chaperone | Phase 1/2B | Enhanced technical specification |
| **prototype_ui.md** | UX Clara | Phase 2A | UI designs and wireframes |

## Usage

### For Robots

When creating deliverables:
```bash
cp /ROME/templates/project/<template>.md PROJECT/dev/<output>.md
# Fill in [PLACEHOLDER] sections
```

### For Users

Templates define expected structure and content for each deliverable.

## Template Locations

**Outputs go to:**
- `PROJECT/dev/` - Technical artifacts (data model, use cases, action list)
- `PROJECT/design/` - UX artifacts (prototype UI, wireframes)
- `PROJECT/requirements/` - HTM artifacts (YAML files from Phase 1)

## Notes

- Follow template structure for consistency
- Include all required sections
- Document assumptions and decisions
- Keep templates updated as methodology evolves
