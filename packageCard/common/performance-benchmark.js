const telemetry = require('./engine-telemetry');
const cacheManager = require('./cache-manager');

function createBenchmark() {
  const marks = {};
  return {
    start(name) {
      marks[name] = Date.now();
    },
    end(name) {
      const startedAt = marks[name] || Date.now();
      const cost = Math.max(Date.now() - startedAt, 0);
      delete marks[name];
      return cost;
    },
    snapshot(extra) {
      return Object.assign({}, telemetry.snapshot(cacheManager.allStats()), extra || {});
    }
  };
}

module.exports = {
  createBenchmark
};
