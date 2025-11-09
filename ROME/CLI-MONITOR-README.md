# ROME v6.1 CLI Tool & Real-Time Monitor

## Overview

ROME v6.1 introduces two critical tools for efficient activity log management:

1. **rome-cli.js** - Command-line tool for robots to update activity status
2. **monitor/** - Web-based real-time dashboard for Roma and project sponsors

---

## 1. Rome CLI Tool

### Installation

```bash
# Make executable
chmod +x ROME/scripts/rome-cli.js

# Install dependencies
npm install commander cli-table3 chalk
```

### Quick Start

```bash
# View activity summary
./ROME/scripts/rome-cli.js summary

# View all entries (filtered)
./ROME/scripts/rome-cli.js view

# View only your robot's work
./ROME/scripts/rome-cli.js view --filter-robot charlie

# View only blocked entries
./ROME/scripts/rome-cli.js view --filter-status BLOCKED
```

### Common Commands

#### Update Status

**Robots use this constantly** to mark progress:

```bash
# Mark feature complete
rome-cli update-status FEAT-001-db COMPLETED

# Mark story in progress
rome-cli update-status STORY-001-1-1-api IN_PROGRESS

# Mark blocked with notes
rome-cli update-status FEAT-001-ui BLOCKED --notes "Waiting for Clara design validation"
```

#### Add Blocker

When you hit a dependency or issue:

```bash
# Add blocker (defaults to roma as reporter)
rome-cli add-blocker STORY-001-1-2-api "Password validation strategy unclear"

# Add blocker with severity
rome-cli add-blocker FEAT-001-db --severity CRITICAL --robot ashok

# Specify which robot found it
rome-cli add-blocker STORY-001-2-2-ui --severity MEDIUM --robot charlie
```

#### Resolve Blocker

```bash
# Mark blocker resolved (roma does this usually)
rome-cli resolve-blocker BLOCK-001
```

#### Request Amendment

Phase 3 robots can request changes to Phase 1-2 work:

```bash
# Request amendment (awaits review)
rome-cli request-amendment FEAT-001 "Add 2FA requirement to auth flow"

# With target phase and severity
rome-cli request-amendment FEAT-001 "API response format needs adjustment" --target-phase 2 --severity HIGH
```

#### Approve Amendment

Roma approves after decision:

```bash
rome-cli approve-amendment AMD-001
```

#### View Activity

Quick filtered views:

```bash
# View all features
rome-cli view --filter-type feature

# View all stories for feature
rome-cli view --filter-feature FEAT-001

# View all blockers
rome-cli view --filter-type blocker --filter-status OPEN

# View all amendments pending approval
rome-cli view --filter-type amendment --filter-status PENDING_REVIEW

# Export as JSON (for scripts/tools)
rome-cli view --filter-robot charlie --format json
```

#### Summary

Quick snapshot of project health:

```bash
rome-cli summary
```

Output:
```
📊 Project Summary

Total Features: 5
Total Stories: 23
Completed Features: 2
In Progress Stories: 8
Blocked Entries: 3
Open Blockers: 2
Pending Amendments: 1
```

### Workflow Examples

#### Charlie (Frontend Developer) - Daily Standup

```bash
# 9 AM - Check what I'm supposed to do
rome-cli view --filter-robot charlie --filter-status PENDING | head

# 10 AM - Start work
rome-cli update-status STORY-001-2-1-ui IN_PROGRESS

# 3 PM - Hit a blocker
rome-cli add-blocker STORY-001-2-1-ui "Clara design tokens file still undefined" --severity HIGH

# 5 PM - Work blocked, switch to another story
rome-cli update-status STORY-001-2-2-ui IN_PROGRESS

# EOD - Commit progress
rome-cli update-status STORY-001-2-2-ui COMPLETED --notes "Form validation working, ready for Clara review"
```

#### Roma (Coordinator) - Monitoring

```bash
# Morning - Check project health
rome-cli summary

# See blockers requiring escalation
rome-cli view --filter-type blocker --filter-status OPEN

# See which robots are blocked
rome-cli view --filter-status BLOCKED

# Resolve blocker (after decision)
rome-cli resolve-blocker BLOCK-001

# Approve amendment
rome-cli approve-amendment AMD-001
```

---

## 2. Real-Time Monitor Dashboard

### Installation

```bash
cd ROME/monitor
npm install
npm start
```

Server listens on `http://localhost:3000`

### Features

#### Live Dashboard
- **Real-time updates** - WebSocket connection automatically pushes changes
- **Statistics** - Total features, completed, in-progress, blocked, open issues
- **Robot activity** - Per-robot breakdown (pending/in-progress/completed/blocked)
- **Blockers** - Live list of open blockers (auto-expands as they're added)
- **Amendments** - Pending amendment requests with target phase
- **Connection status** - Live indicator (green = connected, red = disconnected)

#### What Roma Sees

At a glance:
- Project progress (% of features complete)
- Which robots are bottlenecks (most blocked)
- What's blocking whom (blocker → affected stories)
- Amendment pipeline (what's awaiting decision)
- Team velocity (completed per phase)

#### What Sponsors See

- Phase progress
- Critical blockers (CRITICAL/HIGH severity)
- Timeline impact (blockers → delays)
- Team capacity (robots at capacity?)

### API Endpoints

The monitor also exposes REST APIs:

```bash
# Get full activity log with stats
curl http://localhost:3000/api/activity

# Get just statistics
curl http://localhost:3000/api/statistics

# Filter entries
curl http://localhost:3000/api/entries?status=BLOCKED
curl http://localhost:3000/api/entries?robot=charlie
curl http://localhost:3000/api/entries?type=blocker&status=OPEN

# Get specific entry
curl http://localhost:3000/api/entries/STORY-001-1-1-db

# Get robot summary
curl http://localhost:3000/api/robots/charlie

# Get all blockers
curl http://localhost:3000/api/blockers

# Get all amendments
curl http://localhost:3000/api/amendments?status=PENDING_REVIEW

# Health check
curl http://localhost:3000/api/health
```

### Running Both Simultaneously

```bash
# Terminal 1: Start monitor
cd ROME/monitor && npm start

# Terminal 2: Use CLI to make updates
./ROME/scripts/rome-cli.js update-status STORY-001-1-1-db IN_PROGRESS

# Watch monitor dashboard update in real-time!
# Open http://localhost:3000 in browser
```

---

## Integration with Robot Workflows

### Phase 1 (Talib)

```bash
# After requirements completed
rome-cli update-status PHASE-1 COMPLETED

# Log any blockers found
rome-cli add-blocker FEAT-001 "Business rule X ambiguous, seeking clarification"
```

### Phase 2 (PMA + Clara)

```bash
# PMA marks features designed
rome-cli update-status FEAT-001-api IN_PROGRESS

# Clara logs design validation results
rome-cli update-status FEAT-001-ui IN_PROGRESS

# If design issues found
rome-cli add-blocker FEAT-001-ui "Component spec missing responsive behavior" --robot clara
```

### Phase 2B (Sarah - QA Gate)

```bash
# After review
rome-cli update-status PHASE-2B COMPLETED

# If approved
rome-cli view --filter-type phase --filter-status APPROVED

# If blocked
rome-cli add-blocker PHASE-2B "Technical architecture missing caching strategy" --severity CRITICAL --robot sarah
```

### Phase 3 (Ashok/Reena/Charlie - Development)

```bash
# Daily standup updates
rome-cli update-status STORY-001-1-1-db IN_PROGRESS
rome-cli update-status STORY-001-1-1-api IN_PROGRESS
rome-cli update-status STORY-001-2-1-ui IN_PROGRESS

# If integration fails
rome-cli add-blocker STORY-001-1-1-api "Database schema doesn't support API response format" --robot reena

# Request amendment to Phase 2 (schema change)
rome-cli request-amendment FEAT-001 "API response needs user.role field" --target-phase 2 --severity MEDIUM --robot reena

# Mark complete when done
rome-cli update-status STORY-001-1-1-db COMPLETED
rome-cli update-status STORY-001-1-1-api COMPLETED
rome-cli update-status STORY-001-2-1-ui COMPLETED
```

---

## Activity Log Format

**File**: `ROME/templates/project-activity-status.json`

Structure: Flat, parseable, designed for both CLI and web dashboard:

```json
{
  "project": "ProjectName",
  "version": "6.1",
  "lastUpdated": "2025-11-09T15:45:00Z",
  "entries": [
    {
      "id": "STORY-001-1-1-db",
      "type": "story",
      "feature": "FEAT-001",
      "story": "STORY-001-1-1",
      "storyName": "As a user, I want to create an account",
      "phase": "3",
      "layer": "database",
      "robot": "ashok",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "testLevel": "Integration",
      "blocker": null,
      "amendment": null,
      "startDate": "2025-11-09T09:00:00Z",
      "lastUpdate": "2025-11-09T15:30:00Z",
      "completionDate": null,
      "notes": "Schema created, integration tests running"
    }
  ]
}
```

See `ROME/templates/project-activity-status-schema.json` for full schema.

---

## Troubleshooting

### CLI not executable

```bash
chmod +x ROME/scripts/rome-cli.js
```

### CLI not finding activity log

Ensure your working directory is correct and file exists:
```bash
ls ROME/templates/project-activity-status.json
```

### Monitor server won't start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Use different port
PORT=3001 npm start
```

### Monitor not updating in real-time

- Check browser console for WebSocket errors
- Ensure `ROME/templates/project-activity-status.json` exists
- CLI updates should trigger monitor refresh (debounced 500ms)

---

## Summary

**For Robots**: Use CLI daily to track work status. Simple commands, no manual JSON editing.

**For Roma**: Use monitor to oversee all robots, spot blockers, approve amendments.

**For Sponsors**: View monitor dashboard to see project health, progress, critical issues.

**For Tools/Automation**: Use REST API to integrate with other systems (Slack bots, dashboards, reports).

---

Created: 2025-11-09 by Roma
ROME v6.1
