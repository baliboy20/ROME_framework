# Robot Naming Conventions Guide
**Version**: 1.0 - Consistent Naming for AI Agent Directories
**Last Updated**: 2025-10-30
**Purpose**: Establish standardized naming for robot/agent directories throughout the ROME methodology

---

## Executive Summary

**The Problem**: Robot directories use generic names (`claude_pma`, `claude_chaperone`) while the documentation refers to robots by human names (Charlie, Reena, Ashok, Clara). This creates inconsistency and confusion.

**The Solution**: Adopt a consistent naming convention where robot directories reflect the named roles they embody.

---

## Part 1: Robot Directory Naming Standard

### 1.1 Naming Convention

**Format**: `robot_[firstname_lowercase]`

**Examples**:
- `robot_charlie` - Frontend Developer
- `robot_reena` - Backend Engineer
- `robot_ashok` - Data Architect
- `robot_clara` - UX Designer
- `robot_roma` - Project Coordinator/Escalation Handler
- `robot_pma` - Project Manager/Architect (PMA role)
- `robot_chaperone` - Specification Refinement Specialist

### 1.2 Full Robot Mapping

| Robot Name    | Role | Directory | Responsibilities |
|---------------|------|-----------|------------------|
| **Charlie**   | Frontend Developer | `robot_charlie/` | Layer 4-6 Implementation (Data, Domain, Presentation) |
| **Reena**     | Backend Engineer | `robot_reena/` | Layer 2-3 Implementation (API, Business Logic) |
| **Ashok**     | Data Architect | `robot_ashok/` | Layer 1 Implementation (Database Schema, Migrations) |
| **Clara**     | UX Designer | `robot_clara/` | Design Validation, User Experience Specifications |
| **Roma**      | Project Coordinator | `robot_roma/` | Escalations, Cross-team Issues, Project Status |
| **PMA**       | Project Manager/Architect | `robot_pma/` | Requirements Analysis, Feature Decomposition, Architecture |
| **Chaperone** | Specification Specialist | `robot_chaperone/` | Specification Refinement (Phase 1), Design Validation (Phase 3) |
| **Lucien**    | DevOps Engineer | `robot_devops/` | Deployment, Infrastructure, Environment Management |

### 1.3 Directory Structure Standard

Each robot directory should follow this structure:

```
robot_[name]/
├── .claude/
│   ├── CLAUDE.md                    (Robot instructions & context)
│   └── settings.local.json          (Robot-specific settings)
├── notes/
│   ├── current_work.md              (What robot is currently working on)
│   ├── completed_features.md        (Completed work log)
│   └── blockers.md                  (Issues preventing progress)
├── templates/
│   ├── [role-specific templates]
│   └── README.md                    (Template documentation)
├── checklist/
│   ├── pre_implementation.md        (Pre-work checklist)
│   ├── during_implementation.md     (Progress checkpoints)
│   └── post_implementation.md       (Completion verification)
└── README.md                         (Robot overview & quick start)
```

### 1.4 Robot-Specific CLAUDE.md Structure

Each robot's `CLAUDE.md` should include:

```markdown
# [Robot Name] Instructions

**Robot**: [Name] (robot_[name]/)
**Role**: [Full Role Title]
**Responsibilities**: [Key responsibilities]

## Your Job

[High-level description of what this robot does]

## Key Protocols

[Role-specific ROME protocols]

## Standards

[How this robot follows ROME standards]

## Success Criteria

[How to know the work is done well]

## Files You Work With

[List of key files this robot creates/modifies]

## Who You Work With

[Which other robots/roles depend on your work]

## Resources

- ROME/role-[role].md - Full role specification
- ROME/[relevant guides] - Implementation guides
- PROJECT/[feature path] - Feature-specific files
```

---

## Part 2: Migration Plan

### 2.1 Renaming Existing Directories

**Current State**:
```
/romev2/
├── claude_pma/         → Should be: robot_pma/
├── claude_chaperone/   → Should be: robot_chaperone/
└── .claude/
```

