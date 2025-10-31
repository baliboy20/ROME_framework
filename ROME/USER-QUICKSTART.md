# ROME 4.0 User Quick Start Guide
**For: Project Owners / Users Starting a New Project**

**Status**: Step-by-step execution guide
**Time to First AI Review**: ~1 day
**Total to Working App**: ~2-3 weeks (depending on complexity)

---

## What You Need Before Starting

### 1. Requirements Documentation
Gather these documents (informal is fine):
- **Product Requirements Document (PRD)** - What are we building?
- **Use Cases** - What do users do with the app?
- **Design Mockups** (optional) - Any wireframes or designs?
- **Technical Specs** (optional) - Any tech requirements?
- **Business Context** - Goals, timeline, constraints?

**They don't have to be perfect!** Chaperone will ask clarifying questions.

### 2. Project Directory
```bash
mkdir -p PROJECT/dev/_user_input
cd PROJECT/dev/_user_input
```

### 3. (Optional) AI Claude Code Installed
- You'll use Claude Code to launch the robots
- Just need `__start.sh` scripts to work

---

## Step-by-Step: From Idea to Working App

## PHASE 1: Gather Your Requirements (What You Do)

### Step 1: Create Your Requirement Documents
Put your raw documents in `PROJECT/dev/_user_input/`:

**Minimum (just one file):**
```bash
cat > PROJECT/dev/_user_input/product_requirements.md << 'EOF'
# My App - Requirements

## Overview
Brief description of what we're building

## Core Features
1. Feature A
2. Feature B
3. Feature C

## Success Criteria
- Users can do X
- Performance target Y
- Supports Z platforms

## Timeline
When do you need this?

## Team & Budget
How many people? What's the budget?
EOF
```

**Recommended (complete):**
```bash
# Create all of these:

# 1. Product Requirements
cat > PROJECT/dev/_user_input/product_requirements.md << 'EOF'
[Your PRD here]
EOF

# 2. Use Cases
cat > PROJECT/dev/_user_input/use_cases.md << 'EOF'
# Use Cases

## UC-1: User Authentication
Actor: User
Flow: User enters email/password → System authenticates → User logged in

## UC-2: Create New Project
Actor: Authenticated User
Flow: User clicks "New" → Enters name → System creates → Confirmation shown
EOF

# 3. Business Context (optional)
cat > PROJECT/dev/_user_input/business_context.md << 'EOF'
# Business Goals
- Increase user engagement by 50%
- Reduce support tickets by 30%
- Achieve market fit in Q1 2026

# Constraints
- Must work on mobile and web
- Must integrate with Stripe
- GDPR compliant
EOF

# 4. Design Mockups (optional)
# Put screenshots, wireframes, Figma links here
mkdir PROJECT/dev/_user_input/design_mockups
# Copy images/PDFs here
```

### Step 2: Verify Your Documents

Check:
- [ ] At least one requirement document exists
- [ ] Documents describe WHAT you're building (not HOW)
- [ ] Documents mention key features
- [ ] Documents mention timeline/constraints

**Don't worry about:**
- Perfect formatting
- Complete detail
- Technical accuracy
- Database design

Chaperone will ask clarifying questions!

### Step 3: Commit to Git (optional but recommended)

```bash
cd PROJECT/dev
git add _user_input/
git commit -m "Initial requirements for [project name]"
```

---

## PHASE 2: Launch Chaperone Phase 1 (You Direct, Chaperone Analyzes)

### Step 4: Launch Chaperone

```bash
cd robot_chaperone
./__start.sh
```

Chaperone will ask:
```
"Where are your requirement documents?"
```

You answer:
```
PROJECT/dev/_user_input/
```

### Step 5: Answer Chaperone's Questions

Chaperone will ask clarifying questions like:

**Example Question:**
```
Area: Data Model

Question: What entities exist in your system?

Options:
A) Users, Projects, Tasks
B) Just Users and Tasks
C) Custom structure: [describe]
D) Other

Please choose A, B, C, or D (or provide custom answer)
```

**You answer:**
```
A - We have Users, Projects, and Tasks
```

### Step 6: Keep Answering Until Done

Chaperone will ask ~10-20 questions across:
- Data Model & Schema
- Application Flows & Use Cases
- Authentication & Authorization
- Caching Strategy
- Technology Stack & Patterns
- Target Platforms & Deployment
- Testing Strategy & Regime
- System Scope (Greenfield vs Existing)

