# ROME Reference Guide

## Table of Contents
1. [7-Step Protocol](#7-step-protocol)
2. [Module Design Principles](#module-design-principles)
3. [Quality Gates](#quality-gates)
4. [Coordination Protocols](#coordination-protocols)
5. [Task Classification](#task-classification)
6. [File Formats](#file-formats)

## Enhanced 7-Step Protocol (TDD-ROME)

Every Rodeo MUST follow these steps for each task:

| Step | Action | Description | Output |
|------|--------|-------------|--------|
| 1 | **READ** | Understand requirements and context | Mental model of task |
| 2 | **ANALYZE** | Break down into testable contracts | Interface specifications |
| 3 | **TEST-FIRST** | Write failing tests for interfaces | Contract test suite |
| 4 | **CLARIFY** | Resolve test ambiguities | Clear test specifications |
| 5 | **IMPLEMENT** | Write minimum code to pass tests | Working solution |
| 6 | **VALIDATE** | Ensure comprehensive test coverage | Complete test suite |
| 7 | **REPORT** | Update status with test evidence | Status with test metrics |

### TDD Protocol Enforcement
- **CRITICAL**: Steps 1-4 MUST complete before ANY implementation
- **NO CODE WITHOUT TESTS**: Implementation only begins after failing tests exist
- **Test Evidence Required**: Step 7 must include test coverage metrics
- **Roma Enforcement**: Roma blocks task completion without passing tests

### Why TDD-ROME?
- **Reduces Rework**: 21% API failure rate eliminated through contract tests
- **Parallel Safety**: Clear interfaces prevent integration issues
- **Quality Built-In**: Tests drive design, not validate after

## Module Design Principles

### Core Principles

1. **High Cohesion**: Related functionality stays together
2. **Loose Coupling**: Minimal dependencies between modules
3. **Clear Interfaces**: Well-defined contracts
4. **Single Responsibility**: One module, one purpose

### Module Boundaries

| Good Module | Bad Module |
|-------------|------------|
| User Authentication | User Management + Auth + Profile |
| Payment Processing | Payment + Order + Inventory |
| Email Service | Email + SMS + Push Notifications |

### Interface Definition
```typescript
// Good: Clear contract
interface AuthService {
  login(credentials: LoginDto): Promise<AuthToken>
  logout(token: string): Promise<void>
  verify(token: string): Promise<User>
}

// Bad: Unclear responsibilities
interface UserService {
  doEverything(action: string, data: any): any
}
```

## Quality Gates

### Code Quality Requirements

| Gate | Criteria | Tool/Method |
|------|----------|-------------|
| **Syntax** | No syntax errors | Linter |
| **Tests** | All tests pass | Test runner |
| **Coverage** | >80% code coverage | Coverage tool |
| **Security** | No vulnerabilities | Security scan |
| **Performance** | Meets benchmarks | Profiler |

### Documentation Standards

- [ ] All public APIs documented
- [ ] README updated with changes
- [ ] Complex logic has inline comments
- [ ] Examples provided for new features

## Coordination Protocols

### Task Assignment
```markdown
## Module: [Name] | Rodeo: [Assigned] | Priority: [HIGH/MED/LOW]
- [ ] Task description with clear acceptance criteria
- [ ] Dependencies: [List any blocking tasks]
- [ ] Deadline: [If applicable]
```

### Status Updates
```
Format: Module | Status | Rodeo | Timestamp | Notes
Example: Auth | COMPLETED | backend | 2024-01-15 10:30 | All tests passing
```

### Blocking Issues
```markdown
🔴 BLOCKED: [Module Name]
Reason: [Specific blocker]
Needs: [What would unblock]
Impact: [Other affected modules]
```

## Task Classification

### Critical Path Analysis

| Type | Symbol | Description | Example |
|------|--------|-------------|---------|
| **BLOCKING** | 🔴 | Must complete first | Database schema |
| **SEMI-BLOCKING** | 🟡 | Needed for integration | API endpoints |
| **NON-BLOCKING** | 🟢 | Can be done anytime | Documentation |

### Priority Matrix

|  | Urgent | Not Urgent |
|--|--------|------------|
| **Important** | Do First (🔴) | Schedule (🟡) |
| **Not Important** | Delegate (🟡) | Defer (🟢) |

## File Formats

### actionlist.md
```markdown
# Project Action List
Last Updated: [Date]

## Backend Module | Rodeo: Reena | Status: IN_PROGRESS
- [x] Create user model (COMPLETED: 2024-01-15)
- [ ] Implement auth endpoints (IN_PROGRESS)
- [ ] Add rate limiting (PENDING)

## Frontend Module | Rodeo: Charlie | Status: BLOCKED
- [ ] Create login form (BLOCKED: Waiting for API specs)
```

### project_activity.status
```
Auth Module | IN_PROGRESS | backend | 2024-01-15 10:30:00 | Working on JWT implementation
User UI | COMPLETED | frontend | 2024-01-15 09:45:00 | All components tested
Database | BLOCKED | data | 2024-01-15 11:00:00 | Waiting for schema approval
```

### project_tasks.log (Shared Coordination)
```
[2024-01-15 10:30:00] [backend] [START] Implementing JWT authentication
[2024-01-15 10:45:00] [backend] [COMPLETE] JWT implementation done
[2024-01-15 11:00:00] [frontend] [BLOCKED] Waiting for API documentation
```

### robot_activity_[name].log (Individual Robot Tracking)
```
# Backend Robot (Reena) Activity Log
## ROME 7-Step Protocol Execution

### Step 1: READ
- [COMPLETED] Reviewed ROME methodology documents
- [COMPLETED] Read project requirements

### Step 4: IMPLEMENT
- [IN_PROGRESS] Creating user authentication endpoints
- [COMPLETED] JWT token generation implemented

### Step 7: REPORT
- [COMPLETED] Updated shared project_tasks.log
- [COMPLETED] Updated individual robot_activity_reena.log
```

## Dual Logging Protocol

All robots MUST maintain both:
1. **Shared Log**: `PROJECT/dev/project_tasks.log` - Key milestones for coordination
2. **Individual Log**: `PROJECT/dev/robot_activity_[name].log` - Detailed ROME step execution

This provides both high-level project coordination and detailed individual robot visibility.

## Quick Reference Commands

```bash
# Check current status
grep "IN_PROGRESS" PROJECT/dev/project_activity.status

# Find blockers
grep "BLOCKED" PROJECT/dev/actionlist.md

# View recent activity
tail -20 PROJECT/dev/project_tasks.log

# Count completed tasks
grep -c "COMPLETED" PROJECT/dev/actionlist.md
```