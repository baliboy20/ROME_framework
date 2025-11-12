# Reena (Backend Engineer) - MCP Examples

## Your Role
You implement backend/API layer (Phase 3 - Layer 2-3).

## Finding Your Work

```javascript
// Get all your assigned features
const myWork = await mcp__activity-log__find_by_robot('reena')

// Filter to backend layer only
const apiWork = myWork.filter(e => e.layer === 'backend')

// Find what's ready to start (database complete)
const readyToStart = []
for (const work of apiWork) {
  if (work.status === 'PENDING') {
    // Check if database work is complete
    const dbWork = await mcp__activity-log__find_by_id(work.feature + '-db')
    if (dbWork && dbWork.status === 'COMPLETED') {
      readyToStart.push(work)
    }
  }
}

console.log(`${readyToStart.length} features ready to start (DB complete)`)
```

## Checking Database Dependency

```javascript
// Before starting API work, verify database is ready
const feat001 = await mcp__activity-log__find_by_feature('FEAT-001')

const dbWork = feat001.find(e => e.layer === 'database')
if (dbWork.status === 'COMPLETED') {
  console.log('✓ Database ready - can start API work')

  // Update your work to IN_PROGRESS
  await mcp__activity-log__update_entry('FEAT-001-api', {
    status: 'IN_PROGRESS',
    startDate: new Date().toISOString(),
    notes: 'Creating API endpoints for user authentication'
  })
} else {
  console.log('⏳ Waiting for Ashok to complete database schema')
}
```

## Completing API Work

```javascript
// When endpoints are complete and integration tests pass
await mcp__activity-log__update_entry('FEAT-001-api', {
  status: 'COMPLETED',
  completionDate: new Date().toISOString(),
  testLevel: 'Integration',
  notes: 'API endpoints complete: POST /auth/register, POST /auth/login, integration tests passing'
})
```

## Creating Blocker

```javascript
// If you're blocked by something
await mcp__activity-log__add_entry({
  type: 'blocker',
  severity: 'HIGH',
  feature: 'FEAT-001',
  description: 'Need password hashing library decision from PMA',
  robot: 'reena',
  status: 'OPEN',
  createdDate: new Date().toISOString()
})
```

## Checking What Charlie Needs

```javascript
// See what frontend work is waiting for your API
const feat001 = await mcp__activity-log__find_by_feature('FEAT-001')

const uiWork = feat001.find(e => e.layer === 'frontend')
console.log('Charlie needs:', uiWork.notes)
// Example: "Waiting for /auth/register endpoint from Reena"
```

## Typical Workflow

```javascript
// 1. Find features where DB is complete
const myWork = await mcp__activity-log__find_by_robot('reena')

for (const work of myWork) {
  if (work.status === 'PENDING') {
    // Check dependency
    const dbWork = await mcp__activity-log__find_by_id(work.feature + '-db')
    if (dbWork && dbWork.status === 'COMPLETED') {
      console.log(`Ready to start: ${work.id}`)

      // Start work
      await mcp__activity-log__update_entry(work.id, {
        status: 'IN_PROGRESS',
        startDate: new Date().toISOString()
      })
      break // Start first ready feature
    }
  }
}

// 2. ... implement API, write integration tests ...

// 3. Complete work
await mcp__activity-log__update_entry('FEAT-001-api', {
  status: 'COMPLETED',
  completionDate: new Date().toISOString(),
  testLevel: 'Integration',
  notes: 'API complete, tests passing'
})
```

## Quick Reference

| Task | MCP Function |
|------|--------------|
| Find my work | `mcp__activity-log__find_by_robot('reena')` |
| Check DB ready | `mcp__activity-log__find_by_id('FEAT-001-db')` |
| Start feature | `mcp__activity-log__update_entry(id, {status: 'IN_PROGRESS', ...})` |
| Complete feature | `mcp__activity-log__update_entry(id, {status: 'COMPLETED', ...})` |
| Create blocker | `mcp__activity-log__add_entry({type: 'blocker', ...})` |
