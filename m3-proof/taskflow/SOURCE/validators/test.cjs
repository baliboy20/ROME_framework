'use strict';

const { isNonEmpty, isValidStatus } = require('./index.js');

function check(cond, msg) {
  if (!cond) {
    console.log('FAIL: ' + msg);
    process.exit(1);
  }
}

check(isNonEmpty('x') === true, "isNonEmpty('x') should be true");
check(isNonEmpty('  ') === false, "isNonEmpty('  ') should be false");
check(isValidStatus('Backlog') === true, "isValidStatus('Backlog') should be true");
check(isValidStatus('Nope') === false, "isValidStatus('Nope') should be false");

console.log('ok');
