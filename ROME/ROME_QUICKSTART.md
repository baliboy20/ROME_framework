# ROME Quick Start Guide

## Setup in 5 Minutes

### 1. Create Project Structure
```bash
mkdir -p PROJECT/{SOURCE/{backend,frontend,database,tests},dev}
mkdir -p claude_{pma,backend,frontend,data,devops,coordinator}
```

### 2. Initialize Tracking Files
```bash
touch PROJECT/dev/actionlist.md
touch PROJECT/dev/project_activity.status
touch PROJECT/dev/project_tasks.log
```

### 3. Create CLAUDE.md for Each Rodeo
In each `claude_*` directory, create a CLAUDE.md file:

```markdown
Execute the following tasks:
1) Read all documents in ../ROME folder
2) Determine session purpose (new/modify/review)
3) Read your tasks in ../actionlist.md
4) Execute the plan following ROME methodology
```

### 4. 🚨 CRITICAL: Create Startup Scripts
**FAILURE TO DO THIS STEP WILL BREAK ROBOT LAUNCHES**

In each `claude_*` directory, create an executable `__start.sh` file:

```bash
#!/bin/bash

# Claude Code startup script that automatically executes CLAUDE.md instructions

echo "execute CLAUDE.md instructions" | claude "$@"
```

Make scripts executable:
```bash
chmod +x claude_*/__start.sh
```

**Why This is Critical**: Without `__start.sh`, robots cannot auto-execute their CLAUDE.md instructions, causing project launch failures.

### 5. 🚨 CRITICAL: Create Robot Permission Files
**ROBOTS WILL HAVE WRONG PERMISSIONS WITHOUT THIS STEP**

In each `claude_*/.claude/` directory, create role-specific `settings.local.json`:

```bash
mkdir -p claude_*/.claude
```

Create permission files for each robot based on their role:
- **Database robots**: `Write(**/SOURCE/database/**)`
- **Backend robots**: `Write(**/SOURCE/backend/**)`  
- **Frontend robots**: `Write(**/SOURCE/frontend/**)`
- **Coordinator robots**: `Write(**/PROJECT/dev/**)`

**Why This is Critical**: Without role-specific permissions, robots cannot access their assigned directories or will have excessive permissions violating security boundaries.

## Your First ROME Project (TDD-Enhanced)

### Step 1: Define Requirements
Create a simple requirements document describing what you want to build.

### Step 2: Launch PMA (Project Manager/Architect)
The PMA will:
- Analyze requirements
- Design architecture with testable contracts
- **NEW**: Define interface tests for all robots
- Create actionlist.md with test-first tasks
- Set up project structure with test directories

### Step 2.5: Contract Definition Phase (NEW)
**All robots collaborate to define contracts:**
```bash
# PMA creates contract test templates
mkdir -p SOURCE/tests/contracts/{api,database,ui,integration}

# Each robot reviews and approves their contract tests
# Contract tests must be failing (red) before implementation
```

### Step 3: Launch Rodeos
Each Rodeo reads its tasks from actionlist.md and begins work:
```bash
# Launch individual Rodeos using startup scripts
cd claude_coordinator && ./__start.sh
cd ../claude_backend && ./__start.sh  
cd ../claude_frontend && ./__start.sh
```

**Note**: Always ensure `__start.sh` scripts exist and are executable before launching!

### Step 4: Monitor Progress
Check `PROJECT/dev/project_activity.status` for real-time updates:
```
Module: Authentication | Status: IN_PROGRESS | Rodeo: backend
Module: Login UI | Status: COMPLETED | Rodeo: frontend  
Module: User Schema | Status: BLOCKED | Rodeo: data
```

## Common Commands

### Check Status
```bash
tail -f PROJECT/dev/project_activity.status
```

### View Task Log
```bash
cat PROJECT/dev/project_tasks.log
```

### Update Task Status
Rodeos automatically update actionlist.md:
```markdown
- [x] COMPLETED: Create user model
- [ ] IN_PROGRESS: Implement auth endpoints
- [ ] BLOCKED: Deploy to staging (waiting for DevOps)
```

## Troubleshooting

### Rodeo Can't Find Tasks
- Check actionlist.md exists and has assigned tasks
- Verify Rodeo is reading from correct directory

### Robot Launch Failures  
- **Missing `__start.sh`**: Create executable startup script in robot directory
- **Permission denied**: Run `chmod +x __start.sh` to make executable
- **Script not found**: Verify `__start.sh` exists in each `claude_*` directory

### Module Conflicts
- Ensure clear module boundaries in design
- Check interface definitions between modules

### Status Not Updating
- Verify write permissions on tracking files
- Check Rodeo has access to PROJECT/dev/

## Tips for Success

1. **Start Small**: Begin with 2-3 modules
2. **Clear Boundaries**: Define interfaces upfront
3. **Regular Syncs**: Check status frequently
4. **Document Issues**: Update actionlist.md with blockers

## Example: Todo App

```markdown
# actionlist.md example
## Backend (Reena)
- [ ] Create Todo model
- [ ] Implement CRUD endpoints
- [ ] Add authentication

## Frontend (Charlie)  
- [ ] Create Todo list component
- [ ] Add create/edit forms
- [ ] Integrate with API

## Database (Ashok)
- [ ] Design schema
- [ ] Create migrations
- [ ] Set up indexes
```

## GitHub Actions Integration (Optional)

For automated quality enforcement:
```bash
# Copy CI/CD workflows
mkdir -p .github/workflows
cp ROME/.github/workflows/* .github/workflows/

# Set up helper scripts
cp ROME/scripts/* scripts/
chmod +x scripts/*.sh

# Configure branch protection
# Enable required status checks for Roma enforcement
```

## Next Steps

- Review [ROME_REFERENCE.md](ROME_REFERENCE.md) for detailed protocols
- **NEW**: Set up [ROME_CICD_GUIDE.md](ROME_CICD_GUIDE.md) for automated quality gates
- Check role specifications for specialized Rodeo configurations
- Join the ROME community for support