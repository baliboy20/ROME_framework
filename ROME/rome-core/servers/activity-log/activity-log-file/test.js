#!/usr/bin/env node

/**
 * ROME Activity Log File - Test Suite
 */

import fs from 'fs/promises';
import path from 'path';
import { parseEventLine, formatEventLine, getCurrentTimestamp, validateEvent } from './lib/event-parser.js';
import { buildState, getHistory, queryState } from './lib/state-builder.js';

const TEST_DIR = '/tmp/rome-activity-log-test';
const TEST_LOG = path.join(TEST_DIR, 'activity-log.txt');

async function setup() {
  // Clean test directory
  try {
    await fs.rm(TEST_DIR, { recursive: true });
  } catch {}
  await fs.mkdir(TEST_DIR, { recursive: true });
}

async function cleanup() {
  try {
    await fs.rm(TEST_DIR, { recursive: true });
  } catch {}
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

async function test_parseEventLine() {
  console.log('TEST: parseEventLine');

  const line = '2025-12-03T10:00:00Z | STORY | STORY-001-001-1-db | status:IN_PROGRESS | robot:ashok | title:"User table"';
  const event = parseEventLine(line);

  assert(event !== null, 'Event should be parsed');
  assert(event.timestamp === '2025-12-03T10:00:00Z', 'Timestamp should match');
  assert(event.type === 'STORY', 'Type should match');
  assert(event.id === 'STORY-001-001-1-db', 'ID should match');
  assert(event.attributes.status === 'IN_PROGRESS', 'Status should match');
  assert(event.attributes.robot === 'ashok', 'Robot should match');
  assert(event.attributes.title === 'User table', 'Title should be unquoted');

  console.log('  ✅ PASS');
}

async function test_formatEventLine() {
  console.log('TEST: formatEventLine');

  const event = {
    timestamp: '2025-12-03T10:00:00Z',
    type: 'STORY',
    id: 'STORY-001-001-1-db',
    attributes: {
      status: 'IN_PROGRESS',
      robot: 'ashok',
      title: 'User table'
    }
  };

  const line = formatEventLine(event);
  assert(line.includes('2025-12-03T10:00:00Z'), 'Should include timestamp');
  assert(line.includes('STORY'), 'Should include type');
  assert(line.includes('STORY-001-001-1-db'), 'Should include ID');
  assert(line.includes('status:IN_PROGRESS'), 'Should include status');
  assert(line.includes('robot:ashok'), 'Should include robot');
  assert(line.includes('title:"User table"'), 'Should quote title with spaces');

  console.log('  ✅ PASS');
}

async function test_validateEvent() {
  console.log('TEST: validateEvent');

  const validEvent = {
    type: 'STORY',
    id: 'STORY-001-001-1-db',
    attributes: {
      status: 'IN_PROGRESS',
      robot: 'ashok'
    }
  };

  const validation = validateEvent(validEvent);
  assert(validation.valid, 'Valid event should pass validation');

  const invalidEvent = {
    type: 'INVALID',
    id: 'STORY-001',
    attributes: {
      robot: 'ashok'
    }
  };

  const invalidValidation = validateEvent(invalidEvent);
  assert(!invalidValidation.valid, 'Invalid event should fail validation');
  assert(invalidValidation.errors.length > 0, 'Should have error messages');

  console.log('  ✅ PASS');
}

async function test_buildState() {
  console.log('TEST: buildState');

  const eventLog = `# ROME Activity Log
# Test

2025-12-03T10:00:00Z | STORY | STORY-001 | status:PENDING | robot:talib
2025-12-03T11:00:00Z | STORY | STORY-001 | status:IN_PROGRESS | robot:ashok | started:2025-12-03T11:00:00Z
2025-12-03T12:00:00Z | STORY | STORY-001 | status:COMPLETED | robot:ashok | completed:2025-12-03T12:00:00Z
2025-12-03T10:30:00Z | BLOCKER | BLOCK-001 | status:OPEN | severity:HIGH | robot:talib
`;

  const state = buildState(eventLog);

  assert(state.stories['STORY-001'], 'Story should exist in state');
  assert(state.stories['STORY-001'].status === 'COMPLETED', 'Story should be COMPLETED (latest event)');
  assert(state.stories['STORY-001'].robot === 'ashok', 'Robot should be ashok');
  assert(state.blockers['BLOCK-001'], 'Blocker should exist');
  assert(state.blockers['BLOCK-001'].status === 'OPEN', 'Blocker should be OPEN');

  // Check indexes
  assert(state.by_robot.ashok, 'Index by robot should exist');
  assert(state.by_robot.ashok.includes('STORY-001'), 'Ashok should be indexed for STORY-001');
  assert(state.by_status.COMPLETED, 'Index by status should exist');
  assert(state.by_status.COMPLETED.includes('STORY-001'), 'STORY-001 should be in COMPLETED index');

  // Check statistics
  assert(state.statistics.total_stories === 1, 'Should have 1 story');
  assert(state.statistics.completed_stories === 1, 'Should have 1 completed story');
  assert(state.statistics.open_blockers === 1, 'Should have 1 open blocker');

  console.log('  ✅ PASS');
}

async function test_getHistory() {
  console.log('TEST: getHistory');

  const eventLog = `2025-12-03T10:00:00Z | STORY | STORY-001 | status:PENDING | robot:talib
2025-12-03T11:00:00Z | STORY | STORY-001 | status:IN_PROGRESS | robot:ashok
2025-12-03T12:00:00Z | STORY | STORY-001 | status:COMPLETED | robot:ashok
`;

  const history = getHistory(eventLog, 'STORY-001');

  assert(history.length === 3, 'Should have 3 events');
  assert(history[0].status === 'PENDING', 'First event should be PENDING');
  assert(history[1].status === 'IN_PROGRESS', 'Second event should be IN_PROGRESS');
  assert(history[2].status === 'COMPLETED', 'Third event should be COMPLETED');

  console.log('  ✅ PASS');
}

async function test_queryState() {
  console.log('TEST: queryState');

  const eventLog = `2025-12-03T10:00:00Z | STORY | STORY-001 | status:COMPLETED | robot:ashok
2025-12-03T11:00:00Z | STORY | STORY-002 | status:IN_PROGRESS | robot:ashok
2025-12-03T12:00:00Z | STORY | STORY-003 | status:IN_PROGRESS | robot:reena
`;

  const state = buildState(eventLog);

  // Query by robot
  const ashokWork = queryState(state, { robot: 'ashok' });
  assert(ashokWork.length === 2, 'Ashok should have 2 stories');

  // Query by status
  const inProgress = queryState(state, { status: 'IN_PROGRESS' });
  assert(inProgress.length === 2, 'Should have 2 in-progress stories');

  console.log('  ✅ PASS');
}

async function test_endToEnd() {
  console.log('TEST: End-to-End Workflow');

  // Create test event log
  const events = [
    {
      timestamp: '2025-12-03T10:00:00Z',
      type: 'PHASE',
      id: 'PHASE-2',
      attributes: { status: 'IN_PROGRESS', robot: 'talib', phase: 2, description: 'Analysis phase' }
    },
    {
      timestamp: '2025-12-03T10:05:00Z',
      type: 'FEATURE',
      id: 'FEAT-001',
      attributes: { status: 'IN_PROGRESS', robot: 'talib', epic: 'EPIC-001', phase: 2, title: 'User Authentication', priority: 'HIGH' }
    },
    {
      timestamp: '2025-12-03T10:10:00Z',
      type: 'STORY',
      id: 'STORY-001-001-1-db',
      attributes: { status: 'PENDING', robot: 'talib', feature: 'FEAT-001', title: 'User table', estimate: '2h' }
    },
    {
      timestamp: '2025-12-03T11:00:00Z',
      type: 'STORY',
      id: 'STORY-001-001-1-db',
      attributes: { status: 'IN_PROGRESS', robot: 'ashok', started: '2025-12-03T11:00:00Z' }
    },
    {
      timestamp: '2025-12-03T13:00:00Z',
      type: 'STORY',
      id: 'STORY-001-001-1-db',
      attributes: { status: 'COMPLETED', robot: 'ashok', completed: '2025-12-03T13:00:00Z' }
    }
  ];

  // Write event log
  const lines = events.map(e => formatEventLine(e));
  await fs.writeFile(TEST_LOG, lines.join('\n'));

  // Read and parse
  const content = await fs.readFile(TEST_LOG, 'utf8');
  const state = buildState(content);

  // Verify state
  assert(state.phases['PHASE-2'].status === 'IN_PROGRESS', 'Phase should be IN_PROGRESS');
  assert(state.features['FEAT-001'].status === 'IN_PROGRESS', 'Feature should be IN_PROGRESS');
  assert(state.stories['STORY-001-001-1-db'].status === 'COMPLETED', 'Story should be COMPLETED');
  assert(state.stories['STORY-001-001-1-db'].started === '2025-12-03T11:00:00Z', 'Should have started timestamp');
  assert(state.stories['STORY-001-001-1-db'].completed === '2025-12-03T13:00:00Z', 'Should have completed timestamp');

  // Check history
  const history = getHistory(content, 'STORY-001-001-1-db');
  assert(history.length === 3, 'Should have 3 events in history');
  assert(history[0].status === 'PENDING', 'First should be PENDING');
  assert(history[2].status === 'COMPLETED', 'Last should be COMPLETED');

  console.log('  ✅ PASS');
}

async function runTests() {
  console.log('\n🧪 ROME Activity Log File - Test Suite\n');

  await setup();

  try {
    await test_parseEventLine();
    await test_formatEventLine();
    await test_validateEvent();
    await test_buildState();
    await test_getHistory();
    await test_queryState();
    await test_endToEnd();

    console.log('\n✅ All tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

runTests();
