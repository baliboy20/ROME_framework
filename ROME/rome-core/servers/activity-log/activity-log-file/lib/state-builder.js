/**
 * ROME Activity Log - State Builder
 * Reconstructs current state from event log
 */

import { parseEventLog } from './event-parser.js';

/**
 * Build current state from event log content
 * @param {string} eventLogContent - Full content of activity-log.txt
 * @returns {Object} Current state with phases, features, stories, blockers, amendments, indexes
 */
export function buildState(eventLogContent) {
  const events = parseEventLog(eventLogContent);

  // Group events by ID
  const eventsByID = {};
  for (const event of events) {
    if (!eventsByID[event.id]) {
      eventsByID[event.id] = [];
    }
    eventsByID[event.id].push(event);
  }

  // Build current state (latest event per ID)
  const state = {
    metadata: {
      generated: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      event_count: events.length,
      last_event: events.length > 0 ? events[events.length - 1].timestamp : null
    },
    phases: {},
    features: {},
    stories: {},
    blockers: {},
    amendments: {},
    by_robot: {},
    by_status: {},
    by_phase: {},
    statistics: {
      total_features: 0,
      total_stories: 0,
      completed_stories: 0,
      open_blockers: 0,
      resolved_blockers: 0
    }
  };

  // Process each ID's events (latest wins)
  for (const [id, idEvents] of Object.entries(eventsByID)) {
    // Sort by timestamp
    idEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Get latest event
    const latest = idEvents[idEvents.length - 1];
    const entry = buildEntry(latest, idEvents);

    // Add to appropriate category
    switch (latest.type) {
      case 'PHASE':
        state.phases[id] = entry;
        break;
      case 'FEATURE':
        state.features[id] = entry;
        state.statistics.total_features++;
        break;
      case 'STORY':
        state.stories[id] = entry;
        state.statistics.total_stories++;
        if (entry.status === 'COMPLETED') {
          state.statistics.completed_stories++;
        }
        break;
      case 'BLOCKER':
        state.blockers[id] = entry;
        if (entry.status === 'OPEN') {
          state.statistics.open_blockers++;
        } else if (entry.status === 'RESOLVED') {
          state.statistics.resolved_blockers++;
        }
        break;
      case 'AMENDMENT':
        state.amendments[id] = entry;
        break;
    }

    // Build indexes
    buildIndexes(state, id, entry);
  }

  return state;
}

/**
 * Build entry from latest event and history
 * @param {Object} latestEvent - Latest event for this ID
 * @param {Array<Object>} history - All events for this ID
 * @returns {Object} Entry for state
 */
function buildEntry(latestEvent, history) {
  const entry = {
    ...latestEvent.attributes
  };

  // Add metadata from first and last events
  if (history.length > 0) {
    entry.created = history[0].timestamp;
    entry.last_update = latestEvent.timestamp;
  }

  // Type-specific processing
  switch (latestEvent.type) {
    case 'PHASE':
      // Find start and end timestamps from history
      for (const event of history) {
        if (event.attributes.start) {
          entry.start = event.attributes.start;
        }
        if (event.attributes.end) {
          entry.end = event.attributes.end;
        }
      }
      break;

    case 'STORY':
      // Find started and completed timestamps from history
      for (const event of history) {
        if (event.attributes.started) {
          entry.started = event.attributes.started;
        }
        if (event.attributes.completed) {
          entry.completed = event.attributes.completed;
        }
      }
      break;

    case 'BLOCKER':
      // Find created and resolved timestamps
      for (const event of history) {
        if (event.attributes.created) {
          entry.created = event.attributes.created;
        }
        if (event.attributes.resolved) {
          entry.resolved = event.attributes.resolved;
        }
      }
      break;
  }

  return entry;
}

/**
 * Build query indexes
 * @param {Object} state - State object to update
 * @param {string} id - Entry ID
 * @param {Object} entry - Entry object
 */
function buildIndexes(state, id, entry) {
  // Index by robot
  const robot = entry.robot;
  if (robot) {
    if (!state.by_robot[robot]) {
      state.by_robot[robot] = [];
    }
    state.by_robot[robot].push(id);
  }

  // Index by status
  const status = entry.status;
  if (status) {
    if (!state.by_status[status]) {
      state.by_status[status] = [];
    }
    state.by_status[status].push(id);
  }

  // Index by phase
  const phase = entry.phase;
  if (phase !== undefined) {
    const phaseKey = String(phase);
    if (!state.by_phase[phaseKey]) {
      state.by_phase[phaseKey] = [];
    }
    state.by_phase[phaseKey].push(id);
  }
}

/**
 * Get entry from state by ID
 * @param {Object} state - Current state
 * @param {string} id - Entry ID
 * @returns {Object|null} Entry or null if not found
 */
export function getEntry(state, id) {
  return state.phases[id] ||
         state.features[id] ||
         state.stories[id] ||
         state.blockers[id] ||
         state.amendments[id] ||
         null;
}

/**
 * Query state by filter
 * @param {Object} state - Current state
 * @param {Object} filter - Filter object {type, status, robot, phase}
 * @returns {Array<Object>} Matching entries
 */
export function queryState(state, filter = {}) {
  let results = [];

  // Determine which collections to search
  const collections = [];
  if (filter.type) {
    switch (filter.type.toUpperCase()) {
      case 'PHASE': collections.push(state.phases); break;
      case 'FEATURE': collections.push(state.features); break;
      case 'STORY': collections.push(state.stories); break;
      case 'BLOCKER': collections.push(state.blockers); break;
      case 'AMENDMENT': collections.push(state.amendments); break;
    }
  } else {
    // Search all collections
    collections.push(
      state.phases,
      state.features,
      state.stories,
      state.blockers,
      state.amendments
    );
  }

  // Use indexes when possible
  if (filter.status && !filter.robot && !filter.phase) {
    const ids = state.by_status[filter.status] || [];
    for (const id of ids) {
      const entry = getEntry(state, id);
      if (entry) {
        results.push({ id, ...entry });
      }
    }
    return results;
  }

  if (filter.robot && !filter.status && !filter.phase) {
    const ids = state.by_robot[filter.robot] || [];
    for (const id of ids) {
      const entry = getEntry(state, id);
      if (entry) {
        results.push({ id, ...entry });
      }
    }
    return results;
  }

  if (filter.phase !== undefined && !filter.status && !filter.robot) {
    const ids = state.by_phase[String(filter.phase)] || [];
    for (const id of ids) {
      const entry = getEntry(state, id);
      if (entry) {
        results.push({ id, ...entry });
      }
    }
    return results;
  }

  // Fallback: scan all collections
  for (const collection of collections) {
    for (const [id, entry] of Object.entries(collection)) {
      let matches = true;

      if (filter.status && entry.status !== filter.status) {
        matches = false;
      }
      if (filter.robot && entry.robot !== filter.robot) {
        matches = false;
      }
      if (filter.phase !== undefined && entry.phase !== filter.phase) {
        matches = false;
      }

      if (matches) {
        results.push({ id, ...entry });
      }
    }
  }

  return results;
}

/**
 * Get history of events for an entry
 * @param {string} eventLogContent - Full event log content
 * @param {string} id - Entry ID
 * @returns {Array<Object>} Events for this ID in chronological order
 */
export function getHistory(eventLogContent, id) {
  const events = parseEventLog(eventLogContent);
  const history = events.filter(e => e.id === id);
  history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return history.map(event => ({
    timestamp: event.timestamp,
    ...event.attributes
  }));
}
