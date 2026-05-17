const stores = {};
let globalVersion = 0;

function createCache(name, options) {
  const maxSize = Math.max(Number(options && options.maxSize) || 128, 1);
  const store = {
    name,
    maxSize,
    version: globalVersion,
    map: new Map(),
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0
  };
  stores[name] = store;
  return store;
}

function getStore(name, options) {
  return stores[name] || createCache(name, options);
}

function get(name, key, options) {
  const store = getStore(name, options);
  const fullKey = `${store.version}|${key}`;
  if (!store.map.has(fullKey)) {
    store.misses += 1;
    return undefined;
  }
  const value = store.map.get(fullKey);
  store.map.delete(fullKey);
  store.map.set(fullKey, value);
  store.hits += 1;
  return value;
}

function set(name, key, value, options) {
  const store = getStore(name, options);
  const fullKey = `${store.version}|${key}`;
  if (store.map.has(fullKey)) store.map.delete(fullKey);
  store.map.set(fullKey, value);
  store.sets += 1;
  cleanup(name);
  return value;
}

function cleanup(name) {
  const store = stores[name];
  if (!store) return;
  while (store.map.size > store.maxSize) {
    const oldest = store.map.keys().next().value;
    store.map.delete(oldest);
    store.evictions += 1;
  }
}

function clear(name) {
  const store = stores[name];
  if (!store) return;
  store.map.clear();
}

function invalidate(name) {
  const store = stores[name];
  if (!store) return;
  store.version += 1;
  store.map.clear();
}

function invalidateAll() {
  globalVersion += 1;
  Object.keys(stores).forEach(name => {
    stores[name].version = globalVersion;
    stores[name].map.clear();
  });
}

function stats(name) {
  const store = stores[name];
  if (!store) return null;
  const total = store.hits + store.misses;
  return {
    name: store.name,
    size: store.map.size,
    maxSize: store.maxSize,
    version: store.version,
    hits: store.hits,
    misses: store.misses,
    hitRate: total ? store.hits / total : 0,
    sets: store.sets,
    evictions: store.evictions
  };
}

function allStats() {
  return Object.keys(stores).map(stats);
}

module.exports = {
  createCache,
  get,
  set,
  clear,
  invalidate,
  invalidateAll,
  cleanup,
  stats,
  allStats
};
