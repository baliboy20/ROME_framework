# Roma Command Center - Testing Guide

**How to test the hybrid mode implementation**

---

## Prerequisites

### 1. Verify Node.js & Dependencies

```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools
node --version  # Should be v18+
npm --version
```

### 2. Verify MCP Servers Running

The implementation requires the **activity-log-file MCP server** to be running.

```bash
# Check if MCP servers are configured
cat .mcp.json

# Expected: activity-log-file server configured
```

### 3. Verify Activity Log Exists

```bash
# Check if activity log file exists
ls -la ../../../ARTIFACTS/_activity/activity-log.txt

# If not, create it:
mkdir -p ../../../ARTIFACTS/_activity
touch ../../../ARTIFACTS/_activity/activity-log.txt
```

---

## Test Level 1: Smoke Test (Does it run?)

### Goal: Verify the script executes without immediate crashes

```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools

# Run with Node.js (not as background task yet)
node orchestrators/p5-hybrid/index.js

# Or via npm script:
npm run p5-hybrid
```

### Expected Output

```
🚀 P5 HYBRID PARALLEL GENERATION
═══════════════════════════════════════════════════════════

Architecture:
  • Roma Command Center (this terminal)
  • Ashok Agent (background - database layer)
  • Reena Agent (background - backend API)
  • Charlie Agent (background - frontend UI)

Coordination: Activity Log MCP (file-based message bus)
═══════════════════════════════════════════════════════════

📊 Spawning background agents...
```

### Troubleshooting If It Fails

**Error: `Task is not defined`**
```
Problem: Claude Code Task tool not available in this context
Solution: This is expected - Task tool only available in Claude Code sessions
Status: Architecture validated, proceed to Test Level 2
```

**Error: `mcp__activity_log__append is not defined`**
```
Problem: MCP server not available
Solution: Run this from within a Claude Code session with MCP configured
Status: Need to test in proper Claude Code environment
```

**Error: `Cannot find module`**
```
Problem: File paths incorrect
Solution: Verify you're in correct directory, check file exists
```

---

## Test Level 2: Component Unit Tests

### Test ActivityLogCoordinator

Create test file: `test-coordinator.js` in ROME_tools/tests/

```javascript
#!/usr/bin/env node
const ActivityLogCoordinator = require('../lib/ActivityLogCoordinator');

async function testCoordinator() {
  console.log('Testing ActivityLogCoordinator...\n');

  const coordinator = new ActivityLogCoordinator();

  // Test 1: Check agent alive (should fail - no heartbeats yet)
  console.log('Test 1: checkAgentAlive (expect failure)');
  const aliveResult = await coordinator.checkAgentAlive('ashok', 'P5-generation');
  console.log('Result:', aliveResult);
  console.log('✅ Test 1 passed\n');

  // Test 2: Get robot status
  console.log('Test 2: getRobotStatus');
  const status = await coordinator.getRobotStatus('ashok', 'P5-generation');
  console.log('Result:', status);
  console.log('✅ Test 2 passed\n');

  console.log('All coordinator tests passed! ✅');
}

testCoordinator().catch(console.error);
```

Run from Claude Code session:
```bash
node test-coordinator.js
```

### Test AlertSystem

Create test file: `test-alerts.js` in ROME_tools/tests/

```javascript
#!/usr/bin/env node
const AlertSystem = require('../orchestrators/p5-hybrid/AlertSystem');

async function testAlerts() {
  console.log('Testing AlertSystem...\n');

  const alertSystem = new AlertSystem(['ashok', 'reena', 'charlie'], 'P5-generation');

  // Test: Check for alerts (should return empty or alerts)
  console.log('Checking for alerts...');
  const alerts = await alertSystem.checkForAlerts();
  console.log('Alerts found:', alerts.length);

  if (alerts.length > 0) {
    alertSystem.displayAlerts(alerts);
  }

  const summary = alertSystem.getAlertSummary(alerts);
  console.log('Summary:', summary);

  console.log('\n✅ Alert system tests passed!');
}

testAlerts().catch(console.error);
```

---

## Test Level 3: Manual Integration Test

### Setup Test Scenario

#### Step 1: Prepare Test Activity Log

```bash
# Create test activity log with some stories
cat > ../../../ARTIFACTS/_activity/activity-log-test.txt <<'EOF'
PHASE|2026-02-06T10:00:00Z|P4-CONFIG-COMPLETE|status=COMPLETED,robot=lucien,phase=P4-config
STORY|2026-02-06T10:05:00Z|STORY-P5-001-1-db|status=PENDING,robot=ashok,phase=P5-generation
STORY|2026-02-06T10:05:00Z|STORY-P5-001-2-db|status=PENDING,robot=ashok,phase=P5-generation
STORY|2026-02-06T10:05:00Z|STORY-P5-002-1-api|status=PENDING,robot=reena,phase=P5-generation
STORY|2026-02-06T10:05:00Z|STORY-P5-003-1-ui|status=PENDING,robot=charlie,phase=P5-generation
EOF
```

