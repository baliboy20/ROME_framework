# Roma (Project Coordinator) - MCP Examples

## Your Role
Monitor all phases, coordinate robots, manage blockers.

## Dashboard Overview

```javascript
// Get complete project statistics
const stats = await mcp__activity-log__get_statistics()

console.log('Project Overview:')
console.log('Total entries:', stats.total_entries)
console.log('\nFeatures by status:')
console.log('  COMPLETED:', stats.features_by_status.COMPLETED || 0)
console.log('  IN_PROGRESS:', stats.features_by_status.IN_PROGRESS || 0)
console.log('  BLOCKED:', stats.features_by_status.BLOCKED || 0)
console.log('  PENDING:', stats.features_by_status.PENDING || 0)
console.log('\nBlockers by severity:')
console.log('  CRITICAL:', stats.blockers_by_severity.CRITICAL || 0)
console.log('  HIGH:', stats.blockers_by_severity.HIGH || 0)
console.log('  MEDIUM:', stats.blockers_by_severity.MEDIUM || 0)
```

## Find All Blockers (Critical for Coordination)

```javascript
// Get all open blockers
const allBlockers = await mcp__activity-log__list_all_entries({
  type: 'blocker',
  status: 'OPEN'
})

console.log(`Found ${allBlockers.length} open blockers:`)
allBlockers.forEach(b => {
  console.log(`  [${b.severity}] ${b.id} - ${b.robot}: ${b.description}`)
})
```

## Check Each Robot's Status

```javascript
// See what each robot is working on
const robots = ['talib', 'pma', 'clara', 'sarah', 'ashok', 'reena', 'charlie']

for (const robot of robots) {
  const work = await mcp__activity-log__find_by_robot(robot)
  const inProgress = work.filter(e => e.status === 'IN_PROGRESS')
  const blocked = work.filter(e => e.status === 'BLOCKED')

  console.log(`\n${robot.toUpperCase()}:`)
  console.log(`  In Progress: ${inProgress.length}`)
  if (inProgress.length > 0) {
    inProgress.forEach(w => console.log(`    - ${w.id}: ${w.notes}`))
  }
  console.log(`  Blocked: ${blocked.length}`)
  if (blocked.length > 0) {
    blocked.forEach(w => console.log(`    - ${w.id}: blocker ${w.blocker}`))
  }
}
```

## Check Phase Status

```javascript
// Are all phases progressing correctly?
const phase1 = await mcp__activity-log__find_by_id('PHASE-1')
const phase2 = await mcp__activity-log__find_by_id('PHASE-2')
const phase2b = await mcp__activity-log__find_by_id('PHASE-2b')

console.log('Phase Status:')
console.log(`  Phase 1 (Talib): ${phase1?.status || 'NOT_STARTED'}`)
console.log(`  Phase 2 (PMA): ${phase2?.status || 'NOT_STARTED'}`)
console.log(`  Phase 2B (Sarah): ${phase2b?.status || 'NOT_STARTED'}`)

if (phase2b && phase2b.gateDecision) {
  console.log(`  Phase 2B Gate: ${phase2b.gateDecision}`)
  if (phase2b.gateDecision === 'BLOCKED') {
    console.log(`  Blocking issues: ${phase2b.blockingIssues}`)
  }
}
```

## Check Feature Progress

```javascript
// See complete status of a feature across all layers
const feat001 = await mcp__activity-log__find_by_feature('FEAT-001')

console.log('FEAT-001: User Authentication')
feat001.forEach(entry => {
  const status = entry.status === 'COMPLETED' ? '✓' :
                 entry.status === 'IN_PROGRESS' ? '⏳' :
                 entry.status === 'BLOCKED' ? '🚫' : '⏸'

  console.log(`  ${status} ${entry.layer} (${entry.robot}): ${entry.status}`)
  if (entry.notes) console.log(`      ${entry.notes}`)
})
```

## Resolve Blocker

```javascript
// When a blocker is resolved
await mcp__activity-log__update_entry('BLOCK-001', {
  status: 'RESOLVED',
  resolvedDate: new Date().toISOString()
})

// Unblock the related feature
await mcp__activity-log__update_entry('FEAT-001-api', {
  blocker: null,
  status: 'IN_PROGRESS',
  notes: 'Blocker resolved, resuming work'
})
```

