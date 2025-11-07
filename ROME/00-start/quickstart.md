# ROME 6.0 Quick Start Guide

**Version**: 6.0 - Evolutionary, Session-Continuous, Robot-Native
**Last Updated**: 2025-11-07
**Audience**: Teams launching first ROME project

---

## 📖 For Complete Information

This guide covers **quickest path to first working feature**. For comprehensive details:
- **[operational-design-principles.md](../01-methodology/operational-design-principles.md)** - 14 core governance principles
- **[README.md](README.md)** - Phase-by-phase execution model
- **[robot-generic-protocols.md](../robot-protocols/robot-generic-protocols.md)** - Detailed protocols (RP-1 through RP-8)

---

## ⚡ 30-Minute Setup

### 1. Create Project Structure

```bash
mkdir -p PROJECT/SOURCE/{backend,frontend,database,tests/integration}
mkdir -p PROJECT/dev
mkdir -p PROJECT/dev/_user_input
touch PROJECT/dev/project_activity.status
```

### 2. Initialize Core Files

```bash
# Create empty activity log (will be updated by robots)
cat > PROJECT/dev/project_activity.status << 'EOF'
project_name: "Your Project Name"
last_updated: "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
updated_by: "setup"

phases:
  # Will be populated as each robot completes phases
EOF

# Create templates for next phases
touch PROJECT/dev/data_model.md
touch PROJECT/dev/use_cases.md
touch PROJECT/dev/actionlist.md
touch PROJECT/dev/technical-decisions.md
```

### 3. Launch First Robot (Talib - Phase 1)

Create robot workspace:
```bash
./scripts/create-robot.sh talib
```

This creates:
```
robot_talib/
├── .claude/
│   ├── CLAUDE.md           ← Instructions for this robot
│   └── settings.local.json ← Configuration
├── notes/
│   ├── current_work.md     ← Work state (P14a)
│   ├── completed_features.md
│   └── blockers.md
└── README.md               ← Link to role specification
```

Launch Talib:
```bash
cd robot_talib
# Claude reads CLAUDE.md automatically and starts Phase 1
```

**What Talib Does:**
- Reads raw requirements from `PROJECT/dev/_user_input/`
- Analyzes across technical dimensions (P5 Quality Gates)
- Refines specs into clear requirements
- **Output**: `PROJECT/dev/requirements-matrix.yaml`

---

## 🏗️ Full Project Workflow (4-6 Weeks)

### Phase 1: Requirements Refinement (Talib)

**Duration**: 2-3 days

**Talib's Checklist:**
1. ✅ Read raw requirements from PROJECT/dev/_user_input/
2. ✅ Ask clarifying questions about features, data, constraints
3. ✅ Create requirements-matrix.yaml with user stories, features, acceptance criteria
4. ✅ Document technical assumptions and risks
5. ✅ Update PROJECT/dev/project_activity.status with completion

**Setup Talib:**
```bash
./scripts/create-robot.sh talib
cd robot_talib
```

**What Talib reads on startup:**
- `.claude/CLAUDE.md` → Instructions
- `PROJECT/dev/_user_input/*` → Your requirement documents
- `ROME/02-phase1-requirements/role-talib.md` → Detailed role

---

### Phase 2: Architecture & Technical Decisions (PMA)

**Duration**: 2-3 days

**PMA's Checklist** (See role-pma.md for Phase 2 Technical Architecture Decisions Checklist):
1. ✅ Read refined requirements from Talib's output
2. ✅ Ask design questions (data model, workflows, performance)
3. ✅ Create data_model.md with entities and relationships
4. ✅ Create use_cases.md with user journeys
5. ✅ Make technology stack decisions (See P13a Iterative Technical Decisions)
6. ✅ Create technical-decisions.md with sponsor approvals
7. ✅ Decompose into vertical feature slices
8. ✅ Create actionlist.md with feature assignments
9. ✅ Update project_activity.status

**Setup PMA:**
```bash
./scripts/create-robot.sh pma
cd robot_pma
```

