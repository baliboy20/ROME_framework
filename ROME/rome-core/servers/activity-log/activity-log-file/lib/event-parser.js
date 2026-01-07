/**
 * ROME Activity Log - Event Parser
 * Parses event log lines into structured objects
 */

/**
 * Parse a single event line
 * @param {string} line - Event line from activity-log.txt
 * @returns {Object|null} Parsed event or null if invalid
 */
export function parseEventLine(line) {
  // Skip comments and blank lines
  if (!line || line.trim().startsWith('#') || line.trim() === '') {
    return null;
  }

  try {
    // Split on " | " (space-pipe-space)
    const parts = line.split(' | ');

    if (parts.length < 3) {
      console.warn(`Malformed event line (insufficient parts): ${line}`);
      return null;
    }

    const timestamp = parts[0].trim();
    const type = parts[1].trim();
    const id = parts[2].trim();

    // Validate timestamp (ISO 8601 UTC)
    if (!isValidTimestamp(timestamp)) {
      console.warn(`Invalid timestamp: ${timestamp}`);
      return null;
    }

    // Validate type
    const validTypes = ['PHASE', 'FEATURE', 'STORY', 'BLOCKER', 'AMENDMENT'];
    if (!validTypes.includes(type)) {
      console.warn(`Invalid type: ${type}`);
      return null;
    }

    // Validate ID exists
    if (!id) {
      console.warn(`Missing ID in line: ${line}`);
      return null;
    }

    // Parse attributes (parts[3] onwards)
    const attributes = {};
    for (let i = 3; i < parts.length; i++) {
      const attr = parts[i].trim();
      if (!attr) continue;

      const colonIndex = attr.indexOf(':');
      if (colonIndex === -1) {
        console.warn(`Malformed attribute (no colon): ${attr}`);
        continue;
      }

      const key = attr.substring(0, colonIndex).trim();
      let value = attr.substring(colonIndex + 1).trim();

      // Handle quoted strings
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      attributes[key] = value;
    }

    return {
      timestamp,
      type,
      id,
      attributes,
      raw: line
    };
  } catch (error) {
    console.error(`Error parsing line: ${line}`, error);
    return null;
  }
}

/**
 * Parse entire event log file
 * @param {string} content - Full content of activity-log.txt
 * @returns {Array<Object>} Array of parsed events
 */
export function parseEventLog(content) {
  const lines = content.split('\n');
  const events = [];

  for (const line of lines) {
    const event = parseEventLine(line);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Validate ISO 8601 UTC timestamp
 * @param {string} timestamp
 * @returns {boolean}
 */
function isValidTimestamp(timestamp) {
  // Pattern: YYYY-MM-DDTHH:MM:SSZ
  const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  if (!pattern.test(timestamp)) {
    return false;
  }

  // Verify it's a valid date
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

/**
 * Format event as log line
 * @param {Object} event - Event object with timestamp, type, id, attributes
 * @returns {string} Formatted event line
 */
export function formatEventLine(event) {
  const { timestamp, type, id, attributes } = event;

  // Build attribute parts
  const attrParts = [];
  for (const [key, value] of Object.entries(attributes)) {
    // Quote strings with spaces
    const formattedValue = typeof value === 'string' && value.includes(' ')
      ? `"${value}"`
      : value;
    attrParts.push(`${key}:${formattedValue}`);
  }

  // Join all parts with " | "
  const parts = [timestamp, type, id, ...attrParts];
  return parts.join(' | ');
}

/**
 * Generate current UTC timestamp
 * @returns {string} ISO 8601 UTC timestamp
 */
export function getCurrentTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Validate event structure
 * @param {Object} event - Event object
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
export function validateEvent(event) {
  const errors = [];

  if (!event.type) {
    errors.push('Missing type');
  }

  if (!event.id) {
    errors.push('Missing id');
  }

  if (!event.attributes) {
    errors.push('Missing attributes');
  }

  const validTypes = ['PHASE', 'FEATURE', 'STORY', 'BLOCKER', 'AMENDMENT'];
  if (event.type && !validTypes.includes(event.type)) {
    errors.push(`Invalid type: ${event.type}`);
  }

  // Check required attributes
  if (event.attributes) {
    if (!event.attributes.status) {
      errors.push('Missing required attribute: status');
    }
    if (!event.attributes.robot) {
      errors.push('Missing required attribute: robot');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
