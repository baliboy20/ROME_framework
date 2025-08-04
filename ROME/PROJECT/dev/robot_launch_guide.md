# Robot Launch Guide - Medium Flutter Link Extractor

## Project Status: DEVELOPMENT READY ✅

Each robot has been configured with ROME methodology startup scripts and role-specific permissions.

### Current Robot Team

**NEW ROME ROBOTS** (configured for this project):
   - `../claude_reena/` - Backend Developer (Reena)
   - `../claude_charlie/` - Frontend Developer (Charlie)  
   - `../claude_ashok/` - Data Architect (Ashok)
   - `../claude_luc/` - DevOps Engineer (Luc)
   - `../claude_roma/` - Project Coordinator (ROMA)

**LEGACY ROBOTS** (from previous sessions):
   - `../claude_backend_reena/` - Old backend robot
   - `../claude_frontend_charlie/` - Old frontend robot
   - Other legacy directories

### Launch Instructions (NEW ROME ROBOTS)

Use the **NEW** robots for this project. They have updated CLAUDE.md files and proper permissions.

**Launch Method**:
```bash
cd ../claude_[robot_name] && ./__start.sh
```

**Examples**:
```bash
# Launch data architect (ROME-compliant)
cd ../claude_ashok && ./Start.sh

# Launch backend developer
cd ../claude_reena && ./__start.sh

# Launch frontend developer  
cd ../claude_charlie && ./__start.sh
```

**Note**: Ashok (Data Architect) has been recreated following proper ROME methodology with:
- `Start.sh` script (opens iTerm)
- `startclaude.sh` script (runs claude with bypass permissions)
- `.claude/commands/run-instructions.md` command file
- Proper data permissions configuration

3. The robot will automatically:
   - Read the CLAUDE.md file
   - Understand its role and responsibilities
   - Check the actionlist.md for assigned tasks
   - Begin executing tasks following the ROME 7-step protocol

### Updated Robot Directory Structure

Each robot directory now contains:
```
claude_[robot_name]/
├── CLAUDE.md                    # Robot instructions & tasks
├── Start.sh                     # Primary launch script (opens iTerm)
└── startclaude.sh              # Claude command with bypass permissions
```

### Script Details

**Start.sh**:
- Opens iTerm and executes the startclaude.sh script
- Provides terminal window management
- Handles cross-platform terminal launching

**startclaude.sh**:
- Executes: `claude --permission-mode bypassPermissions /run-instructions`
- Bypasses permission prompts for automated execution
- Runs the `/run-instructions` command automatically

### Execution Order

Based on critical path analysis:

1. **First Wave** (🔴 BLOCKING):
   - `claude_devops_luc` - Environment setup
   - `claude_data_ashok` - Database design

2. **Second Wave** (depends on First Wave):
   - `claude_backend_reena` - Authentication & services

3. **Parallel Execution**:
   - `claude_frontend_charlie` - Can start with First Wave
   - `claude_coordinator_roma` - Should run continuously

### Monitoring Progress

The coordinator (ROMA) and PMA can monitor progress through:
- `PROJECT/dev/project_activity.status`
- `PROJECT/dev/project_tasks.log`
- Individual robot activity logs

### Troubleshooting

If a robot fails to start:
1. Verify the `.claude/commands/run-instructions.md` file exists
2. Check permissions in `.claude/settings.local.json`
3. Ensure CLAUDE.md is present in the robot directory
4. Verify actionlist.md has tasks assigned to that robot