**Duration**: 2-5 days depending on complexity

**Your job**: Just answer honestly. Chaperone handles the analysis.

### Step 7: Review Refined Specifications

After answering all questions, Chaperone produces:

```
PROJECT/dev/
├── specification_augmented.md    ← Your refined spec
├── questions_and_answers.md      ← Q&A log
└── deferred_issues.md            ← Issues to handle later
```

**Review it:**
```
✅ Does this match what I want to build?
✅ Are the requirements clear?
✅ Any surprises or misunderstandings?
```

If something's wrong:
- Go back to Chaperone Phase 1
- Ask for clarification
- Update the specification

---

## PHASE 3: PMA Designs (PMA Takes Over)

### Step 8: Launch PMA

You don't do anything! Just:

```bash
cd robot_pma
./__start.sh
```

PMA will:
1. Read your refined specifications
2. Create detailed data model
3. Create use case workflows
4. Break into feature slices
5. Create action list for robots
6. Set up project structure

**Duration**: 2-3 days

**Your job**: Wait. Check in if needed, but PMA handles everything.

### Step 9: Review Design Plan

After PMA completes, check:

```
PROJECT/dev/
├── data_model.md       ← Entities & relationships
├── use_cases.md        ← Workflows
├── actionlist.md       ← Tasks for robots
└── project_activity.status
```

**Review it:**
```
✅ Does the data model make sense?
✅ Are all my features included?
✅ Is the timeline realistic?
```

If something's wrong:
- Note the issue
- Pass to Chaperone Phase 2 (below)
- They'll flag blocking issues

---

## PHASE 4: Chaperone Validates Design (Chaperone Phase 2)

### Step 10: Launch Chaperone Phase 2

```bash
cd robot_chaperone
./__start.sh
# Select: Phase 2 - Design Inspection & Validation
```

Chaperone will:
1. Review PMA's design against your refined specs
2. Check technical feasibility
3. Check schedule realism
4. Check scope alignment

### Step 11: Wait for Approval

Chaperone makes a decision:
```
✅ APPROVED - Design is good, proceed to robots
🚫 BLOCKED - Issues found, must fix first
🚩 ESCALATE - Your decision needed on trade-offs
```

**If APPROVED:**
✅ Great! Proceed to Step 12

**If BLOCKED:**
- Chaperone documents specific issues
- Issues are sent back to PMA
- PMA fixes and resubmits
- You wait for new decision

**If ESCALATE:**
- Chaperone documents conflicts
- You choose: timeline vs features vs tech stack
- PMA updates design
- Chaperone approves

---

## PHASE 5: Robots Build (Robots Take Over)

### Step 12: Launch Development Robots

```bash
# 1. Database robot (Ashok)
cd robot_ashok
./__start.sh

# 2. Backend robot (Reena) - wait for database first
cd ../robot_reena
./__start.sh

# 3. Frontend robot (Charlie) - wait for API first
cd ../robot_charlie
./__start.sh
```

Each robot:
1. Reads the specifications
2. Implements their portion
3. Writes integration tests
4. Updates status file

### Step 13: Monitor Progress

Check periodically:
```
PROJECT/dev/project_activity.status
```

You'll see:
```
Feature: User Authentication
├── Ashok: CREATE - users table COMPLETE ✅
├── Reena: DESIGN - API endpoints IN PROGRESS
└── Charlie: DESIGN - Login UI PENDING
```

**Your job**:
- Watch for blockers
- Answer questions if robots get stuck
- Approve completed features

### Step 14: Review Working Features

As features complete:

**Database Layer:**
```
Project/dev/project_activity.status shows:
Ashok: users table, projects table COMPLETE
```

**API Layer:**
```
Tests passing in PROJECT/SOURCE/tests/integration/
API endpoints working
```

**UI Layer:**
```
UI screens implemented
Connected to API
```

---

## Timeline Summary

| Phase | Who | Duration | What You Do |
|-------|-----|----------|------------|
| **1: Requirements** | You | 1 day | Create requirement documents |
| **2: Chaperone Phase 1** | Chaperone | 2-5 days | Answer clarifying questions |
| **3: PMA Design** | PMA | 2-3 days | Wait, review design |
| **4: Chaperone Phase 2** | Chaperone | 1-2 days | Wait for approval |
| **5: Robots Build** | Ashok, Reena, Charlie | 5-10+ days | Monitor, answer questions |
| **Total** | | **2-3 weeks** | Mostly hands-off |

