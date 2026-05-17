/**
 * 统一文本排版引擎 (Unified Text Layout Engine)
 *
 * 解决三套排版系统（DOM/CSS、Canvas renderer、JS estimate）不一致的问题。
 * 提供统一的 measureText 缓存 + 字符 metrics + 行排版 + 块排版。
 *
 * 排版管线：
 *   measureTextCached() → getGlyphMetrics() → layoutLine() → layoutTextBlock()
 *        ↓                    ↓                    ↓                ↓
 *   缓存层             字符级 metrics         行级排版          块级排版（含 cache）
 */

var graphemeUtils = require('./grapheme-utils');
var cacheManager = require('./cache-manager');
var telemetry = require('./engine-telemetry');

// ============================================================
// Part 1: measureText 缓存层
// ============================================================

var MEASURE_CACHE = 'text-layout:measure';
var LAYOUT_CACHE = 'text-layout:layout';
cacheManager.createCache(MEASURE_CACHE, { maxSize: 512 });
cacheManager.createCache(LAYOUT_CACHE, { maxSize: 96 });

/** Canvas 2D 上下文缓存 */
var _cachedCtx = null;

/**
 * 获取用于 measureText 的 offscreen canvas context
 */
function _getMeasureContext() {
  if (_cachedCtx) return _cachedCtx;
  try {
    if (typeof wx !== 'undefined' && wx.createOffscreenCanvas) {
      var offscreen = wx.createOffscreenCanvas({ type: '2d', width: 1, height: 1 });
      _cachedCtx = offscreen.getContext('2d');
    }
  } catch (e) { /* ignore */ }
  return _cachedCtx;
}

/**
 * 设置外部 Canvas context（由 editor 在 canvas ready 时注入）
 */
function setMeasureContext(ctx) {
  if (ctx && ctx !== _cachedCtx) {
    _cachedCtx = ctx;
    clearAllCache();
  }
}

/**
 * 生成缓存 key：fontFamily|fontSize|fontWeight|letterSpacing|text
 */
function _measureCacheKey(fontFamily, fontSize, fontWeight, letterSpacing, text) {
  return [fontFamily || '', fontSize || 0, fontWeight || 'normal', letterSpacing || 0, text || ''].join('|');
}

/**
 * 缓存淘汰：超过上限时清空一半
 */
/**
 * 统一 measureText（带缓存）
 *
 * @param {string} text - 要测量的文本
 * @param {object} fontOpts - { fontFamily, fontSize, fontWeight, letterSpacing, bold, italic }
 * @returns {number} 文本宽度（rpx）
 */
function measureTextCached(text, fontOpts) {
  var opts = fontOpts || {};
  var fontFamily = opts.fontFamily || '';
  var fontSize = Number(opts.fontSize) || 30;
  var fontWeight = opts.bold ? 'bold' : (opts.fontWeight || 'normal');
  var letterSpacing = Number(opts.letterSpacing) || 0;

  var key = _measureCacheKey(fontFamily, fontSize, fontWeight, letterSpacing, text);
  var cached = cacheManager.get(MEASURE_CACHE, key, { maxSize: 512 });
  if (cached !== undefined) {
    return cached;
  }

  var width;
  var ctx = _getMeasureContext();
  if (ctx && ctx.measureText) {
    var family = fontFamily ? ('"' + fontFamily + '", sans-serif') : 'sans-serif';
    var italic = opts.italic ? 'italic ' : '';
    ctx.font = italic + fontWeight + ' ' + fontSize + 'px ' + family;
    var measured = ctx.measureText(text);
    width = (measured && measured.width != null) ? measured.width : null;
  }

  // measureText 不可用或异常值时回退到估算
  if (width == null || width <= 0 || !isFinite(width)) {
    width = _estimateTextWidth(text, fontSize, fontWeight, letterSpacing);
  } else {
    width += Math.max(letterSpacing, 0) * Math.max(text.length - 1, 0);
  }

  return cacheManager.set(MEASURE_CACHE, key, width, { maxSize: 512 });
}