## Check Dependencies

```javascript
// Is database work complete before backend starts?
const dbWork = await mcp__activity-log__find_by_layer('database')
const dbComplete = dbWork.every(e => e.status === 'COMPLETED')

if (dbComplete) {
  console.log('✓ All database work complete')

  // Check if backend can proceed
  const apiWork = await mcp__activity-log__find_by_layer('backend')
  const apiPending = apiWork.filter(e => e.status === 'PENDING')

  if (apiPending.length > 0) {
    console.log(`Reena can start ${apiPending.length} API features`)
  }
}
```

## Find Amendments Pending Review

```javascript
// Check for amendment requests from Phase 3
const amendments = await mcp__activity-log__list_all_entries({
  type: 'amendment',
  status: 'PENDING_REVIEW'
})

console.log(`${amendments.length} amendments pending review:`)
amendments.forEach(a => {
  console.log(`  ${a.id} (${a.severity}): ${a.description}`)
  console.log(`    Requested by: ${a.requestedBy}`)
  console.log(`    Target phase: ${a.targetPhase}`)
})
```

## Update Phase Status

```javascript
// Mark phase complete
await mcp__activity-log__update_entry('PHASE-1', {
  status: 'COMPLETED',
  completionDate: new Date().toISOString(),
  notes: 'Requirements complete, requirements-matrix.yaml delivered'
})

// Mark phase 2B gate decision
await mcp__activity-log__update_entry('PHASE-2b', {
  status: 'COMPLETED',
  gateDecision: 'APPROVED',
  completionDate: new Date().toISOString(),
  notes: 'Design validated across all 8 dimensions - approved for Phase 3'
})
```

## Generate Status Report

```javascript
// Comprehensive status for weekly report
async function generateStatusReport() {
  const stats = await mcp__activity-log__get_statistics()
  const blockers = await mcp__activity-log__list_all_entries({
    type: 'blocker',
    status: 'OPEN'
  })

  const phase1 = await mcp__activity-log__find_by_id('PHASE-1')
  const phase2 = await mcp__activity-log__find_by_id('PHASE-2')
  const phase2b = await mcp__activity-log__find_by_id('PHASE-2b')

  console.log('=== ROME Project Status Report ===\n')
  console.log('Overall Progress:')
  console.log(`  Completed: ${stats.features_by_status.COMPLETED || 0}`)
  console.log(`  In Progress: ${stats.features_by_status.IN_PROGRESS || 0}`)
  console.log(`  Blocked: ${stats.features_by_status.BLOCKED || 0}`)
  console.log(`  Pending: ${stats.features_by_status.PENDING || 0}`)
  console.log('')
  console.log('Phase Status:')
  console.log(`  Phase 1: ${phase1?.status || 'NOT_STARTED'}`)
  console.log(`  Phase 2: ${phase2?.status || 'NOT_STARTED'}`)
  console.log(`  Phase 2B: ${phase2b?.status || 'NOT_STARTED'}`)
  console.log('')
  console.log(`Active Blockers: ${blockers.length}`)
  if (blockers.length > 0) {
    blockers.forEach(b => {
      console.log(`  - [${b.severity}] ${b.description}`)
    })
  }
}

await generateStatusReport()
```

## Quick Reference

| Task | MCP Function |
|------|--------------|
| Dashboard stats | `mcp__activity-log__get_statistics()` |
| All blockers | `mcp__activity-log__list_all_entries({type: 'blocker', status: 'OPEN'})` |
| Robot status | `mcp__activity-log__find_by_robot('ashok')` |
| Feature status | `mcp__activity-log__find_by_feature('FEAT-001')` |
| Phase status | `mcp__activity-log__find_by_id('PHASE-1')` |
| Layer status | `mcp__activity-log__find_by_layer('database')` |
| Resolve blocker | `mcp__activity-log__update_entry('BLOCK-001', {status: 'RESOLVED'})` |
| Update phase | `mcp__activity-log__update_entry('PHASE-1', {status: 'COMPLETED'})` |