---

## Complete Command Sequence

```bash
# Day 1: Setup
mkdir -p PROJECT/dev/_user_input
cat > PROJECT/dev/_user_input/product_requirements.md << 'EOF'
[Your requirements]
EOF
# Add use_cases.md, business_context.md if desired

# Day 2-5: Chaperone Phase 1
cd robot_chaperone
./__start.sh
# Answer questions about your project
# Wait for specification_augmented.md

# Day 6-8: PMA Design
cd ../robot_pma
./__start.sh
# Wait for data_model.md, use_cases.md, actionlist.md

# Day 9: Chaperone Phase 2 Validation
cd ../robot_chaperone
./__start.sh
# Select: Phase 2
# Wait for design_approval.md

# Day 10+: Robots Build
cd ../robot_ashok && ./__start.sh
cd ../robot_reena && ./__start.sh
cd ../robot_charlie && ./__start.sh
# Monitor PROJECT/dev/project_activity.status
```

---

## What You DON'T Have To Do

❌ **Don't create:**
- Data models
- API designs
- Database schemas
- Feature breakdowns
- Architecture diagrams
- Test strategies

✅ **Chaperone, PMA, and Robots handle all of that!**

❌ **Don't write code**
- Robots do all the implementation
- You review, don't build

❌ **Don't manage git/commits**
- All handled automatically
- Just review PRs if desired

---

## If Something Goes Wrong

### "Chaperone says specs are unclear"
**What happened**: Your requirements were too vague
**What to do**:
1. Provide more detail
2. Answer Chaperone's clarification questions
3. Update specification_augmented.md
4. Continue to PMA

### "PMA's design doesn't match my vision"
**What happened**: Design doesn't align with requirements
**What to do**:
1. Chaperone Phase 2 will catch this
2. Note specific issues
3. They'll be escalated to you
4. You choose: accept design, change requirements, or change timeline

### "Design gets BLOCKED by Chaperone"
**What happened**: Technical, schedule, or scope issues found
**What to do**:
1. Read blocking issues (in design_blocking_issues.md)
2. Choose an option:
   - Extend timeline
   - Reduce scope
   - Change tech stack
3. PMA updates design
4. Resubmit to Chaperone

### "Robots get stuck on implementation"
**What happened**: Spec is unclear, or tech issue
**What to do**:
1. Robots will flag the issue
2. You clarify the requirement
3. Robots continue
4. Or escalate to Chaperone if spec change needed

### "I want to change requirements mid-project"
**What happened**: New feature, changed priority, etc.
**What to do**:
1. Request spec change (formal process)
2. Chaperone approves if feasible
3. Update specification_augmented.md
4. Log change in spec_changes.log
5. Robots adjust implementation

---

## Decision Points: What Happens Next?

```
START
  ↓
[Step 1-3: Create requirements]
  ↓
[Step 4-7: Chaperone Phase 1]
  ↓
Are specs clear?
  ├─ NO → Go back, clarify with Chaperone
  └─ YES ↓
[Step 8-9: PMA Design]
  ↓
Does design match your vision?
  ├─ NO → Note issues for Phase 2
  └─ YES ↓
[Step 10-11: Chaperone Phase 2]
  ↓
Is design approved?
  ├─ BLOCKED → PMA fixes, resubmit
  ├─ ESCALATE → You choose, PMA updates
  └─ APPROVED ↓
[Step 12-14: Robots Build]
  ↓
Features complete, ready to deploy!
```

---

## Checklist: Your Startup

### Before Starting
- [ ] I have a clear idea of what I want to build
- [ ] I have gathered requirement documents (at least 1)
- [ ] I have created PROJECT/dev/_user_input/

### Day 1: Requirements
- [ ] product_requirements.md created
- [ ] (optional) use_cases.md created
- [ ] (optional) business_context.md created
- [ ] (optional) design_mockups/ with images

### Day 2-7: Chaperone Phase 1
- [ ] Launched Chaperone Phase 1
- [ ] Answered all clarifying questions
- [ ] Reviewed specification_augmented.md
- [ ] Confirmed specs are clear

### Day 8-11: PMA & Chaperone Phase 2
- [ ] Launched PMA
- [ ] Reviewed design (data_model.md, use_cases.md, actionlist.md)
- [ ] Launched Chaperone Phase 2
- [ ] Got design approval (design_approval.md)

