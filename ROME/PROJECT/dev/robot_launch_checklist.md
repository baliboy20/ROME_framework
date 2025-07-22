# Robot Launch Checklist
## Farm Weather App PoC

### Pre-Launch Verification

#### Environment Setup
- [x] PROJECT/dev directory created
- [x] SOURCE directory created at correct location (../../PROJECT/SOURCE/)
- [x] All robot directories created (rodeo_reena, rodeo_charlie, rodeo_luc, rodeo_roma)
- [x] CLAUDE.md files in place for each robot
- [x] .claude/settings.local.json files in each directory
- [x] __start.sh launch scripts in each directory
- [x] MCP server references removed
- [x] Port configuration documented (3301, 3302, 8094)

#### Documentation Ready
- [x] Technical architecture document
- [x] Actionlist.md with Critical Path Analysis
- [x] Project activity status initialized
- [x] Project tasks log initialized
- [x] Port configuration guide

### Robot Launch Sequence

#### 1. DevOps Robot (Luc) - LAUNCH FIRST
**Directory**: `../rodeo_luc/`
**Launch Command**: `cd ../rodeo_luc && ./__start.sh`
**Critical Tasks**:
- Initialize project repository structure (BLOCKING)
- Set up development environment configuration (BLOCKING)
- Configure Git repository

**Verification**:
- [ ] Robot reads CLAUDE.md successfully
- [ ] Robot creates SOURCE directory structure
- [ ] Robot updates project_activity.status
- [ ] Robot logs activities in project_tasks.log

#### 2. Backend Robot (Reena) - LAUNCH AFTER DEVOPS
**Directory**: `../rodeo_reena/`
**Launch Command**: `cd ../rodeo_reena && ./__start.sh`
**Critical Tasks**:
- Initialize Node.js project with Express
- Create Express server on port 3301
- Implement weather API endpoint

**Dependencies**: Wait for DevOps project structure
**Verification**:
- [ ] Robot reads CLAUDE.md successfully
- [ ] Robot works in ../../PROJECT/SOURCE/backend/
- [ ] Robot implements correct port (3301)
- [ ] Robot updates tracking files

#### 3. Frontend Robot (Charlie) - LAUNCH WITH BACKEND
**Directory**: `../rodeo_charlie/`
**Launch Command**: `cd ../rodeo_charlie && ./__start.sh`
**Critical Tasks**:
- Create HTML/CSS/JS structure
- Implement weather button
- Connect to backend API at localhost:3301

**Dependencies**: Project structure from DevOps
**Verification**:
- [ ] Robot reads CLAUDE.md successfully
- [ ] Robot works in PROJECT/SOURCE/frontend/
- [ ] Robot uses correct backend URL
- [ ] Robot updates tracking files

#### 4. Project Coordinator (Roma) - LAUNCH WITH OTHERS
**Directory**: `../rodeo_roma/`
**Launch Command**: `cd ../rodeo_roma && ./__start.sh`
**Critical Tasks**:
- Monitor progress of all robots
- Facilitate communication between robots
- Track task completion and blockers
- Update project coordination status

**Dependencies**: Can launch anytime, monitors others
**Verification**:
- [ ] Robot reads CLAUDE.md successfully
- [ ] Robot begins monitoring other robots' progress
- [ ] Robot updates project coordination status
- [ ] Robot facilitates any needed communication

### Integration Checkpoints

#### Checkpoint 1: Project Structure
- [ ] SOURCE/backend/ exists
- [ ] SOURCE/frontend/ exists
- [ ] SOURCE/tests/ exists
- [ ] Git repository initialized

#### Checkpoint 2: Module Readiness
- [ ] Backend server running on port 3301
- [ ] Frontend files created
- [ ] API endpoint responding

#### Checkpoint 3: Integration
- [ ] Frontend can call backend
- [ ] Weather button functional
- [ ] Error handling in place

### Monitoring During Execution

#### Active Monitoring Files
1. **project_activity.status** - Check module status updates
2. **project_tasks.log** - Monitor task completion (shared)
3. **actionlist.md** - Track task progress
4. **Individual Robot Logs**:
   - **robot_activity_luc.log** - DevOps robot detailed activity
   - **robot_activity_reena.log** - Backend robot detailed activity
   - **robot_activity_charlie.log** - Frontend robot detailed activity
   - **robot_activity_roma.log** - Coordinator robot detailed activity

#### PMA Responsibilities
- [ ] Monitor for blockers
- [ ] Coordinate integration points
- [ ] Resolve conflicts between robots
- [ ] Update stakeholders on progress

### Post-Launch Actions

#### After All Robots Running
- [ ] Verify all robots following ROME protocol
- [ ] Check for any dependency conflicts
- [ ] Monitor integration readiness
- [ ] Prepare for testing phase

#### Success Indicators
- All robots actively working
- No blocking issues reported
- Tasks progressing per dependencies
- Regular status updates in tracking files

---

*Use this checklist to ensure smooth robot launch and coordination*