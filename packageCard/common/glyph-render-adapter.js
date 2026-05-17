function getRunGlyphMetrics(run) {
  const glyphs = Array.isArray(run && run.glyphs) ? run.glyphs : [];
  if (!glyphs.length) {
    return {
      glyphs: [],
      width: Number((run && run.width) || 0),
      canDrawGlyphs: false
    };
  }
  const first = glyphs[0];
  const last = glyphs[glyphs.length - 1];
  return {
    glyphs,
    width: Number(last.x || 0) + Number(last.advance || last.width || 0) - Number(first.x || 0),
    canDrawGlyphs: true
  };
}

function drawGlyphs(ctx, run, originX, baselineY, options) {
  const metrics = getRunGlyphMetrics(run);
  if (!metrics.canDrawGlyphs) return false;
  const boldOffset = Number((options && options.boldOffset) || 0);
  const baselineOffset = Number((options && options.baselineOffset) || 0);
  metrics.glyphs.forEach(glyph => {
    const glyphX = originX + Number(glyph.x || 0) - Number(metrics.glyphs[0].x || 0);
    ctx.fillText(glyph.grapheme || glyph.text || '', glyphX, baselineY + baselineOffset);
    if (boldOffset > 0) {
      ctx.fillText(glyph.grapheme || glyph.text || '', glyphX + boldOffset, baselineY + baselineOffset);
    }
  });
  telemetry.addGlyphDrawCount(metrics.glyphs.length * (boldOffset > 0 ? 2 : 1));
  return true;
}

function strokeGlyphs(ctx, run, originX, baselineY, options) {
  const metrics = getRunGlyphMetrics(run);
  if (!metrics.canDrawGlyphs) return false;
  const baselineOffset = Number((options && options.baselineOffset) || 0);
  metrics.glyphs.forEach(glyph => {
    const glyphX = originX + Number(glyph.x || 0) - Number(metrics.glyphs[0].x || 0);
    ctx.strokeText(glyph.grapheme || glyph.text || '', glyphX, baselineY + baselineOffset);
  });
  telemetry.addGlyphDrawCount(metrics.glyphs.length);
  return true;
}

module.exports = {
  getRunGlyphMetrics,
  drawGlyphs,
  strokeGlyphs
};
const telemetry = require('./engine-telemetry');
