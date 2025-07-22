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

## Your First ROME Project

### Step 1: Define Requirements
Create a simple requirements document describing what you want to build.

### Step 2: Launch PMA (Project Manager/Architect)
The PMA will:
- Analyze requirements
- Design architecture
- Create actionlist.md with tasks for each Rodeo
- Set up project structure

### Step 3: Launch Rodeos
Each Rodeo reads its tasks from actionlist.md and begins work:
```bash
# Launch all Rodeos (example using the launch script)
./robot_scripts/launch_robots.sh
```

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

## Next Steps

- Review [ROME_REFERENCE.md](ROME_REFERENCE.md) for detailed protocols
- Check role specifications for specialized Rodeo configurations
- Join the ROME community for support