/**
 * 清空 measureText 缓存
 */
function clearMeasureCache() {
  cacheManager.clear(MEASURE_CACHE);
}

// ============================================================
// 估算回退（当 ctx.measureText 不可用时）
// ============================================================

/**
 * 估算单字符宽度（与旧 estimateSelectionCharWidth 对齐，作为回退）
 */
function _estimateCharWidth(ch, fontSize) {
  if (!ch) return 0;
  if (/[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]/.test(ch)) return fontSize;
  if (/\s/.test(ch)) return fontSize * 0.34;
  if (/[ilI.,:;!|]/.test(ch)) return fontSize * 0.32;
  if (/[mwMW@#%&]/.test(ch)) return fontSize * 0.82;
  return fontSize * 0.58;
}

/**
 * 估算文本宽度（回退方案）
 */
function _estimateTextWidth(text, fontSize, fontWeight, letterSpacing) {
  var width = 0;
  var boldFactor = fontWeight === 'bold' ? 1.08 : 1;
  var graphemes = graphemeUtils.splitGraphemes(text);
  for (var i = 0; i < graphemes.length; i++) {
    width += _estimateCharWidth(graphemes[i], fontSize) * boldFactor;
  }
  width += Math.max(letterSpacing || 0, 0) * Math.max(graphemes.length - 1, 0);
  return width;
}

// ============================================================
// Part 2: 统一字符 metrics
// ============================================================

/**
 * 获取单个字符的 metrics
 *
 * @param {string} ch - 单个字符
 * @param {object} fontOpts - { fontFamily, fontSize, fontWeight, letterSpacing, bold, italic, lineHeight }
 * @returns {{ width: number, advance: number, lineHeight: number }}
 */
function getGlyphMetrics(ch, fontOpts) {
  var opts = fontOpts || {};
  var fontSize = Number(opts.fontSize) || 30;
  var letterSpacing = Number(opts.letterSpacing) || 0;
  var lineHeight = Number(opts.lineHeight) || 1.6;

  var width = measureTextCached(ch, opts);
  var advance = width + Math.max(letterSpacing, 0);

  return {
    width: width,
    advance: advance,
    lineHeight: fontSize * lineHeight
  };
}

// ============================================================
// Part 3: 统一 layoutLine() — 行级排版
// ============================================================

/**
 * 与 renderer 的 splitTextForLineWrap 对齐的 token 拆分
 * 将文本拆分为不可断词组（英文单词 + 标点）和单字符（中文、符号）
 *
 * @param {string} text
 * @returns {string[]}
 */
function splitTextForLineWrap(text) {
  var value = String(text || '');
  var tokens = [];
  var wordRe = /[A-Za-z0-9]+(?:[A-Za-z0-9_''.\-:/@#%&+=]*[A-Za-z0-9])?[\)\]\}",.!?:;，。！？；：、]*/g;
  var index = 0;
  var match;
  while ((match = wordRe.exec(value)) !== null) {
    if (match.index > index) {
      value.slice(index, match.index).split('').forEach(function(ch) { tokens.push(ch); });
    }
    tokens.push(match[0]);
    index = match.index + match[0].length;
  }
  if (index < value.length) {
    value.slice(index).split('').forEach(function(ch) { tokens.push(ch); });
  }
  return tokens.filter(Boolean);
}

/**
 * 行级排版：将文本排入一行，返回 glyph 信息
 *
 * @param {string} text - 行内文本
 * @param {object} fontOpts - 字体选项
 * @returns {{ glyphs: Array, width: number }}
 */
function layoutLine(text, fontOpts) {
  var chars = String(text || '').split('');
  var glyphs = [];
  var x = 0;
  for (var i = 0; i < chars.length; i++) {
    var ch = chars[i];
    var metrics = getGlyphMetrics(ch, fontOpts);
    glyphs.push({
      ch: ch,
      index: i,
      x: x,
      width: metrics.width,
      advance: metrics.advance
    });
    x += metrics.advance;
  }
  return { glyphs: glyphs, width: x };
}

// ============================================================
// Part 4: 统一 layoutTextBlock() — 块级排版
// ============================================================

/**
 * 从 delta.ops 中获取第一个 op 的属性
 */
function _getFirstTextAttrs(block) {
  return block && block.delta && block.delta.ops && block.delta.ops[0]
    ? (block.delta.ops[0].attributes || {})
    : {};
}

/**
 * 构建字符级样式信息（使用 measureTextCached 替代估算）
 *
 * @param {string} text - 纯文本
 * @param {object} block - 文字块数据
 * @param {number} scaleX - preview scale X
 * @returns {Array<{ ch, fontSize, letterSpacing, fontFamily, bold, italic, width }>}
 */
function buildStyledChars(text, block, scaleX) {
  var value = String(text || '');
  var chars = [];
  var ops = block && block.delta && Array.isArray(block.delta.ops) ? block.delta.ops : [];
  var fallbackAttrs = _getFirstTextAttrs(block);
  var graphemes = graphemeUtils.splitGraphemes(text);
  var graphemeOffsets = graphemeUtils.getGraphemeOffsets(text);
  var scaleXVal = Number(scaleX || 1);
  var graphemeOffset = 0;

  var pushChar = function(ch, attrs) {
    var rawSize = parseInt(attrs.size || attrs.fontSize || fallbackAttrs.size || fallbackAttrs.fontSize || 30, 10) || 30;
    var fontSize = Math.max(Math.round(rawSize * scaleXVal), 12);
    var letterSpacing = Number(attrs.letterSpacing || (block && block.letterSpacing) || 0) * scaleXVal;
    var fontFamily = attrs.fontFamily || (block && block.fontFamily) || '';
    var bold = !!attrs.bold;
    var italic = !!attrs.italic;

    var width = measureTextCached(ch, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: bold ? 'bold' : 'normal',
      letterSpacing: Math.max(letterSpacing, 0),
      bold: bold,
      italic: italic
    });

    // 宽度 = 字形宽度 + letterSpacing（与旧 getSelectionStyledChars 行为一致）
    var charWidth = Math.max(width + Math.max(letterSpacing, 0), 1);
    chars[graphemeOffset] = {
      ch: ch,
      fontSize: fontSize,
      letterSpacing: letterSpacing,
      fontFamily: fontFamily,
      bold: bold,
      italic: italic,
      width: charWidth
    };
    graphemeOffset += 1;
  };

  ops.forEach(function(op) {
    var attrs = Object.assign({}, op.attributes || {});
    graphemeUtils.splitGraphemes(op.insert || '').forEach(function(ch) { pushChar(ch, attrs); });
  });

  var fallbackGraphemes = graphemeUtils.splitGraphemes(value);
  while (graphemeOffset < fallbackGraphemes.length) {
    pushChar(fallbackGraphemes[graphemeOffset], fallbackAttrs || {});
  }

  return chars;
}

/** 中文禁则标点 */
var PROHIBIT_LINE_START = /[，。；：！？、》』】）…~\-–—]/;

/**
 * 块级排版：将文本排入多行，输出完整的排版结果
 *
 * @param {object} opts - 排版选项
 * @param {string} opts.text - 纯文本
 * @param {object} opts.block - 文字块数据
 * @param {number} opts.width - 可用宽度（preview rpx）
 * @param {number} opts.fontSize - 基础字号（preview rpx）
 * @param {number} opts.lineHeight - 行高倍数
 * @param {string} opts.align - 对齐方式 left/center/right
 * @param {number} opts.padX - 水平内边距
 * @param {number} opts.padY - 垂直内边距
 * @param {number} opts.scaleX - preview scale X
 * @returns {{ lines, glyphs, lineWidths, offsets, padX, padY, usable, fontSize, lineHeight }}
 */
function layoutTextBlock(opts) {
  var text = String(opts.text || '');
  var graphemes = graphemeUtils.splitGraphemes(text);
  var graphemeOffsets = graphemeUtils.getGraphemeOffsets(text);
  var block = opts.block || {};
  var width = Math.max(Number(opts.width) || 120, 40);
  var fontSize = Math.max(Number(opts.fontSize) || 12, 12);
  var lineHeightVal = Number(opts.lineHeight) || 1.6;
  var align = opts.align || 'left';
  var padX = Number(opts.padX) || 0;
  var padY = Number(opts.padY) || 0;
  var scaleX = opts.scaleX || 1;
  var usable = Math.max(width - padX * 2, 40);

  // 1. 构建字符级样式信息
  var styledChars = buildStyledChars(text, block, scaleX);

  // 2. 行分割
  var lines = [];
  var current = { chars: [], width: 0, startIndex: 0, fontSize: fontSize, lineHeight: fontSize * lineHeightVal };

  for (var i = 0; i < graphemes.length; i++) {
    var ch = graphemes[i];
    if (ch === '\n') {
      lines.push(current);
      current = { chars: [], width: 0, startIndex: i + 1, fontSize: fontSize, lineHeight: fontSize * lineHeightVal };
      continue;
    }
    var styled = styledChars[i] || {
      fontSize: fontSize,
      width: measureTextCached(ch, { fontSize: fontSize }),
      letterSpacing: 0,
      fontFamily: '',
      bold: false,
      italic: false
    };
    var chWidth = Math.max(Number(styled.width || 0), 1);
    if (current.chars.length && current.width + chWidth > usable) {
      if (PROHIBIT_LINE_START.test(ch)) {
        current.chars.push({
          index: i, width: chWidth,
          fontSize: styled.fontSize || fontSize,
          fontFamily: styled.fontFamily || '',
          bold: !!styled.bold, italic: !!styled.italic,
          letterSpacing: styled.letterSpacing || 0
        });
        current.width += chWidth;
        lines.push(current);
        current = { chars: [], width: 0, startIndex: i + 1, fontSize: fontSize, lineHeight: fontSize * lineHeightVal };
      } else {
        lines.push(current);
        current = { chars: [], width: 0, startIndex: i, fontSize: fontSize, lineHeight: fontSize * lineHeightVal };
      }
    }
    current.fontSize = Math.max(Number(current.fontSize || fontSize), Number(styled.fontSize || fontSize));
    current.lineHeight = Math.max(
      Number(current.lineHeight || fontSize * lineHeightVal),
      Number(styled.fontSize || fontSize) * lineHeightVal,
      Number(styled.fontSize || fontSize) + 6
    );
    current.chars.push({
      index: i, width: chWidth,
      fontSize: styled.fontSize || fontSize,
      fontFamily: styled.fontFamily || '',
      bold: !!styled.bold, italic: !!styled.italic,
      letterSpacing: styled.letterSpacing || 0
    });
    current.width += chWidth;
  }

  if (current.chars.length || !lines.length || graphemes[graphemes.length - 1] === '\n') {
    lines.push(current);
  }

  // 3. 计算行宽度
  var lineWidths = lines.map(function(line) { return line.width; });

  // 4. 计算所有字符的 offsets
  var offsets = [];
  var glyphs = [];
  var y = padY;

  lines.forEach(function(item, lineIndex) {
    var offsetX = padX;
    if (align === 'center') offsetX = padX + Math.max((usable - item.width) / 2, 0);
    if (align === 'right') offsetX = padX + Math.max(usable - item.width, 0);
    var x = offsetX;
    var itemLineHeight = Math.max(Number(item.lineHeight || fontSize * lineHeightVal), fontSize * lineHeightVal);

    offsets[item.startIndex] = {
      index: item.startIndex, x: x, y: y, line: lineIndex,
      codeUnitOffset: graphemeOffsets[item.startIndex] ? graphemeOffsets[item.startIndex].start : text.length,
      fontSize: item.fontSize || fontSize, lineHeight: itemLineHeight
    };

    item.chars.forEach(function(ch) {
      var codeUnit = graphemeOffsets[ch.index] || { start: text.length, end: text.length };
      glyphs.push({
        index: ch.index, line: lineIndex, x: x, y: y,
        codeUnitStart: codeUnit.start, codeUnitEnd: codeUnit.end,
        width: ch.width, fontSize: ch.fontSize,
        fontFamily: ch.fontFamily, bold: ch.bold, italic: ch.italic,
        letterSpacing: ch.letterSpacing
      });
      x += ch.width;
      offsets[ch.index + 1] = {
        index: ch.index + 1, x: x, y: y, line: lineIndex,
        codeUnitOffset: codeUnit.end,
        fontSize: item.fontSize || fontSize, lineHeight: itemLineHeight
      };
    });

    item.y = y;
    item.lineHeight = itemLineHeight;
    y += itemLineHeight;
  });

  return {
    lines: lines,
    glyphs: glyphs,
    lineWidths: lineWidths,
    offsets: offsets,
    padX: padX,
    padY: padY,
    usable: usable,
    fontSize: fontSize,
    lineHeight: fontSize * lineHeightVal,
    graphemeOffsets: graphemeOffsets,
    graphemeCount: graphemes.length,
    textLength: text.length
  };
}

// ============================================================
// Part 6: Layout Cache
// ============================================================

/**
 * 生成 layout cache key
 * 只包含影响排版的关键参数
 */
function _layoutCacheKey(text, block, width, scaleX) {
  var attrs = _getFirstTextAttrs(block);
  var fontFamily = block.fontFamily || attrs.fontFamily || '';
  var fontSize = attrs.size || attrs.fontSize || 32;
  var letterSpacing = block.letterSpacing || 0;
  var lineHeight = block.lineHeight || 1.6;
  var align = block.align || 'left';
  var rotation = block.rotation || 0;
  var fontMetricsVersion = block._fontMetricsVersion || 0;
  var layoutVersion = block._layoutVersion || 0;
  return [text, fontFamily, fontSize, letterSpacing, lineHeight, align, width, scaleX, rotation, fontMetricsVersion, layoutVersion].join('|');
}

/**
 * 带缓存的 layoutTextBlock
 *
 * @param {object} opts - 同 layoutTextBlock 参数
 * @returns {object} layout 结果
 */
function layoutTextBlockCached(opts) {
  var startedAt = telemetry.start();
  var text = String(opts.text || '');
  var block = opts.block || {};
  var width = Number(opts.width) || 120;
  var scaleX = opts.scaleX || 1;

  var key = _layoutCacheKey(text, block, width, scaleX);
  var cached = cacheManager.get(LAYOUT_CACHE, key, { maxSize: 96 });
  if (cached) {
    telemetry.recordCost('layout', startedAt);
    return cached;
  }

  var result = layoutTextBlock(opts);
  cacheManager.set(LAYOUT_CACHE, key, result, { maxSize: 96 });
  telemetry.recordCost('layout', startedAt);
  return result;
}

/**
 * 清空 layout 缓存
 */
function clearLayoutCache() {
  cacheManager.clear(LAYOUT_CACHE);
}

/**
 * 清空所有缓存（measureText + layout）
 */
function clearAllCache() {
  cacheManager.invalidateAll();
}

// ============================================================
// Part 5: Design-space Layout (for renderer consumption)
// ============================================================

/**
 * 在 design 坐标空间中排版文本块（无 preview scale）
 *
 * renderer.js 工作在原始 design rpx 空间（750 基准），
 * 不需要 preview scale 缩放。此函数在 design 空间中
 * 使用 ctx.measureText 精确测量字符宽度。
 *
 * 与 layoutTextBlock 的区别：
 *   - scaleX = 1（无缩放）
 *   - 使用传入的 ctx 进行 measureText
 *   - 输出格式与 renderer 的 layoutText 兼容
 *
 * @param {object} ctx - Canvas 2D context（用于 measureText）
 * @param {object} block - 文字块数据
 * @param {object} design - 设计数据（用于 fontFamily fallback）
 * @returns {{ lines: Array, lineHeights: Array, contentHeight: number }}
 *   lines: [{ runs: [{ text, style, width }], width }]
 *   lineHeights: [number]
 *   contentHeight: number
 */
function layoutTextBlockForDesign(ctx, block, design) {
  var delta = block && block.delta;
  var ops = (delta && delta.ops) || [];
  var maxWidth = Number(block.width || 500);
  var blockLetterSpacing = Number(block.letterSpacing || 0);
  var lineHeightVal = Number(block.lineHeight || 1.6);

  // 中文禁则标点
  var PROHIBIT = /[，。；：！？、》』】）…~\-–—]/;

  // 构建带样式的 runs（与 renderer splitRuns 对齐）
  var runs = [];
  ops.forEach(function(op) {
    var parts = String(op.insert || '').split(/(\n)/);
    parts.forEach(function(part) {
      if (!part) return;
      runs.push({
        text: part,
        style: Object.assign({ fontFamily: block.fontFamily, fontUrl: block.fontUrl }, op.attributes || {}),
        newline: part === '\n'
      });
    });
  });

  var lines = [];
  var line = [];
  var width = 0;

  function flush() {
    lines.push({ runs: line, width: width });
    line = [];
    width = 0;
  }

  runs.forEach(function(run) {
    if (run.newline) {
      flush();
      return;
    }

    // 使用与 renderer 相同的 token 拆分策略
    splitTextForLineWrap(run.text || '').forEach(function(token) {
      var style = run.style || {};
      var family = style.fontFamily || (design && design.fontFamily) || 'PingFang SC';
      var weight = style.bold ? 'bold' : (style.fontWeight || 'normal');
      var size = parseInt(style.size || style.fontSize || 30, 10) || 30;
      var italic = style.italic ? 'italic ' : '';
      var fontFamily = family.indexOf(',') >= 0 ? family : '"' + family + '", sans-serif';

      // 设置 ctx font 并测量
      ctx.font = italic + weight + ' ' + size + 'px ' + fontFamily;
      var tokenWidth = ctx.measureText(token).width
        + Math.max(Number(style.letterSpacing || blockLetterSpacing), 0) * Math.max(token.length - 1, 0);

      if (width + tokenWidth > maxWidth && line.length) {
        if (PROHIBIT.test(token)) {
          line.push({ text: token, style: style, width: tokenWidth });
          width += tokenWidth;
          flush();
        } else {
          flush();
          line.push({ text: token, style: style, width: tokenWidth });
          width += tokenWidth;
        }
      } else {
        line.push({ text: token, style: style, width: tokenWidth });
        width += tokenWidth;
      }
    });
  });

  if (line.length || !lines.length) flush();

  // 计算行高
  var baseSize = 30;
  var lineHeights = lines.map(function(l) {
    var lh = 0;
    for (var i = 0; i < l.runs.length; i++) {
      var s = l.runs[i].style || {};
      var sz = parseInt(s.size || s.fontSize || baseSize, 10) || baseSize;
      lh = Math.max(lh, sz * lineHeightVal);
    }
    return lh || baseSize * lineHeightVal;
  });

  var contentHeight = lineHeights.reduce(function(sum, item) { return sum + item; }, 0);

  return {
    lines: lines,
    lineHeights: lineHeights,
    contentHeight: contentHeight
  };
}

/**
 * 在 design 空间中排版，输出字符级 offsets（用于精确 hit testing / caret / selection）
 *
 * 与 layoutTextBlockForDesign 的区别：
 *   - 输出字符级 glyphs 和 offsets
 *   - 保留与 layoutTextBlock 相同的 offset 结构
 *
 * @param {object} ctx - Canvas 2D context
 * @param {object} block - 文字块数据
 * @param {object} design - 设计数据
 * @returns {{ lines, glyphs, lineWidths, offsets, fontSize, lineHeight }}
 */
function layoutTextBlockForDesignDetailed(ctx, block, design) {
  var delta = block && block.delta;
  var text = '';
  var ops = (delta && delta.ops) || [];
  ops.forEach(function(op) { text += String(op.insert || ''); });

  var width = Number(block.width || 500);
  var lineHeightVal = Number(block.lineHeight || 1.6);
  var align = block.align || 'left';
  var fallbackAttrs = _getFirstTextAttrs(block);

  // 构建字符级样式信息（design space, scaleX=1）
  var styledChars = [];
  var offset = 0;

  var pushChar = function(ch, attrs) {
    var rawSize = parseInt(attrs.size || attrs.fontSize || fallbackAttrs.size || fallbackAttrs.fontSize || 30, 10) || 30;
    var fontSize = Math.max(rawSize, 12);
    var letterSpacing = Number(attrs.letterSpacing || block.letterSpacing || 0);
    var fontFamily = attrs.fontFamily || block.fontFamily || '';
    var bold = !!attrs.bold;
    var italic = !!attrs.italic;

    // 使用 ctx 精确测量
    var family = fontFamily ? ('"' + fontFamily + '", sans-serif') : 'sans-serif';
    var weight = bold ? 'bold' : 'normal';
    var italicStr = italic ? 'italic ' : '';
    ctx.font = italicStr + weight + ' ' + fontSize + 'px ' + family;
    var charWidth = ctx.measureText(ch).width + Math.max(letterSpacing, 0);

    styledChars[offset] = {
      ch: ch,
      fontSize: fontSize,
      letterSpacing: letterSpacing,
      fontFamily: fontFamily,
      bold: bold,
      italic: italic,
      width: Math.max(charWidth, 1)
    };
    offset += 1;
  };

  ops.forEach(function(op) {
    var attrs = Object.assign({}, op.attributes || {});
    graphemeUtils.splitGraphemes(op.insert || '').forEach(function(ch) { pushChar(ch, attrs); });
  });
  while (offset < graphemes.length) pushChar(graphemes[offset], fallbackAttrs || {});

  // 行分割（与 layoutTextBlock 相同逻辑，但在 design space）
  var PROHIBIT = /[，。；：！？、》』】）…~\-–—]/;
  var lines = [];
  var baseFontSize = parseInt(fallbackAttrs.size || fallbackAttrs.fontSize || 30, 10) || 30;
  var current = { chars: [], width: 0, startIndex: 0, fontSize: baseFontSize, lineHeight: baseFontSize * lineHeightVal };

  for (var i = 0; i < graphemes.length; i++) {
    var ch = graphemes[i];
    if (ch === '\n') {
      lines.push(current);
      current = { chars: [], width: 0, startIndex: i + 1, fontSize: baseFontSize, lineHeight: baseFontSize * lineHeightVal };
      continue;
    }
    var styled = styledChars[i] || { fontSize: baseFontSize, width: baseFontSize, letterSpacing: 0, fontFamily: '', bold: false, italic: false };
    var chWidth = Math.max(Number(styled.width || 0), 1);
    if (current.chars.length && current.width + chWidth > width) {
      if (PROHIBIT.test(ch)) {
        current.chars.push({ index: i, width: chWidth, fontSize: styled.fontSize || baseFontSize });
        current.width += chWidth;
        lines.push(current);
        current = { chars: [], width: 0, startIndex: i + 1, fontSize: baseFontSize, lineHeight: baseFontSize * lineHeightVal };
      } else {
        lines.push(current);
        current = { chars: [], width: 0, startIndex: i, fontSize: baseFontSize, lineHeight: baseFontSize * lineHeightVal };
      }
    }
    current.fontSize = Math.max(Number(current.fontSize || baseFontSize), Number(styled.fontSize || baseFontSize));
    current.lineHeight = Math.max(
      Number(current.lineHeight || baseFontSize * lineHeightVal),
      Number(styled.fontSize || baseFontSize) * lineHeightVal,
      Number(styled.fontSize || baseFontSize) + 6
    );
    current.chars.push({ index: i, width: chWidth, fontSize: styled.fontSize || baseFontSize });
    current.width += chWidth;
  }

  if (current.chars.length || !lines.length || graphemes[graphemes.length - 1] === '\n') {
    lines.push(current);
  }

  var lineWidths = lines.map(function(l) { return l.width; });
  var offsets = [];
  var glyphs = [];
  var y = 0;

  lines.forEach(function(item, lineIndex) {
    var offsetX = 0;
    if (align === 'center') offsetX = Math.max((width - item.width) / 2, 0);
    if (align === 'right') offsetX = Math.max(width - item.width, 0);
    var x = offsetX;
    var itemLineHeight = Math.max(Number(item.lineHeight || baseFontSize * lineHeightVal), baseFontSize * lineHeightVal);

    offsets[item.startIndex] = {
      index: item.startIndex, x: x, y: y, line: lineIndex,
      codeUnitOffset: graphemeOffsets[item.startIndex] ? graphemeOffsets[item.startIndex].start : text.length,
      fontSize: item.fontSize || baseFontSize, lineHeight: itemLineHeight
    };

    item.chars.forEach(function(ch) {
      var codeUnit = graphemeOffsets[ch.index] || { start: text.length, end: text.length };
      glyphs.push({
        index: ch.index, line: lineIndex, x: x, y: y,
        codeUnitStart: codeUnit.start, codeUnitEnd: codeUnit.end,
        width: ch.width, fontSize: ch.fontSize
      });
      x += ch.width;
      offsets[ch.index + 1] = {
        index: ch.index + 1, x: x, y: y, line: lineIndex,
        codeUnitOffset: codeUnit.end,
        fontSize: item.fontSize || baseFontSize, lineHeight: itemLineHeight
      };
    });

    item.y = y;
    item.lineHeight = itemLineHeight;
    y += itemLineHeight;
  });

  return {
    lines: lines,
    glyphs: glyphs,
    lineWidths: lineWidths,
    offsets: offsets,
    fontSize: baseFontSize,
    lineHeight: baseFontSize * lineHeightVal,
    graphemeOffsets: graphemeOffsets,
    graphemeCount: graphemes.length,
    textLength: text.length
  };
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  // Part 1: measureText 缓存
  measureTextCached: measureTextCached,
  setMeasureContext: setMeasureContext,
  clearMeasureCache: clearMeasureCache,

  // Part 2: 字符 metrics
  getGlyphMetrics: getGlyphMetrics,
  buildStyledChars: buildStyledChars,

  // Part 3: 行级排版
  layoutLine: layoutLine,
  splitTextForLineWrap: splitTextForLineWrap,

  // Part 4: 块级排版（preview space）
  layoutTextBlock: layoutTextBlock,

  // Part 5: design-space layout（for renderer）
  layoutTextBlockForDesign: layoutTextBlockForDesign,
  layoutTextBlockForDesignDetailed: layoutTextBlockForDesignDetailed,

  // Part 6: 排版缓存
  layoutTextBlockCached: layoutTextBlockCached,
  clearLayoutCache: clearLayoutCache,
  clearAllCache: clearAllCache,

  // 内部回退（仅供测试）
  _estimateCharWidth: _estimateCharWidth
};
