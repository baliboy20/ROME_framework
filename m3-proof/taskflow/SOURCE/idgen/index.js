let counter = 0;

function makeId(prefix) {
  counter += 1;
  return prefix + '-' + counter;
}

function isId(s, prefix) {
  return new RegExp('^' + prefix + '-\\d+$').test(s);
}

module.exports = { makeId, isId };