**Action Steps**:

1. **Create new directories with correct names**
2. **Copy contents from old directories**
3. **Update all references in documentation**
4. **Update all git ignores and CI/CD configs**
5. **Remove old directories** (after verification)

### 2.2 Documentation Update Strategy

**Files that reference robot directories** (found via search):
- `/ROME/start-here.md`
- `/ROME/ROME-4.0-COMPLETE-GUIDE.md`
- `/ROME/rom-quickstart.md`
- `/ROME/USER-QUICKSTART.md`
- `/ROME/document-management-strategy.md`
- `/ROME/chaperone-comprehensive-guide.md`

**Update approach**:
1. Change all `claude_pma` references to `robot_pma`
2. Change all `claude_chaperone` references to `robot_chaperone`
3. Add named robot references: `robot_charlie/`, `robot_reena/`, `robot_ashok/`, `robot_clara/`

### 2.3 References to Update

**In ROME documentation**:

Search & Replace patterns:
- `claude_pma` → `robot_pma`
- `claude_chaperone` → `robot_chaperone`
- `PROJECT/` paths that reference old names → update to new paths

**In project structure references**:

Before:
```
PROJECT/
├── specification_augmented.md (created by claude_chaperone)
├── data_model.md (created by claude_pma)
├── use_cases.md (created by claude_pma)
└── actionlist.md (created by claude_pma)
```

After (clarified):
```
PROJECT/
├── specification_augmented.md (created by robot_chaperone Phase 1)
├── data_model.md (created by robot_pma)
├── use_cases.md (created by robot_pma)
├── actionlist.md (created by robot_pma)
├── design_approval.md (created by robot_chaperone Phase 3, robot_clara)
├── robot_charlie/ (implementation files)
├── robot_reena/ (implementation files)
└── robot_ashok/ (implementation files)
```

---

## Part 3: Documentation Pattern Updates

### 3.1 Updated Pattern: How to Reference Robots

**OLD (Generic) Pattern**:
```markdown
The PMA creates the feature specification.
The Chaperone refines requirements.
```

**NEW (Consistent) Pattern**:
```markdown
robot_pma creates the feature specification.
robot_chaperone refines requirements.

Location: `robot_[name]/` directory
```

### 3.2 Updated Pattern: File Ownership

**OLD Pattern**:
```markdown
File: specification_augmented.md
Created by: Chaperone
```

**NEW Pattern**:
```markdown
File: specification_augmented.md
Created by: robot_chaperone
Location: PROJECT/specification_augmented.md
Owned by: robot_chaperone
```

### 3.3 Updated Pattern: Handoff Points

**OLD Pattern**:
```markdown
When Chaperone completes Phase 1, pass to PMA for Phase 2.
```

**NEW Pattern**:
```markdown
When robot_chaperone completes Phase 1:
├── Location: PROJECT/specification_augmented.md
├── Handoff: To robot_pma
├── Next: robot_pma creates data_model.md
└── Location: PROJECT/data_model.md
```

---

## Part 4: Cross-Robot Coordination Map

### 4.1 Who Works With Whom

