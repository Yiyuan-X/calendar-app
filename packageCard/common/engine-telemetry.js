const state = {
  enabled: false,
  layoutCost: [],
  renderCost: [],
  exportCost: [],
  glyphDrawCount: 0,
  lastRenderCost: 0,
  lastLayoutCost: 0,
  lastExportCost: 0
};

function now() {
  return Date.now();
}

function setEnabled(enabled) {
  state.enabled = !!enabled;
}

function start() {
  return now();
}

function recordCost(type, startedAt) {
  if (!state.enabled) return 0;
  const cost = Math.max(now() - Number(startedAt || now()), 0);
  const bucket = type === 'export' ? state.exportCost : (type === 'render' ? state.renderCost : state.layoutCost);
  bucket.push(cost);
  if (bucket.length > 120) bucket.shift();
  if (type === 'export') state.lastExportCost = cost;
  else if (type === 'render') state.lastRenderCost = cost;
  else state.lastLayoutCost = cost;
  return cost;
}

function addGlyphDrawCount(count) {
  if (!state.enabled) return;
  state.glyphDrawCount += Math.max(Number(count || 0), 0);
}

function average(list) {
  if (!list.length) return 0;
  return list.reduce((sum, item) => sum + item, 0) / list.length;
}

function snapshot(cacheStats) {
  return {
    enabled: state.enabled,
    lastLayoutCost: state.lastLayoutCost,
    avgLayoutCost: average(state.layoutCost),
    lastRenderCost: state.lastRenderCost,
    avgRenderCost: average(state.renderCost),
    lastExportCost: state.lastExportCost,
    avgExportCost: average(state.exportCost),
    glyphDrawCount: state.glyphDrawCount,
    cacheStats: cacheStats || []
  };
}

module.exports = {
  setEnabled,
  start,
  recordCost,
  addGlyphDrawCount,
  snapshot
};