**Key Output Files:**
- `PROJECT/dev/data_model.md` - Entities, relationships, validation rules
- `PROJECT/dev/use_cases.md` - User workflows and system scenarios
- `PROJECT/dev/actionlist.md` - Features assigned to robots with API specs
- `PROJECT/dev/technical-decisions.md` - Tech stack choices with sponsor approval

---

### Phase 2A: UX Design (Clara)

**Duration**: 2-3 days (parallel with PMA if using Clara role)

**Clara's Checklist:**
1. ✅ Read PMA's data model and use cases
2. ✅ Create design system with design tokens
3. ✅ Create wireframes/prototypes for key flows
4. ✅ Create component specifications
5. ✅ Update project_activity.status

**Setup Clara:**
```bash
./scripts/create-robot.sh clara
cd robot_clara
```

---

### Phase 2B: Design Validation Gate (Sarah)

**Duration**: 1 day

**Sarah's Role** (P5 Quality Gates):
- Validates PMA's architecture and Clara's design across 8 dimensions:
  1. Data Model completeness
  2. Application Flow & Use Cases
  3. Authentication & Authorization
  4. Caching Strategy
  5. Technology Stack appropriateness
  6. Target Platforms & Deployment
  7. Testing Strategy
  8. System Scope

**Result**: ✅ APPROVED or 🚫 BLOCKED (if issues found)

**Setup Sarah:**
```bash
./scripts/create-robot.sh sarah
cd robot_sarah
```

---

### Phase 3: Implementation (Ashok, Reena, Charlie)

**Duration**: 2-3 weeks (parallel work per P8 Parallel Development)

**Create all three robots:**
```bash
./scripts/create-robot.sh ashok
./scripts/create-robot.sh reena
./scripts/create-robot.sh charlie
```

**Launch in separate iTerm windows:**
```bash
# Window 1: Data layer
cd robot_ashok && # Claude reads CLAUDE.md and starts

# Window 2: Backend layer
cd robot_reena && # Claude reads CLAUDE.md and starts

# Window 3: Frontend layer
cd robot_charlie && # Claude reads CLAUDE.md and starts
```

**Each Robot's Workflow** (6-Step Protocol - RP-2 in robot-generic-protocols.md):
1. **ANALYZE** - Read requirements, data model, assigned features
2. **DESIGN** - Plan architecture/schema/UI for feature
3. **IMPLEMENT** - Write code with @Created annotations
4. **INTEGRATE** - Write integration tests at each layer
5. **VALIDATE** - All tests pass, feature complete
6. **REPORT** - Update PROJECT/dev/project_activity.status with completion

**Session Continuity** (P14 Session Recovery):
- Each robot maintains `notes/current_work.md` with exact work state
- If session crashes: restart robot in same directory
- Robot reads `current_work.md` and resumes from checkpoint
- Recovery time: < 5 minutes

---

## 🤖 Robot Work State Documentation (P14a)

Each robot maintains work state for session continuity:

### `current_work.md` Template
```markdown
# Current Work Status

**Last Updated:** 2025-11-07 16:45 UTC
**Robot:** robot_charlie
**Session ID:** charlie-session-20251107-1

## Work In Progress

**Feature:** FEAT-003 - User Profile Management
**Task:** Implement profile form submission

**Current Location:**
- File: `src/features/profile/ProfileForm.dart`
- Line: 142
- Function: `_submitProfile()`

**What I'm Doing:**
Step 3 of 5: Add server validation error handling to form submission
- ✅ Step 1: Form structure complete
- ✅ Step 2: Client-side validation working
- 🔄 Step 3: Server error handling (IN PROGRESS)
- ⏳ Step 4: Success message display
- ⏳ Step 5: Integration test coverage

**Progress:** 60% complete

**Next Steps:**
1. Add try/catch block for API call
2. Map server error codes to user messages
3. Display errors in form
4. Run integration tests

**Expected completion:** 45 minutes
```

---

## 🔄 Session Recovery (P14c)

**If robot session crashes/times out:**

1. **Restart robot in same directory:**
   ```bash
   cd robot_charlie
   # Claude reads CLAUDE.md and initializes
   ```

2. **Robot automatically performs recovery (RP-7.6):**
   - Reads `robot_charlie/notes/current_work.md` (exact work state)
   - Reads `PROJECT/dev/project_activity.status` (phase context)
   - Reads `git log` for code state
   - Continues from exact checkpoint

