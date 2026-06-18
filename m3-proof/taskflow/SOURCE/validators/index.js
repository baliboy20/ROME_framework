'use strict';

const VALID_STATUSES = ['Backlog', 'Todo', 'InProgress', 'Review', 'Done'];

function isNonEmpty(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

function isValidStatus(s) {
  return VALID_STATUSES.includes(s);
}

module.exports = { isNonEmpty, isValidStatus };
