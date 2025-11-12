# Charlie (Frontend Developer) - MCP Examples

## Your Role
You implement frontend/UI layer (Phase 3 - Layer 4-6).

## Finding Your Work

```javascript
// Get all your assigned features
const myWork = await mcp__activity-log__find_by_robot('charlie')

// Filter to frontend layer only
const uiWork = myWork.filter(e => e.layer === 'frontend')

// Find what's ready to start (API complete)
const readyToStart = []
for (const work of uiWork) {
  if (work.status === 'PENDING') {
    // Check if API work is complete
    const apiWork = await mcp__activity-log__find_by_id(work.feature + '-api')
    if (apiWork && apiWork.status === 'COMPLETED') {
      readyToStart.push(work)
    }
  }
}

console.log(`${readyToStart.length} features ready to start (API complete)`)
```

## Checking API Dependency

```javascript
// Before starting UI work, verify API is ready
const feat001 = await mcp__activity-log__find_by_feature('FEAT-001')

const apiWork = feat001.find(e => e.layer === 'backend')
const dbWork = feat001.find(e => e.layer === 'database')

if (apiWork.status === 'COMPLETED' && dbWork.status === 'COMPLETED') {
  console.log('✓ API ready - can start UI work')

  // Update your work to IN_PROGRESS
  await mcp__activity-log__update_entry('FEAT-001-ui', {
    status: 'IN_PROGRESS',
    startDate: new Date().toISOString(),
    designValidation: 'PENDING',  // Clara will validate
    notes: 'Creating login/register screens'
  })
} else {
  console.log('⏳ Waiting for Reena to complete API endpoints')
}
```

## Requesting Design Validation

```javascript
// When you complete UI, request Clara's validation
await mcp__activity-log__update_entry('FEAT-001-ui', {
  status: 'IN_PROGRESS',
  designValidation: 'IN_PROGRESS',
  notes: 'UI implemented, requesting Clara validation'
})
```

## After Clara Approves

```javascript
// Once Clara validates design matches specs
await mcp__activity-log__update_entry('FEAT-001-ui', {
  status: 'COMPLETED',
  completionDate: new Date().toISOString(),
  testLevel: 'Integration',
  designValidation: 'PASS',
  notes: 'UI complete: login/register screens, Clara approved design, integration tests passing'
})
```

## Creating Blocker

```javascript
// If you're blocked
await mcp__activity-log__add_entry({
  type: 'blocker',
  severity: 'HIGH',
  feature: 'FEAT-001',
  description: 'Need design tokens from Clara for button colors',
  robot: 'charlie',
  status: 'OPEN',
  createdDate: new Date().toISOString()
})
```

## Checking Feature Complete End-to-End

```javascript
// Is this feature done across all layers?
const feat001 = await mcp__activity-log__find_by_feature('FEAT-001')

const allComplete = feat001.every(e => e.status === 'COMPLETED')

if (allComplete) {
  console.log('✓ FEAT-001 is complete end-to-end (DB + API + UI)')
} else {
  feat001.forEach(e => {
    console.log(`${e.layer}: ${e.status}`)
  })
}
```

## Typical Workflow

```javascript
// 1. Find features where API is complete
const myWork = await mcp__activity-log__find_by_robot('charlie')

for (const work of myWork) {
  if (work.status === 'PENDING') {
    // Check dependencies
    const apiWork = await mcp__activity-log__find_by_id(work.feature + '-api')
    if (apiWork && apiWork.status === 'COMPLETED') {
      console.log(`Ready to start: ${work.id}`)

      // Start work
      await mcp__activity-log__update_entry(work.id, {
        status: 'IN_PROGRESS',
        startDate: new Date().toISOString(),
        designValidation: 'PENDING'
      })
      break // Start first ready feature
    }
  }
}

// 2. ... implement UI, write integration tests ...

// 3. Request Clara validation
await mcp__activity-log__update_entry('FEAT-001-ui', {
  designValidation: 'IN_PROGRESS',
  notes: 'UI complete, requesting design validation'
})

// 4. After Clara approves, mark complete
await mcp__activity-log__update_entry('FEAT-001-ui', {
  status: 'COMPLETED',
  completionDate: new Date().toISOString(),
  testLevel: 'Integration',
  designValidation: 'PASS',
  notes: 'Complete with Clara approval'
})
```

## Quick Reference

| Task | MCP Function |
|------|--------------|
| Find my work | `mcp__activity-log__find_by_robot('charlie')` |
| Check API ready | `mcp__activity-log__find_by_id('FEAT-001-api')` |
| Start feature | `mcp__activity-log__update_entry(id, {status: 'IN_PROGRESS', ...})` |
| Request validation | `mcp__activity-log__update_entry(id, {designValidation: 'IN_PROGRESS'})` |
| Complete feature | `mcp__activity-log__update_entry(id, {status: 'COMPLETED', ...})` |
| Check full feature | `mcp__activity-log__find_by_feature('FEAT-001')` |