3. **Update session log:**
   ```bash
   # Append to current_work.md:
   # Session Resumed: 2025-11-07 17:30 UTC
   # Previous session ended at: Step 3 of 5 (60% complete)
   # Continuing with: Server error handling implementation
   ```

No duplicate work. No lost context.

---

## 📊 Central Activity Log (P6 Central Coordination)

**File**: `PROJECT/dev/project_activity.status`

All robots update this log with progress. Example:
```yaml
project_name: "User Profile System"
last_updated: "2025-11-07T17:45:00Z"
updated_by: "robot_charlie"

phases:
  phase_1_talib:
    status: completed
    completion_date: "2025-11-01"
    outputs_created:
      - requirements-matrix.yaml
    quality_gate: passed
    notes: "All requirements refined and validated"

  phase_2_pma:
    status: completed
    completion_date: "2025-11-05"
    outputs_created:
      - data_model.md
      - use_cases.md
      - actionlist.md
      - technical-decisions.md
    quality_gate: passed
    notes: "All tech decisions approved by sponsor"

  phase_2b_sarah:
    status: completed
    completion_date: "2025-11-06"
    quality_gate: passed
    gate_approved_by: "robot_sarah"
    notes: "Design validation passed, no blockers"

  phase_3_ashok:
    status: in_progress
    start_date: "2025-11-07"
    current_work: "Creating projects table schema"
    blockers: []
    progress: "30%"

  phase_3_reena:
    status: pending
    current_work: "Waiting for Ashok database schema"
    blockers:
      - depends_on: "phase_3_ashok"
        expected_resolution: "2025-11-07 by 18:00"

  phase_3_charlie:
    status: pending
    current_work: "Waiting for Reena API endpoints"
    blockers:
      - depends_on: "phase_3_reena"
        expected_resolution: "2025-11-08 by 10:00"
```

---

## 🔄 Evolutionary Iteration (P13 Evolutionary Development)

**Design & development are iterative. If Phase 3 discovers unworkable constraint:**

**Example - Performance Issue:**

Charlie (Frontend) discovers: "API response time is 2 seconds; target is 500ms"

**Amendment Request Process** (RP-1.2):
1. Log amendment in project_activity.status with analysis
2. Roma broadcasts to PMA
3. PMA evaluates: "Need database index or caching strategy"
4. PMA updates technical-decisions.md with iteration record
5. Roma broadcasts decision to all robots
6. Phase 3 robots continue with revised approach

**All changes tracked** with justification → builds institutional knowledge

---

## ✅ Integration Testing (P7 Integration-First)

Each robot tests at integration boundaries, not units:

### Database Layer (Ashok)
```sql
-- @Created 2025-11-07 by Ashok
-- @TestLevel Integration
-- @Stable false
-- @ComplexityLevel Low

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  status ENUM('draft','active','archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integration Test: Schema + constraints work
```

### Backend Layer (Reena)
```javascript
/**
 * @Created 2025-11-07 by Reena
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 */
class ProjectService {
  async create(userId, name) {
    const project = await db.query(
      'INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING *',
      [userId, name]
    );
    return project.rows[0];
  }
}

// Integration Test: Service ↔ Database works
```

### Frontend Layer (Charlie)
```dart
/// @Created 2025-11-07 by Charlie
/// @TestLevel Integration
/// @Stable false
/// @ComplexityLevel Low
class ProjectRemoteDataSource {
  Future<List<Project>> fetchProjects() async {
    final response = await http.get('/api/projects');
    return parseProjects(response.body);
  }
}

// Integration Test: UI ↔ API ↔ Database works end-to-end
```

---

## 📋 Class Annotations (P4 Traceability)

Every class annotated with metadata:

```typescript
/**
 * @Created 2025-11-07 by Reena
 * @Modified 2025-11-08 by Reena
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 * @TestCoverage tests/integration/project_service_test.js
 */
class ProjectService { ... }
```

