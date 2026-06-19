# Roma Procedure: Startup Project Status Check

## Step 1: Verify Project Structure

```
Check:
- .rome-project.json exists
- ARTIFACTS/ structure exists
- _user_input/raw-requirements/ has materials
- _user_input/technical-brief.yaml present (optional — note if absent)
- MCP activity log responding
```

Read project metadata:
```javascript
Read: .rome-project.json

Extract:
- projectName
- databaseName (for MCP connection)
- sponsor
- romeVersion
- frameworkPath
```

## Step 2: Verify MCP Connection

```javascript
mcp__activity-log__get_statistics()

Verify:
- Connected to correct database
- PHASE entries exist (P0, P1, P2, P3, P4, P5)
- No orphaned entries
```

## Step 3: Check Phase Status

```javascript
const state = mcp__activity-log-file__query({})

For each phase (P0-P5):
  const phaseStatus = state.phases["PHASE-[N]"].status

  Verify status is valid:
  - PENDING (not started)
  - IN_PROGRESS (active)
  - COMPLETED (done)
```

## Step 4: Check for Stale Entries

```javascript
Find entries with:
- status = IN_PROGRESS
- No updates in > 24 hours

Flag stale entries for robot follow-up
```
