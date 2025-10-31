# ROME Quick Start Guide
**Version**: 3.0 - Integration-First with Class Annotations
**Last Updated**: 2025-10-07

## Setup in 10 Minutes

### 1. Create Project Structure
```bash
mkdir -p PROJECT/SOURCE/{backend,frontend,database,tests/integration}
mkdir -p PROJECT/dev
mkdir -p claude_{pma,backend,frontend,data,coordinator}
```

### 2. Initialize Tracking Files
```bash
touch PROJECT/dev/data_model.md
touch PROJECT/dev/use_cases.md
touch PROJECT/dev/actionlist.md
touch PROJECT/dev/project_activity.status
touch PROJECT/dev/project_tasks.log
```

### 3. Create CLAUDE.md for Each Rodeo
In each `claude_*` directory:

```bash
cat > robot_reena/CLAUDE.md << 'EOF'
Execute the following tasks:

1) Read all documents in ../ROME folder
2) Read data model: ../PROJECT/dev/data_model.md
3) Read use cases: ../PROJECT/dev/use_cases.md
4) Read your tasks in ../PROJECT/dev/actionlist.md
5) Follow 6-step ROME protocol
6) Add class annotations to all code
7) Write integration tests at each layer
8) Update status in ../PROJECT/dev/project_activity.status

CRITICAL:
- All source code in ../PROJECT/SOURCE/
- Class annotations required: @Created, @Modified, @TestLevel, @Stable, @ComplexityLevel
- Integration tests before feature completion
- Get PMA approval for @Stable true changes
EOF
```

Repeat for other robots.

### 4. 🚨 CRITICAL: Create Startup Scripts
```bash
# Create executable startup script for each robot
for robot in pma backend frontend data coordinator; do
  cat > claude_${robot}/__start.sh << 'EOF'
#!/bin/bash
echo "execute CLAUDE.md instructions" | claude "$@"
EOF
  chmod +x claude_${robot}/__start.sh
done
```

### 5. 🚨 CRITICAL: Create Permission Files
```bash
# Create .claude directories
for robot in pma backend frontend data coordinator; do
  mkdir -p claude_${robot}/.claude
done

# Copy appropriate permission template to each robot
# See PERMISSIONS_SETUP_GUIDE.md for role-specific templates
```

---

## Your First ROME 4.0 Project

### ⚠️ CRITICAL: Read ROME-4.0-COMPLETE-GUIDE.md First

The complete execution order is documented in [ROME-4.0-COMPLETE-GUIDE.md](ROME-4.0-COMPLETE-GUIDE.md) - Part A.

**Quick reminder of correct order:**
1. 🎯 **Chaperone Phase 1** - Refine raw requirements into clear specs
2. 📋 **PMA Phases 1-9** - Design using refined specs
3. ✅ **Chaperone Phase 2** - Validate design is practical
4. 🚀 **Development Robots** - Build with validated specs

This quick start assumes Chaperone Phase 1 is already complete.

---

### Step 0: Launch Chaperone Phase 1 FIRST

**Create the user input directory and add your requirement documents:**

```bash
# Create directory for raw requirements
mkdir -p PROJECT/dev/_user_input

# Add your documents (create or copy):
# - product_requirements.md       (PRD, business needs)
# - use_cases.md                  (user workflows, user stories)
# - design_mockups/               (wireframes, screenshots - optional)
# - technical_specs.md            (technical constraints - optional)
# - business_context.md           (goals, constraints - optional)

# Example: Create a simple PRD
cat > PROJECT/dev/_user_input/product_requirements.md << 'EOF'
# Product Requirements Document

## Overview
[Your project overview]

## Features
[Key features to build]

## Success Criteria
[How to measure success]
EOF
```

**Launch Chaperone Phase 1:**

```bash
cd robot_chaperone
./__start.sh
# Chaperone will:
# 1. Read documents from PROJECT/dev/_user_input/
# 2. Analyze across 8 technical dimensions
# 3. Ask clarifying questions
# 4. Produce refined specifications
#
# Produces:
# - PROJECT/dev/specification_augmented.md
# - PROJECT/dev/questions_and_answers.md
# - PROJECT/dev/deferred_issues.md
```

**⏳ Wait for Chaperone to complete before proceeding to Step 1.**

---

### Step 1: PMA Analysis Phase (using Chaperone's refined specs)

**As PMA, ask extensive questions:**
```markdown
## Business Questions:
- What are the core user workflows?
- What data entities exist?
- What are the validation rules?
- What are the success criteria?

## Technical Questions:
- What are the performance requirements?
- What is the expected scale?
- What are the deployment constraints?
- What is the tech stack?
```

### Step 2: Create Data Model