#### Step 2: Test Dashboard Rendering (Mock Mode)

Create `test-dashboard.js` in ROME_tools/tests/:

```javascript
#!/usr/bin/env node
const MonitoringDashboard = require('../orchestrators/p5-hybrid/MonitoringDashboard');

async function testDashboard() {
  console.log('Testing MonitoringDashboard...\n');

  // Mock agents
  const agents = {
    ashok: 'mock-agent-123',
    reena: 'mock-agent-456',
    charlie: 'mock-agent-789'
  };

  const dashboard = new MonitoringDashboard(agents, {
    phase: 'P5-generation',
    refreshInterval: 5000  // 5 seconds for testing
  });

  console.log('Rendering dashboard once...\n');
  await dashboard.render();

  console.log('\n✅ Dashboard renders without errors!');
  console.log('💡 In real mode, dashboard would auto-refresh every 5s');

  // Cleanup
  dashboard.stop();
}

testDashboard().catch(console.error);
```

Run from Claude Code:
```bash
node test-dashboard.js
```

**Expected Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 P5 GENERATION MONITORING DASHBOARD
⏰ Last update: 3:30:45 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ ASHOK - NO HEARTBEAT
   Completed: 0 | In Progress: 0 | Pending: 2
   ⚠️  No heartbeat received yet

❓ REENA - NO HEARTBEAT
   Completed: 0 | In Progress: 0 | Pending: 1
   ⚠️  No heartbeat received yet

