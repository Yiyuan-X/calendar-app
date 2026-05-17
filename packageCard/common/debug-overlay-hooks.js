const state = {
  enabled: false,
  layoutBox: false,
  glyphBounds: false,
  baseline: false,
  selectionRect: false,
  transformOrigin: false
};

function configure(options) {
  Object.assign(state, options || {});
  state.enabled = !!state.enabled;
}

function isEnabled(flag) {
  return !!state.enabled && !!state[flag];
}

function drawRect(ctx, rect, color) {
  if (!ctx || !rect) return;
  ctx.save();
  ctx.strokeStyle = color || 'rgba(255,0,0,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

function drawLine(ctx, x1, y1, x2, y2, color) {
  if (!ctx) return;
  ctx.save();
  ctx.strokeStyle = color || 'rgba(0,128,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawPoint(ctx, x, y, color) {
  if (!ctx) return;
  ctx.save();
  ctx.fillStyle = color || 'rgba(255,0,255,0.8)';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getState() {
  return Object.assign({}, state);
}

module.exports = {
  configure,
  isEnabled,
  getState,
  drawRect,
  drawLine,
  drawPoint
};