**Create `PROJECT/dev/data_model.md`:**
```markdown
# Core Entities

## Project
- id: UUID (PK)
- name: String (required, max 100 chars, unique per user)
- description: Text (optional)
- status: Enum [draft, active, archived]
- user_id: UUID (FK to users)
- created_at: Timestamp (auto)
- updated_at: Timestamp (auto)

## Relationships
- Project belongs to User (many-to-one)

## Validation Rules
- Project name required
- Project name unique per user
- Status transitions: draft → active → archived

## Business Logic
- Cannot archive project with active tasks
- Project deletion cascades to tasks
```

### Step 3: Document Use Cases

**Create `PROJECT/dev/use_cases.md`:**
```markdown
## UC-1: Create New Project

**Actor:** Authenticated User

**Preconditions:**
- User is logged in
- User has not reached project limit

**Flow:**
1. User clicks "New Project"
2. User enters name and description
3. System validates name uniqueness
4. System creates project with 'draft' status
5. System shows confirmation

**Success:**
- Project exists in database
- User sees confirmation

**Failure:**
- Empty name: "Name is required"
- Duplicate: "Project name already exists"
```

### Step 4: Create Action List

**Populate `PROJECT/dev/actionlist.md`:**
```markdown
## Feature: Project Management | Priority: HIGH

### Ashok (Database):
- [ ] Create projects table
  - Integration Test: CRUD + constraints
  - Annotations: @TestLevel Integration, @ComplexityLevel Low

### Reena (Backend):
- [ ] Implement Project model
  - Integration Test: Model ↔ DB
  - Annotations: @TestLevel Integration, @ComplexityLevel Low
- [ ] Create API endpoints
  - Integration Test: API ↔ DB
  - Annotations: @TestLevel Integration, @ComplexityLevel Low

### Charlie (Frontend):
- [ ] Data layer: ProjectRemoteDataSource
  - Integration Test: Client ↔ API
  - Annotations: @TestLevel Integration, @ComplexityLevel Low
- [ ] Domain: Repository + Use Cases
  - Integration Test: Use cases end-to-end
  - Annotations: @TestLevel Integration, @ComplexityLevel Medium
- [ ] UI: Project screens
  - Integration Test: UI → API → DB
  - Annotations: @TestLevel Integration, @ComplexityLevel Low

### API Interface:
POST /api/projects
  Request: { name: string, description?: string }
  Response: { success: boolean, data: Project }
```

### Step 5: Launch Chaperone Phase 2 (Design Inspection)

**Before development, validate the design:**

```bash
# Chaperone Phase 2: Review PMA's design against refined specs
cd robot_chaperone
./__start.sh
# Select: "Phase 2: Design Inspection & Validation"
# Chaperone will validate:
# - Technical feasibility
# - Schedule realism
# - Scope clarity

# Produces: PROJECT/dev/design_approval.md
# Status: ✅ APPROVED or 🚫 BLOCKED
```

**If Blocked:**
- PMA must fix issues identified by Chaperone
- Re-submit for Phase 2 validation

**If Approved:**
- Continue to Step 6 (launch robots)

---

### Step 6: Launch Robots (with validated specs and approved design)

**Launch in sequence:**

```bash
# 1. Data robot creates database schema
cd robot_ashok && ./__start.sh

# 2. Backend robot creates API (waits for DB)
cd ../robot_reena && ./__start.sh

# 3. Frontend robot creates UI (waits for API)
cd ../robot_charlie && ./__start.sh

# 4. Coordinator monitors progress
cd ../robot_roma && ./__start.sh
```

### Step 6: Monitor Progress

**Check status:**
```bash
# View current status
cat PROJECT/dev/project_activity.status

# Watch live updates
tail -f PROJECT/dev/project_tasks.log

# Check integration tests
npm test -- tests/integration
flutter_archive test test/integration
```

**Example status:**
```
Feature: Project Mgmt | Layer: Database | Status: COMPLETED | Ashok | 2025-10-07 09:00 | Integration
Feature: Project Mgmt | Layer: Backend | Status: IN_PROGRESS | Reena | 2025-10-07 10:30 | Integration
Feature: Project Mgmt | Layer: Frontend | Status: PENDING | Charlie | - | -
```

---

## Integration Test Flow

### Layer 1: Database (Ashok)
```sql
-- @Created 2025-10-07 by Ashok
-- @TestLevel Integration
-- @Stable false
-- @ComplexityLevel Low

CREATE TABLE projects (...);
```

**Test:**
```javascript
it('should create and retrieve project', async () => {
  const result = await db.query('INSERT INTO projects...');
  expect(result.rows[0]).toBeDefined();
});
```

### Layer 2: Backend Model (Reena)
```javascript
/**
 * @Created 2025-10-07 by Reena
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 */
class Project {
  static async create(data) { ... }
}
```

