// Mock for p-queue module
class PQueue {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 1;
    this.pending = 0;
    this.size = 0;
    this.isPaused = false;
    this._tasks = [];
  }

  add(fn, options = {}) {
    if (typeof fn === 'function') {
      return fn();
    }
    return Promise.resolve();
  }

  addAll(fns, options = {}) {
    return Promise.all(fns.map(fn => this.add(fn, options)));
  }

  pause() {
    this.isPaused = true;
  }

  start() {
    this.isPaused = false;
  }

  clear() {
    this.size = 0;
    this._tasks = [];
  }

  onEmpty() {
    return Promise.resolve();
  }

  onIdle() {
    return Promise.resolve();
  }
}

module.exports = PQueue;
module.exports.default = PQueue;