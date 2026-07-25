/**
 * ROME Activity Log - Query Engine
 * Provides convenience functions for querying activity state
 */

import { queryState } from './state-builder.js';

/**
 * Find entries by status
 * @param {Object} state - Current state
 * @param {string} status - Status value (e.g., "IN_PROGRESS", "BLOCKED")
 * @returns {Array<Object>} Matching entries
 */
export function findByStatus(state, status) {
  return queryState(state, { status });
}

/**
 * Find entries by robot
 * @param {Object} state - Current state
 * @param {string} robot - Robot identifier (e.g., "ashok", "reena")
 * @returns {Array<Object>} Matching entries
 */
export function findByRobot(state, robot) {
  return queryState(state, { robot });
}

/**
 * Find entries by phase
 * @param {Object} state - Current state
 * @param {number|string} phase - Phase number
 * @returns {Array<Object>} Matching entries
 */
export function findByPhase(state, phase) {
  return queryState(state, { phase: Number(phase) });
}

/**
 * Find entry by ID
 * @param {Object} state - Current state
 * @param {string} id - Entry ID
 * @returns {Object|null} Entry or null if not found
 */
export function findById(state, id) {
  const entry = state.phases[id] ||
                state.features[id] ||
                state.stories[id] ||
                state.blockers[id] ||
                state.amendments[id];

  return entry ? { id, ...entry } : null;
}

/**
 * Get all open blockers
 * @param {Object} state - Current state
 * @returns {Array<Object>} Open blockers
 */
export function getOpenBlockers(state) {
  return findByStatus(state, 'OPEN');
}

/**
 * Get all blocked items (stories/features with status BLOCKED)
 * @param {Object} state - Current state
 * @returns {Array<Object>} Blocked entries
 */
export function getBlockedItems(state) {
  return findByStatus(state, 'BLOCKED');
}

/**
 * Get all in-progress items
 * @param {Object} state - Current state
 * @returns {Array<Object>} In-progress entries
 */
export function getInProgress(state) {
  return findByStatus(state, 'IN_PROGRESS');
}

/**
 * Get robot statistics
 * @param {Object} state - Current state
 * @param {string} robot - Robot identifier
 * @returns {Object} Statistics for robot
 */
export function getRobotStats(state, robot) {
  const entries = findByRobot(state, robot);

  const stats = {
    robot,
    total: entries.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0
  };

  for (const entry of entries) {
    switch (entry.status) {
      case 'PENDING': stats.pending++; break;
      case 'IN_PROGRESS': stats.in_progress++; break;
      case 'COMPLETED': stats.completed++; break;
      case 'BLOCKED': stats.blocked++; break;
    }
  }

  return stats;
}

/**
 * Get stale in-progress items (no update in > 24 hours)
 * @param {Object} state - Current state
 * @returns {Array<Object>} Stale entries with age in hours
 */
export function getStaleItems(state) {
  const inProgress = getInProgress(state);
  const now = new Date();
  const stale = [];

  for (const entry of inProgress) {
    if (!entry.last_update) continue;

    const lastUpdate = new Date(entry.last_update);
    const ageMs = now - lastUpdate;
    const ageHours = ageMs / (1000 * 60 * 60);

    if (ageHours > 24) {
      stale.push({
        ...entry,
        age_hours: Math.floor(ageHours)
      });
    }
  }

  return stale;
}

/**
 * Get phase status
 * @param {Object} state - Current state
 * @param {number} phaseNumber - Phase number (0-5)
 * @returns {Object|null} Phase entry or null if not found
 */
export function getPhaseStatus(state, phaseNumber) {
  const phaseId = `PHASE-${phaseNumber}`;
  return findById(state, phaseId);
}

/**
 * Get current active phase
 * @param {Object} state - Current state
 * @returns {Object|null} Phase entry with status IN_PROGRESS, or null
 */
export function getCurrentPhase(state) {
  for (const [id, phase] of Object.entries(state.phases)) {
    if (phase.status === 'IN_PROGRESS') {
      return { id, ...phase };
    }
  }
  return null;
}

/**
 * Get feature progress
 * @param {Object} state - Current state
 * @param {string} featureId - Feature ID
 * @returns {Object} Progress statistics for feature
 */
export function getFeatureProgress(state, featureId) {
  const feature = state.features[featureId];
  if (!feature) {
    return null;
  }

  // Find all stories for this feature
  const stories = Object.entries(state.stories)
    .filter(([id, story]) => story.feature === featureId)
    .map(([id, story]) => ({ id, ...story }));

  const progress = {
    feature_id: featureId,
    feature_title: feature.title,
    total_stories: stories.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0,
    completion_percentage: 0
  };

  for (const story of stories) {
    switch (story.status) {
      case 'PENDING': progress.pending++; break;
      case 'IN_PROGRESS': progress.in_progress++; break;
      case 'COMPLETED': progress.completed++; break;
      case 'BLOCKED': progress.blocked++; break;
    }
  }

  if (progress.total_stories > 0) {
    progress.completion_percentage = Math.round(
      (progress.completed / progress.total_stories) * 100
    );
  }

  return progress;
}