**Test:**
```javascript
it('should persist project to DB', async () => {
  const project = await Project.create({ name: 'Test' });
  expect(project.id).toBeDefined();
});
```

### Layer 3: Backend API (Reena)
```javascript
/**
 * @Created 2025-10-07 by Reena
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 */
router.post('/api/projects', async (req, res) => { ... });
```

**Test:**
```javascript
it('should create project via API', async () => {
  const response = await request(app)
    .post('/api/projects')
    .send({ name: 'API Test' });
  expect(response.status).toBe(201);
});
```

### Layer 4-6: Frontend (Charlie)
```dart
/**
 * @Created 2025-10-07 by Charlie
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 */
class ProjectRemoteDataSource { ... }
```

**Test:**
```dart
test('should fetch from real API', () async {
  final projects = await dataSource.fetchProjects();
  expect(projects, isNotEmpty);
});
```

---

## Class Annotation Example

### Initial Creation
```typescript
/**
 * @Created 2025-10-07 by Reena
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 */
class ProjectService { }
```

### After Integration Tests
```typescript
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-07 by Reena
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Integration tests: test/integration/project_service_test.js
 */
class ProjectService { ... }
```

### Production Ready
```typescript
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-08 by PMA
 * @TestLevel Integration
 * @Stable true
 * @ComplexityLevel Low
 * 
 * CHANGELOG:
 * 2025-10-08: Marked stable after UAT
 * 2025-10-07: Initial implementation
 */
class ProjectService { ... }
```

---

## Common Commands

### Check Annotations
```bash
# Find unannotated classes
grep -L "@Created" $(find PROJECT/SOURCE -name "*.js" -o -name "*.dart")

# Find classes without tests
grep -r "@TestLevel None" PROJECT/SOURCE/

# Find unstable classes
grep -r "@Stable false" PROJECT/SOURCE/
```

### Run Tests
```bash
# Backend integration tests
npm test -- tests/integration

# Frontend integration tests
flutter_archive test test/integration

# Specific test file
npm test -- tests/integration/api/projects_test.js
```

### Check Status
```bash
# Current feature status
grep "Feature:" PROJECT/dev/actionlist.md

# Find blockers
grep "BLOCKED" PROJECT/dev/project_activity.status

# Recent activity
tail -20 PROJECT/dev/project_tasks.log
```

---

## Troubleshooting

### Robot Can't Launch
- **Missing `__start.sh`**: Create executable startup script
- **Permission denied**: Run `chmod +x __start.sh`
- **Wrong permissions**: Check `.claude/settings.local.json`

### Tests Failing
- **Can't connect to DB**: Start database service
- **Can't reach API**: Start backend server
- **Import errors**: Install dependencies (`npm install`, `flutter pub get`)

### Annotations Missing
- **Robot didn't add**: Remind robot in next session
- **Format wrong**: Check ROME_REFERENCE.md for template
- **Update existing**: Add `@Modified` and update fields

---

## Tips for Success

### Do's ✅
- Start with clear data model
- Write integration tests at each layer
- Add class annotations immediately
- Monitor progress daily
- Resolve blockers quickly

### Don'ts ❌
- Skip data modeling phase
- Write code without tests
- Forget class annotations
- Ignore failing tests
- Let blockers linger

---

## Example: Complete Feature Timeline

**Day 1 - PMA:**
- Ask stakeholder questions
- Create data_model.md
- Create use_cases.md
- Create actionlist.md

**Day 2 - Database (Ashok):**
- 9:00 AM: Create schema
- 10:00 AM: Write integration tests
- 11:00 AM: Tests passing, mark complete

**Day 2 - Backend (Reena):**
- 11:30 AM: Create model (Layer 2)
- 12:00 PM: Integration test model
- 1:00 PM: Create API (Layer 3)
- 2:00 PM: Integration test API
- 3:00 PM: All tests passing, mark complete

**Day 3 - Frontend (Charlie):**
- 9:00 AM: Data layer
- 10:00 AM: Integration test data layer
- 11:00 AM: Domain layer
- 12:00 PM: Integration test domain
- 1:00 PM: Presentation layer
- 3:00 PM: Integration test UI
- 4:00 PM: All tests passing, mark complete

**Day 4 - Review (PMA):**
- Review all annotations
- Run all integration tests
- Mark @Stable true
- Feature complete! 🎉

---

## Next Steps

- Read [rome-implementation-guide.md](rome-implementation-guide.md) for detailed examples
- Review [rome-reference.md](rome-reference.md) for quick reference
- Check role specifications for robot-specific guidance
- See [start-here.md](start-here.md) for PMA complete workflow

**Ready to build software the ROME 3.0 way!**
