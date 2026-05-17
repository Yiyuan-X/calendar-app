const graphemeUtils = require('./grapheme-utils');
const cacheManager = require('./cache-manager');

const PROHIBIT_LINE_START = /[，。；：！？、》』】）…~\-–—]/;
const ATTACH_TO_PREVIOUS = /^[，。；：！？、》〉」』】）\]\}'’”",.!?:;%…~\-–—]+$/;
const ATTACH_TO_NEXT = /^[《〈「『【（\[\{‘“"']+$/;
const WORD_RE = /[A-Za-z0-9]+(?:[A-Za-z0-9_'’.\-:/@#%&+=]*[A-Za-z0-9])?[\)\]\}",.!?:;，。！？；：、]*/g;
const GLYPH_METRICS_CACHE = 'renderer:glyph-metrics';
cacheManager.createCache(GLYPH_METRICS_CACHE, { maxSize: 1024 });

function pickFont(style, design) {
  const family = style.fontFamily || (design && design.fontFamily) || 'PingFang SC';
  const weight = style.bold ? 'bold' : (style.fontWeight || 'normal');
  const size = parseInt(style.size || style.fontSize || 30, 10) || 30;
  const italic = style.italic ? 'italic ' : '';
  const fontFamily = family.indexOf(',') >= 0 ? family : `"${family}", sans-serif`;
  return `${italic}${weight} ${size}px ${fontFamily}`;
}

function normalizeOps(delta) {
  if (!delta || !delta.ops || !delta.ops.length) return [{ insert: '', attributes: {} }];
  return delta.ops.map(op => ({
    insert: String(op.insert || ''),
    attributes: op.attributes || {}
  }));
}

function splitTextForLineWrap(text) {
  const value = String(text || '');
  if (!value) return [];
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
      const tokens = [];
      Array.from(segmenter.segment(value)).forEach(part => {
        const segment = part.segment || '';
        if (!segment) return;
        if (part.isWordLike) {
          tokens.push(segment);
        } else {
          graphemeUtils.splitGraphemes(segment).forEach(item => {
            if (item) tokens.push(item);
          });
        }
      });
      return mergePunctuationTokens(tokens);
    }
  } catch (e) {}

  const tokens = [];
  let index = 0;
  let match;
  WORD_RE.lastIndex = 0;
  while ((match = WORD_RE.exec(value)) !== null) {
    if (match.index > index) {
      graphemeUtils.splitGraphemes(value.slice(index, match.index)).forEach(item => {
        if (item) tokens.push(item);
      });
    }
    tokens.push(match[0]);
    index = match.index + match[0].length;
  }
  if (index < value.length) {
    graphemeUtils.splitGraphemes(value.slice(index)).forEach(item => {
      if (item) tokens.push(item);
    });
  }
  return mergePunctuationTokens(tokens);
}

function mergePunctuationTokens(tokens) {
  const source = (tokens || []).filter(Boolean);
  const merged = [];
  for (let i = 0; i < source.length; i++) {
    const token = source[i];
    if (ATTACH_TO_PREVIOUS.test(token) && merged.length) {
      merged[merged.length - 1] += token;
      continue;
    }
    if (ATTACH_TO_NEXT.test(token) && i + 1 < source.length) {
      source[i + 1] = token + source[i + 1];
      continue;
    }
    merged.push(token);
  }
  return merged;
}

function splitRuns(delta, block) {
  const runs = [];
  normalizeOps(delta).forEach(op => {
    String(op.insert || '').split(/(\n)/).forEach(part => {
      if (!part) return;
      runs.push({
        text: part,
        style: Object.assign({ fontFamily: block.fontFamily, fontUrl: block.fontUrl }, op.attributes || {}),
        newline: part === '\n'
      });
    });
  });
  return runs;
}

function measureToken(ctx, token, style, block, design) {
  const text = String(token || '');
  const graphemes = graphemeUtils.splitGraphemes(text);
  const letterSpacing = Math.max(Number(style.letterSpacing || block.letterSpacing || 0), 0);
  ctx.font = pickFont(style, design);
  return graphemes.reduce((sum, grapheme) => sum + measureGlyph(ctx, grapheme, style, block, design).width + letterSpacing, 0);
}

function measureGlyph(ctx, grapheme, style, block, design) {
  ctx.font = pickFont(style, design);
  const key = [ctx.font || '', Number(style.letterSpacing || block.letterSpacing || 0), grapheme].join('|');
  const cached = cacheManager.get(GLYPH_METRICS_CACHE, key, { maxSize: 1024 });
  if (cached) return cached;
  return cacheManager.set(GLYPH_METRICS_CACHE, key, {
    width: ctx.measureText(grapheme).width
  }, { maxSize: 1024 });
}

function getLineHeight(line, block) {
  const lineHeightVal = Number(block.lineHeight || 1.6);
  let height = 0;
  line.runs.forEach(run => {
    const style = run.style || {};
    const size = parseInt(style.size || style.fontSize || 30, 10) || 30;
    height = Math.max(height, size * lineHeightVal);
  });
  return height || 30 * lineHeightVal;
}

function buildGlyphsForRun(ctx, run, lineIndex, startX, y, block, design) {
  const glyphs = [];
  let x = startX;
  const style = run.style || {};
  const letterSpacing = Math.max(Number(style.letterSpacing || block.letterSpacing || 0), 0);
  ctx.font = pickFont(style, design);
  graphemeUtils.splitGraphemes(run.text).forEach(grapheme => {
    const glyphWidth = measureGlyph(ctx, grapheme, style, block, design).width;
    const advance = glyphWidth + letterSpacing;
    glyphs.push({
      grapheme,
      text: grapheme,
      line: lineIndex,
      x,
      y,
      width: glyphWidth,
      advance,
      style
    });
    x += advance;
  });
  return glyphs;
}

function layoutHorizontalText(ctx, block, design) {
  const maxWidth = Number(block.width || 500);
  const runs = splitRuns(block.delta, block);
  const lines = [];
  let line = [];
  let width = 0;

  function flush() {
    lines.push({ runs: line, width });
    line = [];
    width = 0;
  }

  runs.forEach(run => {
    if (run.newline) {
      flush();
      return;
    }
    splitTextForLineWrap(run.text || '').forEach(token => {
      const style = run.style || {};
      const tokenWidth = measureToken(ctx, token, style, block, design);
      const item = { text: token, style, width: tokenWidth, glyphs: [] };
      if (width + tokenWidth > maxWidth && line.length) {
        if (PROHIBIT_LINE_START.test(token)) {
          line.push(item);
          width += tokenWidth;
          flush();
        } else {
          flush();
          line.push(item);
          width += tokenWidth;
        }
      } else {
        line.push(item);
        width += tokenWidth;
      }
    });
  });

  if (line.length || !lines.length) flush();

  const lineHeights = lines.map(lineItem => getLineHeight(lineItem, block));
  const contentHeight = lineHeights.reduce((sum, item) => sum + item, 0);
  const glyphs = [];
  let y = 0;
  lines.forEach((lineItem, lineIndex) => {
    let x = 0;
    lineItem.runs.forEach(run => {
      run.glyphs = buildGlyphsForRun(ctx, run, lineIndex, x, y, block, design);
      glyphs.push.apply(glyphs, run.glyphs);
      x += Number(run.width || 0);
    });
    y += lineHeights[lineIndex];
  });

  return {
    lines,
    lineHeights,
    contentHeight,
    glyphs
  };
}

module.exports = {
  layoutHorizontalText,
  splitTextForLineWrap,
  measureToken
};
