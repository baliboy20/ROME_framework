# Ashok (Data Architect) - MCP Examples

## Your Role
You implement database layer (Phase 3 - Layer 1).

## Finding Your Work

```javascript
// Get all your assigned features
const myWork = await mcp__activity-log__find_by_robot('ashok')

// Filter to database layer only
const dbWork = myWork.filter(e => e.layer === 'database')

// Find pending work
const pending = dbWork.filter(e => e.status === 'PENDING')

console.log(`You have ${pending.length} pending database features`)
```

## Starting a Feature

```javascript
// When you start working on FEAT-001-db
await mcp__activity-log__update_entry('FEAT-001-db', {
  status: 'IN_PROGRESS',
  startDate: new Date().toISOString(),
  notes: 'Creating users table schema'
})
```

## Completing a Feature

```javascript
// When schema is complete and integration tests pass
await mcp__activity-log__update_entry('FEAT-001-db', {
  status: 'COMPLETED',
  completionDate: new Date().toISOString(),
  testLevel: 'Integration',
  notes: 'Schema complete: users table with auth fields, integration tests passing'
})
```

## Creating a Blocker

```javascript
// If you need something before you can proceed
await mcp__activity-log__add_entry({
  type: 'blocker',
  severity: 'HIGH',
  feature: 'FEAT-001',
  description: 'Need clarification on user roles structure from PMA',
  robot: 'ashok',
  status: 'OPEN',
  createdDate: new Date().toISOString()
})
```

## Checking What Reena Needs

```javascript
// See what backend work depends on your database work
const feat001 = await mcp__activity-log__find_by_feature('FEAT-001')

const apiWork = feat001.find(e => e.layer === 'backend')
console.log('Reena is waiting for:', apiWork.notes)
// Example: "Waiting for users table schema from Ashok"
```

## Typical Workflow

```javascript
// 1. Find your work
const myWork = await mcp__activity-log__find_by_robot('ashok')
const pending = myWork.filter(e => e.status === 'PENDING')

// 2. Pick first pending feature
const feat = pending[0]
console.log(`Starting ${feat.id}: ${feat.featureName}`)

// 3. Update to IN_PROGRESS
await mcp__activity-log__update_entry(feat.id, {
  status: 'IN_PROGRESS',
  startDate: new Date().toISOString(),
  notes: 'Creating database schema'
})

// 4. ... implement schema, write integration tests ...

// 5. Update to COMPLETED
await mcp__activity-log__update_entry(feat.id, {
  status: 'COMPLETED',
  completionDate: new Date().toISOString(),
  testLevel: 'Integration',
  notes: 'Schema complete, integration tests passing'
})

// 6. Move to next feature
```

## Quick Reference

| Task | MCP Function |
|------|--------------|
| Find my work | `mcp__activity-log__find_by_robot('ashok')` |
| Start feature | `mcp__activity-log__update_entry(id, {status: 'IN_PROGRESS', ...})` |
| Complete feature | `mcp__activity-log__update_entry(id, {status: 'COMPLETED', ...})` |
| Create blocker | `mcp__activity-log__add_entry({type: 'blocker', ...})` |
| Check feature | `mcp__activity-log__find_by_feature('FEAT-001')` |