```
robot_chaperone (Phase 1)
├── Takes input from: User/Stakeholder
├── Creates: specification_augmented.md
└── Hands off to: robot_pma

robot_pma (Phase 2)
├── Takes input from: specification_augmented.md (from robot_chaperone)
├── Creates: data_model.md, use_cases.md, actionlist.md
├── Coordinates with: robot_clara (for design validation)
└── Hands off to: robot_chaperone (Phase 3)

robot_clara (Throughout)
├── Takes input from: data_model.md, use_cases.md
├── Creates: DESIGN/ artifacts
├── Validates with: robot_ashok, robot_reena, robot_charlie
└── Reports to: robot_pma, robot_roma

robot_chaperone (Phase 3)
├── Takes input from: data_model.md, use_cases.md, DESIGN/ artifacts
├── Validates: Design and specification alignment
├── Creates: design_approval.md
└── Hands off to: robot_charlie, robot_reena, robot_ashok

robot_charlie (Layer 4-6)
├── Takes input from: design_approval.md, actionlist.md, DESIGN/
├── Creates: frontend implementation
├── Validates with: robot_clara
└── Reports to: robot_pma

robot_reena (Layer 2-3)
├── Takes input from: design_approval.md, actionlist.md
├── Creates: backend implementation
├── Validates with: robot_clara
└── Reports to: robot_pma

robot_ashok (Layer 1)
├── Takes input from: data_model.md, design_approval.md
├── Creates: database implementation
├── Validates with: robot_clara
└── Reports to: robot_pma

robot_roma (Throughout)
├── Monitors: All robot progress
├── Escalates: Blockers and cross-team issues
├── Reports to: User/Stakeholder
└── Coordinates: Between robot_pma and implementation robots
```

---

## Part 5: Implementation Files & Artifacts

### 5.1 What Each Robot Creates

| Robot | Primary Artifacts | Location |
|-------|-------------------|----------|
| **robot_chaperone** | specification_augmented.md, design_approval.md | PROJECT/ |
| **robot_pma** | data_model.md, use_cases.md, actionlist.md | PROJECT/ |
| **robot_clara** | DESIGN/design_system.md, DESIGN/COMPONENT_SPECS/, DESIGN/MOCKUPS/ | DESIGN/ |
| **robot_charlie** | Layer 4-6 implementation (data, domain, presentation) | PROJECT/[package]/lib/ |
| **robot_reena** | Layer 2-3 implementation (API, business logic) | Backend repo/src/ |
| **robot_ashok** | Layer 1 implementation (database, migrations) | Backend repo/migrations/ |
| **robot_roma** | project_activity.status, escalation_log.md | PROJECT/dev/ |
| **robot_devops** | Deployment configs, environment setup | .github/, docker/, etc. |

### 5.2 Artifact Annotations Include Robot Name

```markdown
## Project List Feature

@CreatedBy robot_pma
@ValidatedBy robot_clara
@ImplementedBy robot_charlie
@ApprovedBy robot_chaperone

[Content...]
```

---

## Part 6: File & Directory Updating Checklist

### Phase 1: Review All References
- [ ] Search all ROME/ docs for `claude_pma` and `claude_chaperone`
- [ ] Identify all references that need updating
- [ ] List all paths that reference old directory names

### Phase 2: Create New Directories
- [ ] Create `robot_pma/` directory structure
- [ ] Create `robot_chaperone/` directory structure
- [ ] Copy `.claude/CLAUDE.md` from old to new
- [ ] Update CLAUDE.md with new naming context

### Phase 3: Update Documentation
- [ ] Update all files in `ROME/` that reference old names
- [ ] Update robot role specifications (role-pma.md, role-chaperone.md)
- [ ] Add naming conventions to role specifications
- [ ] Update quick-start guides with new directory names

### Phase 4: Create Robot Setup Guides
- [ ] Create `robot_charlie/README.md` (frontend setup)
- [ ] Create `robot_reena/README.md` (backend setup)
- [ ] Create `robot_ashok/README.md` (data setup)
- [ ] Create `robot_clara/README.md` (UX setup)
- [ ] Create `robot_pma/README.md` (project management setup)
- [ ] Create `robot_chaperone/README.md` (specification setup)

### Phase 5: Clean Up
- [ ] Remove old `claude_pma/` directory
- [ ] Remove old `claude_chaperone/` directory
- [ ] Verify all git references are updated
- [ ] Update CI/CD configs if any reference old names

### Phase 6: Verification
- [ ] Grep entire repo for old names (should find zero matches in docs)
- [ ] Run all quick-start guides with new names
- [ ] Verify robot directories are accessible
- [ ] Document new naming in main README

---

## Part 7: Naming Consistency Across Documentation

