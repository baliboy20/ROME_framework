# Project Directory Structure

## Overview
The Medium Flutter Link Extractor project uses the ROME methodology with robots located in the parent directory.

## Current Structure
```
/Users/will/flutterProjects/Exercises/july/zz_robot_army/
├── claude_backend_reena/           # Backend robot (Node.js/Express)
│   ├── CLAUDE.md
│   └── .claude/
│       ├── commands/
│       │   └── run-instructions.md
│       └── settings.local.json
├── claude_frontend_charlie/        # Frontend robot (Flutter Web)
│   ├── CLAUDE.md
│   └── .claude/
├── claude_data_ashok/              # Data architect robot (MongoDB)
│   ├── CLAUDE.md
│   └── .claude/
├── claude_devops_luc/              # DevOps robot (Docker/Infrastructure)
│   ├── CLAUDE.md
│   └── .claude/
├── claude_coordinator_roma/        # Project coordinator robot
│   ├── CLAUDE.md
│   └── .claude/
└── ROME/                          # ROME methodology files
    ├── SOURCE/                    # All source code
    │   ├── backend/
    │   ├── frontend/
    │   ├── database/
    │   ├── infrastructure/
    │   └── tests/
    ├── PROJECT/                   # Project management files
    │   ├── dev/
    │   │   ├── actionlist.md
    │   │   ├── project_activity.status
    │   │   ├── project_tasks.log
    │   │   └── [other docs]
    │   └── user_docs/
    │       ├── medium-flutter-extractor-spec.md
    │       └── medium-extractor-tech-spec.md
    ├── role_spec_*.md             # Robot role specifications
    ├── ROME_*.md                  # Methodology documentation
    └── [other ROME files]
```

## Key Points

### Robot Locations
- All robots are in the parent directory: `/Users/will/flutterProjects/Exercises/july/zz_robot_army/`
- Each robot references ROME files using `./ROME/` paths
- Source code goes in `./ROME/SOURCE/` directories
- Project tracking files are in `./ROME/PROJECT/dev/`

### Path References
From robot directories, paths are:
- ROME docs: `./ROME/`
- Source code: `./ROME/SOURCE/`
- Project files: `./ROME/PROJECT/`
- Action list: `./ROME/PROJECT/dev/actionlist.md`

### Permission Boundaries
Each robot has specific permissions:
- **Backend**: `**/ROME/SOURCE/backend/**`, `**/ROME/SOURCE/tests/**`
- **Frontend**: `**/ROME/SOURCE/frontend/**`, `**/ROME/SOURCE/tests/**`
- **Data**: `**/ROME/SOURCE/database/**`
- **DevOps**: `**/ROME/SOURCE/infrastructure/**`, config files
- **Coordinator**: `**/ROME/PROJECT/dev/**`

## Launch Process
1. Navigate to robot directory in parent folder
2. Run `/run-instructions` command
3. Robot reads CLAUDE.md and begins assigned tasks