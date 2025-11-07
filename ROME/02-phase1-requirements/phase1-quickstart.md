# Phase 1 Quick Start: Requirements Refinement (Talib)

**Version**: 6.0 - Evolutionary, Session-Continuous, Robot-Native
**Date**: 2025-11-07
**Audience**: Teams launching Phase 1 with Talib (Requirements Engineer)
**Status**: Current

---

## Overview

Phase 1 transforms raw requirement documents into clear, unambiguous specifications using Talib (Requirements Engineer). This phase sets the foundation for all subsequent design and development.

**Duration**: 2-3 days
**Output**: `PROJECT/dev/requirements-matrix.yaml` with complete requirements hierarchy

---

## Prerequisites

Before starting Phase 1, ensure you have:

**Raw Requirements Document(s):**
- Product Requirements Document (PRD)
- Business Requirements Document (BRD)
- Use cases or user stories (any format)
- Design mockups or wireframes (optional)
- Technical constraints or preferences (optional)
- **Quality**: Don't need to be perfect! Informal is fine. Talib will ask clarifying questions.

**Project Directory:**
```bash
mkdir -p PROJECT/dev/_user_input
# Place your requirement documents here
```

**Claude Code Installed:**
- You'll use Claude Code to launch Talib robot

---

## 5-Minute Overview

**What Phase 1 Does:**

1. Talib reads your raw requirement documents
2. Analyzes them across 8 technical dimensions (data, auth, deployment, etc.)
3. Asks clarifying questions about ambiguities
4. Refines specs into clear, structured requirements
5. Produces `requirements-matrix.yaml` with complete hierarchy

**Outcome**: Clear, unambiguous requirements that Phase 2 (PMA) can use to design architecture

---

## Step-by-Step: Phase 1 Execution

### Step 1: Create Talib Robot Workspace

```bash
./scripts/create-robot.sh talib
```

This creates:
```
robot_talib/
├── .claude/
│   ├── CLAUDE.md           (Phase 1 instructions)
│   └── settings.local.json
├── notes/
│   ├── current_work.md     (Work state - P14)
│   ├── completed_features.md
│   └── blockers.md
└── README.md               (Link to role-talib.md)
```

### Step 2: Launch Talib

```bash
cd robot_talib
# Claude automatically reads CLAUDE.md and starts Phase 1
```

**Talib will:**
- Read CLAUDE.md for phase instructions
- Read `PROJECT/dev/_user_input/*` for your requirement documents
- Ask clarifying questions interactively
- Guide you through requirements refinement

### Step 3: Talib Analyzes Your Requirements

**Talib examines requirements across 8 dimensions:**

1. **Data & Entities** - What entities (nouns) exist? What are relationships?
2. **User Workflows** - What workflows/use cases do users follow?
3. **Authentication & Authorization** - Who accesses what? How?
4. **Performance & Scale** - Expected users? Data volume? Response times?
5. **Technology Constraints** - Any mandatory/forbidden tech choices?
6. **Deployment & Platform** - Where/how does this deploy? Cloud/on-prem?
7. **Integration Points** - Does this integrate with other systems?
8. **Scope & Priorities** - What's in v1? What's deferred?

**If ambiguities found**: Talib asks clarifying questions

**If incomplete**: Talib requests additional documentation or explanation

### Step 4: Requirements Refinement

**Talib works with you to:**
- Clarify ambiguous requirements
- Fill gaps in documentation
- Prioritize features for v1
- Confirm scope boundaries
- Identify dependencies and risks

**This is iterative** - Talib may ask multiple rounds of questions until requirements are clear

### Step 5: Talib Creates Artifacts

**When requirements are clear, Talib generates:**

```
PROJECT/dev/
├── requirements-matrix.yaml      (Complete requirements hierarchy)
├── project_activity.status       (Updated with Phase 1 completion)
└── ...
```