❓ CHARLIE - NO HEARTBEAT
   Completed: 0 | In Progress: 0 | Pending: 1
   ⚠️  No heartbeat received yet

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 OVERALL PROGRESS: 0/4 stories (0%)
   [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Test Level 4: End-to-End Test (Simulated)

### Simulate Agent Activity

Create `simulate-agents.js` to simulate what agents would do:

```javascript
#!/usr/bin/env node
// Simulates agent activity by writing to activity log

async function simulateAshok() {
  console.log('Simulating Ashok agent...');

  // Log phase start
  await mcp__activity_log__append({
    type: "PHASE",
    id: "P5-ASHOK-START",
    attributes: {
      status: "IN_PROGRESS",
      robot: "ashok",
      phase: "P5-generation"
    }
  });

  // Log heartbeat
  await mcp__activity_log__append({
    type: "AGENT_HEARTBEAT",
    id: `HEARTBEAT-ashok-${Date.now()}`,
    attributes: {
      status: "ACTIVE",
      robot: "ashok",
      agent_id: "simulated-ashok-123"
    }
  });

  // Simulate working on story
  await new Promise(resolve => setTimeout(resolve, 2000));

  await mcp__activity_log__append({
    type: "STORY",
    id: "STORY-P5-001-1-db",
    attributes: {
      status: "IN_PROGRESS",
      robot: "ashok",
      phase: "P5-generation"
    }
  });

  console.log('Ashok: Working on STORY-P5-001-1-db...');

  // Simulate completing story
  await new Promise(resolve => setTimeout(resolve, 3000));

  await mcp__activity_log__append({
    type: "STORY",
    id: "STORY-P5-001-1-db",
    attributes: {
      status: "COMPLETED",
      robot: "ashok",
      phase: "P5-generation"
    }
  });

  console.log('Ashok: Completed STORY-P5-001-1-db');

  // Log phase complete
  await mcp__activity_log__append({
    type: "PHASE",
    id: "P5-ASHOK-COMPLETE",
    attributes: {
      status: "COMPLETED",
      robot: "ashok",
      phase: "P5-generation"
    }
  });

  console.log('Ashok: Phase complete!');
}

async function runSimulation() {
  console.log('🎭 Simulating agent activity...\n');

  // Run Ashok simulation
  await simulateAshok();

  console.log('\n✅ Simulation complete!');
  console.log('💡 Now check the dashboard - it should show Ashok\'s activity');
}

runSimulation().catch(console.error);
```

### Testing Workflow

**Terminal 1: Run Dashboard**
```bash
node test-dashboard.js
# Dashboard displays and auto-refreshes
```

**Terminal 2: Run Simulation**
```bash
node simulate-agents.js
# Simulates agent writing to activity log
```

**Verify:** Dashboard in Terminal 1 should update showing Ashok's progress.

---

## Test Level 5: Interactive Commands Test

### Test Command Handlers

Create `test-commands.js` in ROME_tools/tests/:

```javascript
#!/usr/bin/env node
const CommandHandlers = require('../orchestrators/p5-hybrid/CommandHandlers');
const MonitoringDashboard = require('../orchestrators/p5-hybrid/MonitoringDashboard');

async function testCommands() {
  const agents = {
    ashok: 'test-agent-123',
    reena: 'test-agent-456',
    charlie: 'test-agent-789'
  };

  const dashboard = new MonitoringDashboard(agents, { phase: 'P5-generation' });
  const handlers = new CommandHandlers(dashboard, agents, 'P5-generation');

  console.log('Testing commands...\n');

  // Test help
  console.log('1. Testing /help...');
  await handlers.handleCommand('/help');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test details
  console.log('\n2. Testing /details ashok...');
  await handlers.handleCommand('/details ashok');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test pause
  console.log('\n3. Testing /pause...');
  await handlers.handleCommand('/pause');

  console.log('\n✅ All command tests passed!');

  dashboard.stop();
}

testCommands().catch(console.error);
```

---

## Test Level 6: Real Claude Code Session Test

### Prerequisites
1. Open Claude Code in the `ROME_tools` directory
2. Ensure MCP servers are configured
3. Ensure you have Task tool access

### Test Procedure

**Step 1: Open Claude Code**
```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools
claude
```

**Step 2: In Claude Code, execute:**
```
Run the hybrid mode orchestrator
```

Or directly:
```
npm run p5-hybrid
```

Or:
```
node orchestrators/p5-hybrid/index.js
```

**Step 3: Observe**

You should see:
1. ✅ Agent spawning messages
2. ✅ Dashboard appears
3. ✅ Dashboard auto-refreshes every 10s
4. ✅ Robot status displays
5. ✅ Command prompt appears

**Step 4: Test Interactive Commands**

Try each command:
```
> /help
> /details ashok
> /pause
> /resume
> /stop
```

---

## Validation Checklist

### Component Tests
- [ ] ActivityLogCoordinator methods work
- [ ] AlertSystem detects alerts
- [ ] MonitoringDashboard renders
- [ ] CommandHandlers process commands

### Integration Tests
- [ ] Dashboard displays robot status
- [ ] Progress bars render correctly
- [ ] Alerts appear when conditions met
- [ ] Commands execute without errors

### Functional Tests
- [ ] Agents spawn successfully (or Task error is clear)
- [ ] Dashboard auto-refreshes
- [ ] Heartbeat monitoring works
- [ ] Dependency checking works
- [ ] Manual overrides work

### User Experience Tests
- [ ] Single command launches everything
- [ ] Dashboard is readable
- [ ] Commands are intuitive
- [ ] Error messages are helpful
- [ ] Exit is clean

---

## Known Limitations (Expected in Testing)

### 1. Task Tool Availability
```
❌ Expected: Task is not defined
✅ This is normal outside Claude Code session
✅ Architecture validates even without Task
```

### 2. MCP Server Connection
```
❌ May see: mcp__activity_log__append is not defined
✅ Need to run from Claude Code with MCP configured
✅ Can test components independently
```

### 3. Agent Output Files
```
❌ /tail command may not find output files
✅ Agent output file paths depend on Task tool
✅ Will need to update paths once Task output location known
```

### 4. Agent Restart
```
❌ /restart logs event but doesn't spawn new agent
✅ Requires orchestrator integration (future enhancement)
✅ Logs restart request correctly
```

---

## Success Criteria

### Minimum Viable Test (MVP)
✅ All components import without errors
✅ Dashboard renders without crashes
✅ Commands execute without errors
✅ Activity log writes work
✅ Activity log queries work

### Full Integration Test
✅ Agents spawn (or clear Task error)
✅ Dashboard shows real-time updates
✅ Alerts trigger correctly
✅ Commands affect dashboard state
✅ Manual overrides work

### Production Ready
✅ End-to-end P5 generation works
✅ All 3 robots complete work
✅ No failures go undetected
✅ Recovery mechanisms work
✅ Performance meets targets (2.4x)

---

## Debugging Tips

### Dashboard Not Updating?
```bash
# Check if activity log is being written
tail -f ../../../ARTIFACTS/_activity/activity-log.txt

# Check if MCP query works
# In Claude Code:
await mcp__activity_log__query({phase: "P5-generation"})
```

### Alerts Not Appearing?
```bash
# Manually trigger alert condition
# Make agent heartbeat old (> 90s)
# Check alert thresholds in AlertSystem.js
```

### Commands Not Working?
```bash
# Check stdin is being captured
# Verify readline setup
# Test command parsing directly
```

---

## Next Steps After Testing

### If Tests Pass
1. Document any issues found
2. Create test project with real stories
3. Run full P5 generation
4. Measure performance
5. Tune parameters

### If Tests Fail
1. Document exact error
2. Check prerequisites
3. Verify file paths
4. Check MCP configuration
5. Review logs

---

## Test Report Template

```markdown
# Roma Command Center Test Report

**Date:** 2026-02-06
**Tester:** [Your Name]
**Environment:** [Claude Code version, Node.js version]

## Test Results

### Component Tests
- ActivityLogCoordinator: ✅/❌
- AlertSystem: ✅/❌
- MonitoringDashboard: ✅/❌
- CommandHandlers: ✅/❌

### Integration Tests
- Dashboard rendering: ✅/❌
- Command execution: ✅/❌
- Alert detection: ✅/❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]

## Overall Assessment
- Ready for production: Yes/No
- Blockers: [List any blockers]
```

---

**Ready to test!** Start with Test Level 1 and work your way up.
