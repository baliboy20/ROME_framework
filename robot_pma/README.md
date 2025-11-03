# robot_pma - Project Manager/Architect

**Role**: Project Manager/Architect (PMA)
**Directory**: `/robot_pma/`

## What is robot_pma?

The Project Manager/Architect (PMA) is responsible for:

1. **Requirements Analysis** - Deep dive into refined specifications from Chaperone Phase 1
2. **Data-First Design** - Create comprehensive data models
3. **Use Case Definition** - Document user workflows and stories
4. **Feature Decomposition** - Break down features into vertical slices
5. **Design Integration Planning** - Plan integration test strategy
6. **Project Setup** - Create project structure and coordination files
7. **Action List Creation** - Assign work to development robots

## ROME Phase Involvement

- **Phase 2**: Functional Design & Planning (PMA's primary work)
  - Steps 1-6: Deep requirements analysis through action list creation
  - Produces: `data_model.md`, `use_cases.md`, `actionlist.md`

- **Phase 2B**: Collaborates with Chaperone for design validation

## Key Artifacts Created

Located in `PROJECT/dev/`:

- `data_model.md` - Core entities, relationships, validation rules
- `use_cases.md` - User workflows and acceptance criteria
- `actionlist.md` - Robot assignments and feature breakdown
- `project_activity.status` - Progress tracking (updated by all robots)

## Directory Structure

```
robot_pma/
├── .claude/
│   ├── CLAUDE.md                (Instructions for robot_pma)
│   └── settings.local.json      (Configuration)
├── notes/
│   ├── current_work.md          (In-progress tasks)
│   ├── completed_features.md    (Completed deliverables)
│   └── blockers.md              (Issues & dependencies)
├── templates/
│   ├── [PMA templates go here]
│   └── README.md                (Template documentation)
└── README.md                     (This file)
```

## Quick Start

1. **Read the methodology**: `ROME/ROME-4.0-COMPLETE-GUIDE.md`
2. **Understand the process**: `ROME/start-here.md`
3. **Check current work**: `notes/current_work.md`
4. **Review blockers**: `notes/blockers.md`

## Key Resources

- **[ROME-4.0-COMPLETE-GUIDE.md](../ROME/ROME-4.0-COMPLETE-GUIDE.md)** - Complete methodology
- **[role-pma.md](../ROME/role-pma.md)** - Detailed PMA role specification
- **[guide-robot-naming-conventions.md](../ROME/guide-robot-naming-conventions.md)** - Robot coordination
- **[start-here.md](../ROME/start-here.md)** - Phase-by-phase execution

## Coordination With Other Robots

```
PHASE 1: robot_chaperone
  └─→ Produces: specification_augmented.md

PHASE 2: robot_pma (YOU)
  ├─ Reads: specification_augmented.md
  ├─ Creates: data_model.md, use_cases.md, actionlist.md
  └─ Coordinates with: robot_clara (for design validation)

PHASE 2B: robot_chaperone (Design Validation)
  ├─ Reads: Your data_model.md, use_cases.md, design artifacts
  └─ Produces: design_approval.md (Can BLOCK Phase 3)

PHASE 3: Development Robots (If approved)
  ├─ robot_ashok (Data Layer)
  ├─ robot_reena (Backend Layer)
  ├─ robot_charlie (Frontend Layer)
  └─ robot_clara (UX Validation throughout)
```

## Success Criteria

✅ You've done your job well when:

- Data model is clear, complete, and reflects business domain
- Use cases cover all user workflows
- Action list is specific and assignable to robots
- Integration test strategy is documented
- Chaperone approves the design (Phase 2B)
- Development robots can start Phase 3 work immediately

---

**Last Updated**: 2025-11-03
**Version**: ROME 4.0