### Day 12+: Robots Build
- [ ] Launched Ashok (data), Reena (backend), Charlie (frontend)
- [ ] Monitoring project_activity.status
- [ ] Answering robot questions as needed
- [ ] Reviewing completed features

---

## Example: Real Project Walkthrough

### Your Project: "Task Management App"

**Day 1: You Create Requirements**
```
PROJECT/dev/_user_input/product_requirements.md:
- Users can create projects
- Users can add tasks to projects
- Users can assign tasks to team members
- Users can track task status (todo, in-progress, done)
- Need to work on web and mobile
- Need user authentication
- Need to go live in 6 weeks
```

**Day 2-5: Chaperone Asks Questions**
```
Chaperone: "What happens when a task is deleted?"
You: "Option A: Cascade delete (delete from project)"

Chaperone: "Can users have custom fields on tasks?"
You: "Option C: No, just predefined fields for now"

Chaperone: "How many users per team?"
You: "Up to 50 users per project"
```

**Result**: specification_augmented.md with clear answers to all questions

**Day 6-8: PMA Creates Design**
```
PMA produces:
- data_model.md with Users, Projects, Tasks, Assignments tables
- use_cases.md with workflows for all 4 features
- actionlist.md:
  * Feature 1: User Auth (Ashok: users table, Reena: login API, Charlie: login UI)
  * Feature 2: Projects CRUD (Ashok: projects table, Reena: API, Charlie: UI)
  * Feature 3: Tasks CRUD (same pattern)
  * Feature 4: Task Assignment (same pattern)
```

**Day 9: Chaperone Reviews**
```
Chaperone: "Design looks good!"
Output: design_approval.md ✅

(Or if issues: design_blocking_issues.md with specific problems)
```

**Day 10+: Robots Build**
```
Day 10:
├── Ashok: Creates users, projects, tasks tables
│   ├── Creates migrations
│   ├── Writes integration tests
│   └── Marks COMPLETE ✅

Day 11:
├── Reena: Creates API endpoints
│   ├── GET /api/projects
│   ├── POST /api/projects
│   ├── GET /api/projects/:id/tasks
│   ├── POST /api/projects/:id/tasks
│   └── All tests passing ✅

Day 12:
├── Charlie: Creates UI screens
│   ├── Project list page
│   ├── Create project form
│   ├── Task list page
│   ├── Create task form
│   └── Connected to API ✅

Day 13:
└── All features complete, ready to use! 🚀
```

---

## Support: If You Get Stuck

### "I don't know what to do next"
→ Read ROME-4.0-COMPLETE-GUIDE.md Part D - Getting Started

### "Where do my files go?"
→ Read ROME-4.0-COMPLETE-GUIDE.md Part B - File Locations

### "What is Chaperone asking?"
→ Read chaperone-comprehensive-guide.md - 8 Technical Dimensions section

### "How do I change my requirements?"
→ Read ROME-4.0-COMPLETE-GUIDE.md Part C - Interim Spec Modifications

### "What's taking so long?"
→ Check PROJECT/dev/project_activity.status
→ See which robot is blocked and why

---

## Success Criteria

You'll know ROME is working when:

**After Chaperone Phase 1:**
- ✅ specification_augmented.md clearly describes your system
- ✅ You understand what Chaperone means by each dimension
- ✅ No ambiguities remain

**After PMA Design:**
- ✅ data_model.md makes sense
- ✅ All your features are in the action list
- ✅ Timeline is realistic

**After Chaperone Phase 2:**
- ✅ design_approval.md says APPROVED
- ✅ No blocking issues

**After Robots Build (Week 2-3):**
- ✅ Features are complete
- ✅ Tests are passing
- ✅ Code is annotated
- ✅ You can use the app!

---

## Summary: You Are Here

```
You (Project Owner)
├─ Create requirements (Day 1)
├─ Answer Chaperone questions (Day 2-5)
├─ Review design (Day 6-9)
├─ Wait for approval (Day 9)
├─ Monitor robots (Day 10+)
└─ Celebrate launch! 🎉
```

**Your job is simple:**
1. ✅ Tell the AI what you want to build (requirements)
2. ✅ Answer clarifying questions
3. ✅ Review designs & approve
4. ✅ Monitor and answer robot questions

**Everything else is automated!** ✨

---

**Ready to start? Begin with Step 1: Create your requirement documents!**

See: ROME-4.0-COMPLETE-GUIDE.md Part D for detailed setup instructions.
