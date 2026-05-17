const cacheManager = require('./cache-manager');

const FONT_METRICS_CACHE = 'font-metrics';
cacheManager.createCache(FONT_METRICS_CACHE, { maxSize: 256 });

function getFontSize(style) {
  return parseInt((style && (style.size || style.fontSize)) || 30, 10) || 30;
}

function getCacheKey(ctx, style, sample) {
  return [ctx && ctx.font || '', getFontSize(style), sample || 'Mg'].join('|');
}

function fallbackMetrics(style) {
  const fontSize = getFontSize(style);
  const ascent = fontSize * 0.82;
  const descent = fontSize * 0.22;
  return {
    ascent,
    descent,
    baseline: ascent,
    capHeight: fontSize * 0.7,
    xHeight: fontSize * 0.52,
    height: ascent + descent,
    fallback: true
  };
}

function measureFontMetrics(ctx, style, sample) {
  const key = getCacheKey(ctx, style, sample);
  const cached = cacheManager.get(FONT_METRICS_CACHE, key, { maxSize: 256 });
  if (cached) return cached;
  const fallback = fallbackMetrics(style);
  let result = fallback;
  try {
    const measured = ctx && ctx.measureText ? ctx.measureText(sample || 'Mg') : null;
    const ascent = measured && Number(measured.actualBoundingBoxAscent);
    const descent = measured && Number(measured.actualBoundingBoxDescent);
    if (isFinite(ascent) && ascent > 0 && isFinite(descent) && descent >= 0) {
      result = {
        ascent,
        descent,
        baseline: ascent,
        capHeight: ascent * 0.86,
        xHeight: ascent * 0.62,
        height: ascent + descent,
        fallback: false
      };
    }
  } catch (e) {}
  return cacheManager.set(FONT_METRICS_CACHE, key, result, { maxSize: 256 });
}

function getRunMetrics(ctx, style, text) {
  return measureFontMetrics(ctx, style, text || 'Mg');
}

function getLineMetrics(ctx, runs, lineHeight) {
  let ascent = 0;
  let descent = 0;
  (runs || []).forEach(run => {
    const metrics = getRunMetrics(ctx, run.style || {}, run.text || 'Mg');
    ascent = Math.max(ascent, metrics.ascent);
    descent = Math.max(descent, metrics.descent);
  });
  const naturalHeight = ascent + descent;
  const targetHeight = Math.max(Number(lineHeight || 0), naturalHeight || 0);
  const extra = Math.max(targetHeight - naturalHeight, 0);
  return {
    ascent,
    descent,
    baselineY: extra / 2 + ascent,
    height: targetHeight,
    naturalHeight
  };
}

function clearCache() {
  cacheManager.clear(FONT_METRICS_CACHE);
}

module.exports = {
  measureFontMetrics,
  getRunMetrics,
  getLineMetrics,
  clearCache
};
