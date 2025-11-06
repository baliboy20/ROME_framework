# Robot Notes Templates

This directory contains templates for robot-specific notes and tracking files.

## Templates

### current_work.md
**Purpose:** Track what the robot is currently working on

**Sections:**
- In Progress - Active work items
- Status - Phase, last updated, next steps
- Notes - Decisions, blockers, assumptions

**Updated:** Continuously as work progresses

---

### completed_features.md
**Purpose:** Log of finished features for reference

**Sections:**
- Feature ID/Name
- Description
- Files Changed
- Tests Added
- Notes

**Updated:** When features are completed

---

### blockers.md
**Purpose:** Track issues preventing progress

**Sections:**
- Active Blockers - Current blocking issues
- Resolved Blockers - Historical blocks and resolutions

**Updated:** When blockers identified or resolved

**Escalation:** If blocked >2 days, escalate to Chaperone

---

## Usage

### When Creating Robot Directory

Notes are copied from templates:
```bash
cp /ROME/templates/robot-notes/*.md robot_<name>/notes/
```

### Gitignore

Notes are **project-specific** and should be gitignored:
```
robot_*/notes/current_work.md
robot_*/notes/completed_features.md
robot_*/notes/blockers.md
```

Only `.gitkeep` tracked to maintain directory structure.

## Best Practices

1. **Update notes regularly** - Keep current_work.md current
2. **Log completions** - Move finished work to completed_features.md
3. **Document blockers** - Don't let blockers go undocumented
4. **Escalate early** - If blocked >2 days, escalate
5. **Clean format** - Use markdown for readability

## Benefits

- Provides visibility into robot progress
- Helps resume work after interruption
- Documents decisions and assumptions
- Tracks blockers for resolution
- Historical record of work completed
