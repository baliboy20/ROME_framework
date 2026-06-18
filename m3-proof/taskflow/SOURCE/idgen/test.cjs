const { makeId, isId } = require('./index.js');

function assert(cond, msg) {
  if (!cond) {
    console.log('FAIL: ' + msg);
    process.exit(1);
  }
}

assert(makeId('proj') === 'proj-1', "makeId('proj') should be proj-1");
assert(makeId('proj') === 'proj-2', "makeId('proj') should be proj-2");
assert(isId('proj-7', 'proj') === true, "isId('proj-7','proj') should be true");
assert(isId('x', 'proj') === false, "isId('x','proj') should be false");

console.log('ok');