### 7.1 Update These Documents

| Document | Changes |
|----------|---------|
| ROME-4.0-COMPLETE-GUIDE.md | Replace `claude_pma` → `robot_pma`, `claude_chaperone` → `robot_chaperone` |
| start-here.md | Update phase references to use robot names |
| rome-quickstart.md | Update all robot directory references |
| USER-QUICKSTART.md | Update all robot directory references |
| role-pma.md | Add naming context: "Also known as robot_pma" |
| role-chaperone.md | Add naming context: "Also known as robot_chaperone" |
| document-management-strategy.md | Update artifact location references |
| chaperone-comprehensive-guide.md | Update all directory references |

### 7.2 Add to All Robot Role Specs

Add this section to each role document:

```markdown
## Robot Directory

This role is instantiated as a Claude AI robot in the `robot_[name]/` directory:

**Location**: `/robot_[name]/`

**Directory Structure**:
```
robot_[name]/
├── .claude/
│   ├── CLAUDE.md                (Instructions for this robot)
│   └── settings.local.json      (Configuration)
├── notes/
│   ├── current_work.md          (In-progress tasks)
│   ├── completed_features.md    (Completed work)
│   └── blockers.md              (Issues & dependencies)
└── README.md                     (Quick reference)
```

**Handoff Convention**:
When work is complete, artifacts are located at:
- Primary artifacts: `PROJECT/[artifact name]`
- Robot notes: `robot_[name]/notes/`
- Status: `PROJECT/dev/project_activity.status`
```

---

## Part 8: Benefits of Consistent Naming

### 8.1 Clarity Improvements

| Before | After | Benefit |
|--------|-------|---------|
| "Claude does it" | "robot_pma does it" | Clear which role is performing the action |
| "Put it in claude_pma/" | "Put it in robot_pma/" | Directory name matches role name |
| "Who is Charlie?" | "robot_charlie = Frontend" | Robot names map to roles |
| Generic "Claude" everywhere | Named robots | Clear responsibility and ownership |

### 8.2 Scalability Benefits

- **Adding new robots**: Easy - follow naming pattern `robot_[name]/`
- **Identifying robot specialties**: Name immediately tells you the role
- **Managing multiple robot instances**: Can have `robot_charlie_v2/` if needed
- **Documentation clarity**: All references are consistent

### 8.3 Human-Centric Benefits

- Team members can say: "Charlie is working on the frontend"
- Clear accountability: "robot_charlie owns this feature"
- Natural communication: Names are memorable, not generic
- Better storytelling: "Here's how Charlie (robot_charlie) built the UI"

---

## Part 9: Quick Reference Table

### Current → New Naming

| Current Name | New Name | Full Path | Role |
|--------------|----------|-----------|------|
| `claude_pma` | `robot_pma` | `/robot_pma/` | Project Manager/Architect |
| `claude_chaperone` | `robot_chaperone` | `/robot_chaperone/` | Specification Specialist |
| N/A | `robot_charlie` | `/robot_charlie/` | Frontend Developer |
| N/A | `robot_reena` | `/robot_reena/` | Backend Engineer |
| N/A | `robot_ashok` | `/robot_ashok/` | Data Architect |
| N/A | `robot_clara` | `/robot_clara/` | UX Designer |
| N/A | `robot_roma` | `/robot_roma/` | Project Coordinator |
| N/A | `robot_devops` | `/robot_devops/` | DevOps Engineer |

---

## Conclusion

This naming convention:
- ✅ Aligns robot directories with their role names
- ✅ Provides consistent references throughout documentation
- ✅ Makes ownership and responsibility clear
- ✅ Scales for future robot additions
- ✅ Improves human-centric understanding of the methodology

**Next Steps**:
1. Review this guide with the team
2. Execute Phase 1 (Review All References)
3. Create new robot directories with correct names
4. Update all ROME documentation
5. Remove old directories
6. Verify all references are consistent