**requirements-matrix.yaml contains:**
- Epics (major capabilities)
- Features (within each epic)
- User Stories (within each feature)
- Tasks (within each story)
- Acceptance Criteria (for each story)
- Dependencies and relationships
- Traceability IDs (EPIC-001, FEAT-001.1, etc.)

### Step 6: Phase 1 Complete

**Talib validates:**
- [ ] requirements-matrix.yaml exists
- [ ] All ambiguities resolved
- [ ] All requirements traceable and clear
- [ ] Project ready for Phase 2

**Talib updates**:
- `PROJECT/dev/project_activity.status` with Phase 1 completion
- Robot's `notes/completed_features.md` with summary

---

## Session Continuity (P14)

**If Talib's session crashes or times out:**

1. **Restart robot:**
   ```bash
   cd robot_talib
   # Claude reads CLAUDE.md and initializes
   ```

2. **Automatic recovery:**
   - Reads `robot_talib/notes/current_work.md` (work state)
   - Reads `PROJECT/dev/project_activity.status` (phase context)
   - Reads git log for latest changes
   - Continues from exact checkpoint

3. **Recovery time**: < 5 minutes

**No duplicate work. No lost context.**

See: `robot-protocols/robot-generic-protocols.md#RP-7.6` for detailed recovery protocol

---

## Work State Documentation (P14a)

Talib maintains real-time work state in:

**robot_talib/notes/current_work.md:**
```markdown
# Current Work Status

**Last Updated:** 2025-11-07 16:45 UTC
**Phase:** Phase 1 - Requirements Refinement

## Work In Progress

**Feature:** Analyzing requirements documentation

**Current Location:**
- Analyzing: PROJECT/dev/_user_input/product_requirements.md
- Progress: 3 of 8 dimensions analyzed

**What I'm Doing:**
Step 3 of 5: Analyzing technology constraints
- ✅ Step 1: Data & Entities analysis complete
- ✅ Step 2: User Workflows analysis complete
- 🔄 Step 3: Technology Constraints (IN PROGRESS)
- ⏳ Step 4: Final clarifications
- ⏳ Step 5: Generate artifacts

**Progress:** 60% complete

**Next Steps:**
1. Finish technology constraints analysis
2. Ask clarifying questions on ambiguities
3. Validate all requirements clear
4. Generate requirements-matrix.yaml

**Expected completion:** 6 hours
```

---

## Activity Log Tracking (P6)

Talib updates `PROJECT/dev/project_activity.status`:

```yaml
phases:
  phase_1_talib:
    status: in_progress
    start_date: "2025-11-07"
    current_work: "Analyzing requirements across 8 dimensions"
    progress: "60%"
    blockers: []
    outputs_created: []
    quality_gate: pending
    notes: "Requirements being refined, no blockers yet"
```

When Phase 1 complete:
```yaml
  phase_1_talib:
    status: completed
    completion_date: "2025-11-09"
    outputs_created:
      - requirements-matrix.yaml
    quality_gate: passed
    notes: "All requirements refined and validated"
```

---

## Common Questions

### Q: How long does Phase 1 take?

**A**: 2-3 days typically
- 1-2 hours: Talib analyzes your documents
- 4-16 hours: Q&A and clarifications (depends on requirement clarity)
- 1-2 hours: Final artifacts generated

**Faster if:** Your requirements are already well-documented
**Slower if:** Lots of ambiguities or gaps requiring clarification

### Q: What if my requirements are incomplete?

**A**: Perfect! That's what Phase 1 is for.
- Talib will identify gaps
- Ask clarifying questions
- Help you fill in missing details
- Result: Complete, clear requirements

### Q: Can I skip Phase 1?

**A**: Technically yes, but not recommended:
- **Best for:** Simple projects (< 5 features), clear requirements
- **Not recommended:** Complex projects, multi-team, or regulatory requirements

If skipping: Phase 2 (PMA) will do basic requirements analysis, but less comprehensive

### Q: What format should my PRD be in?