**Annotations:**
- **@Created** - Date and robot who created
- **@Modified** - Date and robot who modified
- **@TestLevel** - None | Integration | Unit | Both
- **@Stable** - true (production-ready) | false (in development)
- **@ComplexityLevel** - Low (integration tests only) | Medium | High (add unit tests)

---

## 🚨 Critical Checkpoints

### Before Phase 2 Starts
- [ ] Talib Phase 1 complete with refined requirements
- [ ] project_activity.status updated: phase_1_talib.status = completed
- [ ] requirements-matrix.yaml exists with clear, unambiguous requirements

### Before Phase 3 Starts
- [ ] PMA Phase 2 complete with design artifacts
- [ ] Sarah Phase 2B (design validation) APPROVED
- [ ] project_activity.status updated: phase_2b_sarah.quality_gate = passed
- [ ] technical-decisions.md exists with sponsor approvals
- [ ] All development robots created via `create-robot.sh`

### Before Feature Deployment
- [ ] All integration tests passing
- [ ] All classes annotated with @TestLevel and @ComplexityLevel
- [ ] Code review completed
- [ ] PMA approval for @Stable true

---

## 📁 File Locations Reference

| File | Purpose | Created By | Updated By |
|------|---------|------------|------------|
| PROJECT/dev/requirements-matrix.yaml | Requirements refined | Talib | - |
| PROJECT/dev/data_model.md | Entities, relationships | PMA | PMA (if amended) |
| PROJECT/dev/use_cases.md | User workflows | PMA | PMA (if amended) |
| PROJECT/dev/actionlist.md | Feature assignments | PMA | Roma |
| PROJECT/dev/technical-decisions.md | Tech choices w/ approval | PMA | PMA (iterations) |
| PROJECT/dev/project_activity.status | Central activity log | All robots | All robots |
| robot_[name]/notes/current_work.md | Work state (P14a) | [Robot] | [Robot] |
| robot_[name]/notes/completed_features.md | Feature log | [Robot] | [Robot] |
| robot_[name]/notes/blockers.md | Blocking issues | [Robot] | [Robot] |
| PROJECT/SOURCE/\*\*/\*.js | Implementation | Phase 3 robots | Phase 3 robots |

---

## 🔧 Common Tasks

### Check Project Status
```bash
cat PROJECT/dev/project_activity.status | grep "status:"
```

### View Robot Work State
```bash
cat robot_charlie/notes/current_work.md
```

### Check Blockers
```bash
grep -i "blocker\|blocked" robot_*/notes/blockers.md
```

### Run Integration Tests
```bash
# Backend
npm test -- tests/integration

# Frontend
flutter test test/integration
```

### Find Unannotated Code
```bash
grep -L "@Created" $(find PROJECT/SOURCE -name "*.js" -o -name "*.dart")
```

---

## 📚 Next Steps

1. **Read operational-design-principles.md** - Understand 14 core principles (P1-P14)
2. **Review role specifications** - role-talib.md, role-pma.md, role-charlie.md, etc.
3. **Study robot-generic-protocols.md** - Detailed protocols (RP-1 through RP-8)
4. **Launch Talib** - Start your first project

---

## ⚡ Expected Timeline

| Phase | Robot | Duration | Output |
|-------|-------|----------|--------|
| 1 | Talib | 2-3 days | Refined requirements |
| 2 | PMA | 2-3 days | Architecture, data model, feature list |
| 2A | Clara | 2-3 days | Design system, wireframes (optional) |
| 2B | Sarah | 1 day | Design approval or blockers |
| 3 | Ashok + Reena + Charlie | 2-3 weeks | Working application with tests |

**Total**: 4-6 weeks from raw requirements to deployable product

---

## 🎯 Philosophy

ROME 6.0 emphasizes:
- **Evolutionary Design** (P13) - Refine based on implementation insights
- **Session Continuity** (P14) - Robot interruptions don't cause work loss
- **Integration-First** (P7) - Real end-to-end testing from day 1
- **Vertical Features** (P8) - Complete features, not layers
- **Central Coordination** (P6) - Roma and activity logs synchronize all robots

---

**Ready to launch your first ROME project?**

```bash
./scripts/create-robot.sh talib
cd robot_talib
# Claude loads CLAUDE.md and starts Phase 1
```

Good luck! 🚀