**A**: Any format works!
- Word documents
- PDFs
- Google Docs / Wiki pages
- Slides
- Informal notes
- Even voice/video transcripts

Talib works with whatever you have

### Q: Will Talib change my requirements?

**A**: No, Talib clarifies and organizes, not changes:
- Talib asks questions to understand your intent
- Talib organizes into structured hierarchy
- Talib identifies ambiguities for you to resolve
- You stay in control of scope and priorities

### Q: How do I provide feedback to Talib?

**A**: Just chat directly
```bash
cd robot_talib
# Talib is actively listening - tell it:
# "I'm concerned about X"
# "Please focus on feature Y"
# "Here's additional context on Z"
```

Talib adjusts based on your feedback

---

## Requirements-Matrix.yaml Structure

**Phase 1 Output: requirements-matrix.yaml**

```yaml
epics:
  - id: EPIC-001
    name: "User Account Management"
    description: "Allow users to create, manage accounts"
    priority: High
    acceptance_criteria:
      - Users can sign up
      - Users can log in
      - Users can update profile

    features:
      - id: FEAT-001.1
        name: "User Registration"
        description: "New users can create accounts"
        priority: High
        acceptance_criteria:
          - User provides email and password
          - Email validation occurs
          - Account created in database

        stories:
          - id: STORY-001.1.1
            name: "Display registration form"
            acceptance_criteria:
              - Form shows email field
              - Form shows password field
              - Form shows submit button

      - id: FEAT-001.2
        name: "User Login"
        description: "Existing users can log in"
        ...

  - id: EPIC-002
    name: "Project Management"
    ...
```

---

## Troubleshooting

### "Talib can't understand my requirements"

**Solution:**
1. Provide additional context or examples
2. Answer Talib's clarifying questions in detail
3. Share any reference documents or links
4. Consider breaking complex requirements into smaller pieces

### "Talib says requirements are incomplete"

**Solution:**
1. This is normal - Phase 1 is designed to find gaps
2. Work with Talib to fill gaps
3. Provide additional detail or context
4. Ask Talib to clarify what's missing

### "Talib's interpretation doesn't match my intent"

**Solution:**
1. Tell Talib directly: "That's not what I meant"
2. Provide clarification or examples
3. Talib will adjust understanding and continue

### "Session crashed mid-Phase 1"

**Solution:**
1. Restart robot: `cd robot_talib`
2. Robot reads `current_work.md` and resumes
3. Recovery should take < 5 minutes
4. No work lost

See: `robot-protocols/robot-generic-protocols.md#RP-7.6` for session recovery details

---

## Next Steps After Phase 1

**When Phase 1 Complete:**

1. ✅ `requirements-matrix.yaml` exists
2. ✅ All requirements clear and unambiguous
3. ✅ `project_activity.status` updated

**Next Phase:**

→ Launch PMA (Project Manager/Architect) for Phase 2
→ PMA reads requirements-matrix.yaml and creates architecture

```bash
./scripts/create-robot.sh pma
cd robot_pma
# Claude reads CLAUDE.md and starts Phase 2
```

See: `00-start/README.md` for complete phase progression

---

## Reference Documents

**For more detail:**
- `02-phase1-requirements/role-talib.md` - Complete Talib role specification
- `01-methodology/operational-design-principles.md` - 14 core governance principles
- `robot-protocols/robot-generic-protocols.md` - Detailed robot protocols (RP-1 through RP-8)
- `00-start/README.md` - Full ROME 6.0 project launch guide

**For implementation:**
- `02-phase1-requirements/phase1-artifact-schemas.md` - YAML schema details
- `02-phase1-requirements/phase1-to-phase2-handoff.md` - Phase 1→2 handoff protocol

---

**Ready to start Phase 1?**

```bash
./scripts/create-robot.sh talib
cd robot_talib
# Talib starts Phase 1 immediately
```

Let Talib guide you through requirements refinement!
