const templates = require('../common/templates');
const cardStorage = require('../common/storage');
const renderer = require('../common/renderer');

const PREVIEW_STAGE_RPX = 680;
const PREVIEW_SCALE = PREVIEW_STAGE_RPX / 750;
const PREVIEW_STAGE_HEIGHT_RPX = 920;
const VERTICAL_WIDTH_THRESHOLD = 160;
const MIN_TEXT_BOX_WIDTH = 60;
const MAX_TEXT_BOX_WIDTH = PREVIEW_STAGE_RPX;   // 可拉到画布最大宽度
const MIN_TEXT_BOX_HEIGHT = 50;
const MAX_TEXT_BOX_HEIGHT = PREVIEW_STAGE_HEIGHT_RPX - 40;  // 保留底部边距，不超出画页
const DEFAULT_TEXT_BOX_WIDTH = 380;
const DEFAULT_TEXT_BOX_HEIGHT = 120;
const DEFAULT_TEXT_BOX_Y = 330;
const FONT_CDN = 'https://cdn.jsdelivr.net/fontsource/fonts';
const EMPTY_TEXT_PLACEHOLDER = '输入文字...';
const FONT_USAGE_KEY = 'card_tool_font_usage';
const FONT_CATALOG = [
  { id: 'system', name: '系统', family: 'PingFang SC', previewFamily: 'PingFang SC' },
  { id: 'zcoolkuaile', name: '站酷快乐', family: 'CardZcoolKuaiLe', previewFamily: 'CardZcoolKuaiLe, cursive', fontUrl: `${FONT_CDN}/zcool-kuaile@latest/chinese-simplified-400-normal.woff2` },
  { id: 'mashanzheng', name: '马善政', family: 'CardMaShanZheng', previewFamily: 'CardMaShanZheng, cursive', fontUrl: `${FONT_CDN}/ma-shan-zheng@latest/chinese-simplified-400-normal.woff2` },
  { id: 'liujianmaocao', name: '刘建毛草', family: 'CardLiuJianMaoCao', previewFamily: 'CardLiuJianMaoCao, cursive', fontUrl: `${FONT_CDN}/liu-jian-mao-cao@latest/chinese-simplified-400-normal.woff2` },
  { id: 'zhimangxing', name: '志莽行', family: 'CardZhiMangXing', previewFamily: 'CardZhiMangXing, cursive', fontUrl: `${FONT_CDN}/zhi-mang-xing@latest/chinese-simplified-400-normal.woff2` },
  { id: 'zcoolxiaowei', name: '站酷小薇', family: 'CardZcoolXiaoWei', previewFamily: 'CardZcoolXiaoWei, serif', fontUrl: `${FONT_CDN}/zcool-xiaowei@latest/chinese-simplified-400-normal.woff2` },
  { id: 'zcoolqingke', name: '站酷青柠', family: 'CardZcoolQingKe', previewFamily: 'CardZcoolQingKe, serif', fontUrl: `${FONT_CDN}/zcool-qingke-huangyou@latest/chinese-simplified-400-normal.woff2` },
  { id: 'longcang', name: '龙藏体', family: 'CardLongCang', previewFamily: 'CardLongCang, cursive', fontUrl: `${FONT_CDN}/long-cang@latest/chinese-simplified-400-normal.woff2` },
  { id: 'xingshu', name: '行书', family: 'Xingkai SC, STXingkai, cursive', previewFamily: 'Xingkai SC, STXingkai, cursive' },
  { id: 'songti', name: '宋体', family: 'Songti SC, SimSun, serif', previewFamily: 'Songti SC, SimSun, serif' },
  { id: 'kaiti', name: '楷体', family: 'Kaiti SC, KaiTi, serif', previewFamily: 'Kaiti SC, KaiTi, serif' },
  { id: 'fangsong', name: '仿宋', family: 'STFangsong, FangSong, serif', previewFamily: 'STFangsong, FangSong, serif' },
  { id: 'huawenxingkai', name: '华文行楷', family: 'STXingkai, Xingkai SC, cursive', previewFamily: 'STXingkai, Xingkai SC, cursive' },
  { id: 'zhaixingkai', name: '窄行楷', family: 'ZhanKuXingKai, cursive', previewFamily: 'ZhanKuXingKai, cursive' },
  { id: 'lishu', name: '隶书', family: 'STLiti, LiSu, serif', previewFamily: 'STLiti, LiSu, serif' },
  { id: 'yuanti', name: '圆体', family: 'Yuanti SC, YouYuan, sans-serif', previewFamily: 'Yuanti SC, YouYuan, sans-serif' },
  { id: 'mingcho', name: '思源宋体', family: 'CardNotoSerifSC', previewFamily: 'CardNotoSerifSC, serif', fontUrl: `${FONT_CDN}/noto-serif-sc@latest/chinese-simplified-400-normal.woff2` },
  { id: 'weibei', name: '魏碑', family: 'STWeibi, Weibei SC, serif', previewFamily: 'STWeibi, Weibei SC, serif' },
  { id: 'yaoti', name: '姚体', family: 'STYaoti, YaYuan, serif', previewFamily: 'STYaoti, YaYuan, serif' },
  { id: 'georgia', name: 'Georgia', family: 'Georgia, serif', previewFamily: 'Georgia, serif' },
  { id: 'times', name: 'Times', family: '"Times New Roman", Times, serif', previewFamily: '"Times New Roman", Times, serif' },
  { id: 'garamond', name: 'Garamond', family: 'Garamond, "Noto Serif", serif', previewFamily: 'Garamond, "Noto Serif", serif' },
  { id: 'playfair', name: 'Playfair', family: '"Playfair Display", Georgia, serif', previewFamily: '"Playfair Display", Georgia, serif' },
  { id: 'cormorant', name: 'Cormorant', family: '"Cormorant Garamond", Garamond, serif', previewFamily: '"Cormorant Garamond", Garamond, serif' },
  { id: 'bodoni', name: 'Bodoni', family: 'Bodoni MT, "Bodoni Moda", serif', previewFamily: 'Bodoni MT, "Bodoni Moda", serif' },
  { id: 'didot', name: 'Didot', family: 'Didot, "Didot BT", serif', previewFamily: 'Didot, "Didot BT", serif' }
];
const FONT_ID_ALIASES = {
  foyuan: 'zcoolkuaile',
  jingjin: 'zcoolkuaile',
  nuanshou: 'zcoolkuaile',
  jingxin: 'mashanzheng',
  shufa: 'mashanzheng',
  dengying: 'liujianmaocao',
  caoshu: 'liujianmaocao',
  fanhuashu: 'zhimangxing',
  cuishu: 'zhimangxing',
  xiaowei: 'zcoolxiaowei',
  qingkai: 'zcoolqingke',
  houmo: 'longcang'
};

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function resolveFontId(fontId) {
  return FONT_ID_ALIASES[fontId] || fontId;
}

function findFontById(fontId) {
  const resolvedId = resolveFontId(fontId || 'system');
  return FONT_CATALOG.find(item => item.id === resolvedId) || FONT_CATALOG[0];
}

function findFontForBlock(block, attrs) {
  const fontId = (attrs && attrs.fontId) || (block && block.fontId);
  const fontUrl = (attrs && attrs.fontUrl) || (block && block.fontUrl);
  const fontFamily = (attrs && attrs.fontFamily) || (block && block.fontFamily);
  if (fontId) return findFontById(fontId);
  if (fontUrl) {
    const byUrl = FONT_CATALOG.find(item => item.fontUrl === fontUrl);
    if (byUrl) return byUrl;
  }
  if (fontFamily) {
    return FONT_CATALOG.find(item => item.family === fontFamily) || null;
  }
  return null;
}

function readFontUsage() {
  try {
    return wx.getStorageSync(FONT_USAGE_KEY) || {};
  } catch (e) {
    return {};
  }
}

function writeFontUsage(usage) {
  try {
    wx.setStorageSync(FONT_USAGE_KEY, usage || {});
  } catch (e) {}
}

function getSortedFonts() {
  const usage = readFontUsage();
  return FONT_CATALOG
    .map((font, index) => ({ ...font, _index: index, _usage: usage[font.id] || {} }))
    .sort((a, b) => {
      if (a.id === 'system') return -1;
      if (b.id === 'system') return 1;
      const countDiff = Number(b._usage.count || 0) - Number(a._usage.count || 0);
      if (countDiff) return countDiff;
      const timeDiff = Number(b._usage.lastUsed || 0) - Number(a._usage.lastUsed || 0);
      if (timeDiff) return timeDiff;
      return a._index - b._index;
    })
    .map(({ _index, _usage, ...font }) => font);
}

function recordFontUsage(fontId) {
  if (!fontId || fontId === 'system') return;
  const usage = readFontUsage();
  const current = usage[fontId] || {};
  usage[fontId] = {
    count: Number(current.count || 0) + 1,
    lastUsed: Date.now()
  };
  writeFontUsage(usage);
}

const COLOR_USAGE_KEY = 'card_tool_color_usage';

function readColorUsage() {
  try {
    return wx.getStorageSync(COLOR_USAGE_KEY) || {};
  } catch (e) {
    return {};
  }
}

function writeColorUsage(usage) {
  try {
    wx.setStorageSync(COLOR_USAGE_KEY, usage || {});
  } catch (e) {}
}

function getSortedColors(baseColors) {
  const usage = readColorUsage();
  return (baseColors || [])
    .map((color, index) => ({ color, _index: index, _usage: usage[color] || {} }))
    .sort((a, b) => {
      const countDiff = Number(b._usage.count || 0) - Number(a._usage.count || 0);
      if (countDiff) return countDiff;
      const timeDiff = Number(b._usage.lastUsed || 0) - Number(a._usage.lastUsed || 0);
      if (timeDiff) return timeDiff;
      return a._index - b._index;
    })
    .map(({ color }) => color);
}

function recordColorUsage(color) {
  if (!color) return;
  const usage = readColorUsage();
  const current = usage[color] || {};
  usage[color] = {
    count: Number(current.count || 0) + 1,
    lastUsed: Date.now()
  };
  writeColorUsage(usage);
}

function normalizeHex(hex) {
  const value = String(hex || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return '#F7F1EA';
}

function hexToRgb(hex) {
  const value = normalizeHex(hex).slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function mixHex(hex, target, amount) {
  const from = hexToRgb(hex);
  const to = hexToRgb(target);
  const mix = channel => Math.round(from[channel] + (to[channel] - from[channel]) * amount);
  return `#${[mix('r'), mix('g'), mix('b')].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function buildGradientColors(color) {
  const base = normalizeHex(color);
  return [mixHex(base, '#FFFFFF', 0.62), base, mixHex(base, '#8B6F55', 0.22)];
}

function buildGlassBackground(color, previous) {
  const base = normalizeHex(color);
  return {
    type: 'gradient',
    colors: [mixHex(base, '#FFFFFF', 0.74), mixHex(base, '#FFFFFF', 0.36)],
    direction: 'vertical',
    blur: true,
    glassColor: base,
    paper: previous && previous.paper
  };
}

function deltaToText(delta) {
  return ((delta && delta.ops) || []).map(op => String(op.insert || '')).join('');
}

function getFirstTextAttrs(block) {
  return block && block.delta && block.delta.ops && block.delta.ops[0] ? (block.delta.ops[0].attributes || {}) : {};
}

function getBlockFontSize(block, fallback) {
  const attrs = getFirstTextAttrs(block);
  return parseInt(attrs.size || attrs.fontSize || fallback || 32, 10) || 32;
}

function getPreviewPxScale(design) {
  const designWidth = Number((design && design.size && design.size.width) || 750);
  try {
    const info = wx.getSystemInfoSync();
    const stageWidthPx = (info.windowWidth || 375) * PREVIEW_STAGE_RPX / 750;
    return stageWidthPx / designWidth;
  } catch (e) {
    return PREVIEW_SCALE / 2;
  }
}

function getCenteredBlockX(design, width) {
  const canvasWidth = Number((design && design.size && design.size.width) || 750);
  return Math.max(0, Math.round((canvasWidth - Number(width || DEFAULT_TEXT_BOX_WIDTH)) / 2));
}

function getBackgroundImageLayout(bg) {
  const sourceWidth = Number((bg && bg.bgWidth) || 0);
  const sourceHeight = Number((bg && bg.bgHeight) || 0);
  if (!sourceWidth || !sourceHeight) {
    return { width: PREVIEW_STAGE_RPX, height: PREVIEW_STAGE_HEIGHT_RPX };
  }
  const scale = Math.min(PREVIEW_STAGE_RPX / sourceWidth, PREVIEW_STAGE_HEIGHT_RPX / sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale))
  };
}

function getImageInfo(src) {
  return new Promise(resolve => {
    if (!src) {
      resolve({});
      return;
    }
    wx.getImageInfo({
      src,
      success: resolve,
      fail: () => resolve({})
    });
  });
}

function clampFontSize(size) {
  return Math.max(12, Math.min(200, Math.round(Number(size || 30))));
}

function scaleDeltaFontSizes(delta, scale) {
  return {
    ops: ((delta && delta.ops) || []).map(op => {
      const attrs = op.attributes || {};
      const baseSize = parseInt(attrs.size || attrs.fontSize || 30, 10) || 30;
      return {
        ...op,
        attributes: {
          ...attrs,
          size: clampFontSize(baseSize * scale)
        }
      };
    })
  };
}

function getBlockTextHeight(block) {
  const text = deltaToText(block && block.delta);
  const attrs = getFirstTextAttrs(block);
  const size = parseInt(attrs.size || attrs.fontSize || 30, 10) || 30;
  const lineHeight = Number((block && block.lineHeight) || 1.6);
  const width = Number((block && block.width) || 500);
  const letterSpacing = Number((block && block.letterSpacing) || attrs.letterSpacing || 0);
  const manualHeight = Number((block && block.manualHeight) || 0);
  if (!text.trim()) return Math.max(Number((block && block.placeholderHeight) || 140), manualHeight || 0);
  if (width <= VERTICAL_WIDTH_THRESHOLD) {
    return Math.max(manualHeight || Number((block && block.height) || 0) || 280, MIN_TEXT_BOX_HEIGHT);
  }
  const avgCharWidth = Math.max(size * 0.62 + letterSpacing, 12);
  const maxChars = Math.max(Math.floor(width / avgCharWidth), 1);
  const lines = text.split('\n').reduce((count, line) => {
    return count + Math.max(Math.ceil(line.length / maxChars), 1);
  }, 0);
  const contentHeight = Math.max(Math.ceil(lines * size * lineHeight + 28), Math.ceil(size * lineHeight + 28));
  return Math.max(contentHeight, manualHeight || 0);
}

function getTextFormats(block) {
  const attrs = getFirstTextAttrs(block);
  return {
    bold: !!attrs.bold,
    italic: !!attrs.italic,
    underline: !!attrs.underline
  };
}

function getDeltaLength(delta) {
  return ((delta && delta.ops) || []).reduce((sum, op) => sum + String(op.insert || '').length, 0);
}

function normalizeRange(start, end, max) {
  const from = Math.max(0, Math.min(Number(start || 0), max));
  const to = Math.max(0, Math.min(Number(end || 0), max));
  return from <= to ? { start: from, end: to } : { start: to, end: from };
}

function applyAttrsToDeltaRange(delta, start, end, attrs) {
  const sourceOps = (delta && delta.ops && delta.ops.length) ? delta.ops : [{ insert: '', attributes: {} }];
  const total = getDeltaLength(delta);
  const range = normalizeRange(start, end, total);
  if (range.start === range.end) {
    return {
      ops: sourceOps.map(op => ({
        ...op,
        attributes: { ...(op.attributes || {}), ...attrs }
      }))
    };
  }

  const ops = [];
  let cursor = 0;
  sourceOps.forEach(op => {
    const text = String(op.insert || '');
    const length = text.length;
    const opStart = cursor;
    const opEnd = cursor + length;
    const baseAttrs = op.attributes || {};

    if (opEnd <= range.start || opStart >= range.end) {
      ops.push({ insert: text, attributes: baseAttrs });
    } else {
      const localStart = Math.max(range.start - opStart, 0);
      const localEnd = Math.min(range.end - opStart, length);
      const before = text.slice(0, localStart);
      const selected = text.slice(localStart, localEnd);
      const after = text.slice(localEnd);
      if (before) ops.push({ insert: before, attributes: baseAttrs });
      if (selected) ops.push({ insert: selected, attributes: { ...baseAttrs, ...attrs } });
      if (after) ops.push({ insert: after, attributes: baseAttrs });
    }
    cursor = opEnd;
  });
  return { ops };
}

function getAttrsAtOffset(delta, offset) {
  const ops = (delta && delta.ops) || [];
  let cursor = 0;
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    const text = String(op.insert || '');
    const next = cursor + text.length;
    if (offset >= cursor && offset < next) return op.attributes || {};
    cursor = next;
  }
  return (ops[0] && ops[0].attributes) || {};
}

function hasTextSelection(start, end) {
  return typeof start === 'number' && typeof end === 'number' && start !== end;
}

function isVerticalTextBlock(block) {
  return Number((block && block.width) || 500) <= VERTICAL_WIDTH_THRESHOLD && !!deltaToText(block && block.delta).trim();
}

function getTextPanelState(block, fallback) {
  const attrs = getFirstTextAttrs(block);
  const font = findFontForBlock(block, attrs);
  return {
    formats: getTextFormats(block),
    fontSize: getBlockFontSize(block, fallback && fallback.fontSize),
    textOpacity: Number(attrs.opacity || 1),
    activeTextColor: attrs.color || (fallback && fallback.activeTextColor) || '#4B4038',
    activeBackground: attrs.background || attrs.backgroundColor || (fallback && fallback.activeBackground) || '#FFF2C7',
    activeStrokeColor: block.strokeColor || (fallback && fallback.activeStrokeColor) || '#FFFFFF',
    activeFontId: (font && font.id) || (fallback && fallback.activeFontId) || 'system',
    shadowStrength: block.shadow ? Number(block.shadowStrength || (fallback && fallback.shadowStrength) || 0.65) : 0
  };
}

function deltaToNodes(delta, block) {
  if (!deltaToText(delta).trim() && block.placeholder) {
    // placeholder 模式：从 delta attrs 中取实际字体大小，确保 slider 调整时同步变化
    const attrs = getFirstTextAttrs(block);
    const actualFontSize = parseInt(attrs.size || attrs.fontSize || block.placeholderSize || 30, 10) || 30;
    const placeholderFontFamily = block.fontFamily || attrs.fontFamily ? `font-family:${block.fontFamily || attrs.fontFamily}` : '';
    const blockLetterSpacing = Math.round(Number(block.letterSpacing || 0) * PREVIEW_SCALE * 10) / 10;
    return [{
      name: 'div',
      attrs: { style: [`letter-spacing:${blockLetterSpacing}rpx`, placeholderFontFamily].filter(Boolean).join(';') },
      children: [{
        name: 'span',
        attrs: {
          style: [
            `font-size:${Math.max(Math.round(actualFontSize * PREVIEW_SCALE), 12)}rpx`,
            'color:rgba(68,55,43,0.72)',
            'background:rgba(255,248,235,0.82)',
            'padding:10rpx 18rpx',
            'border-radius:8rpx',
            'border:1rpx dashed rgba(157,117,73,0.45)',
            'box-shadow:0 4rpx 18rpx rgba(80,54,30,0.12)'
          ].join(';')
        },
        children: [{ type: 'text', text: block.placeholder }]
      }]
    }];
  }

  const ops = (delta && delta.ops) || [];
  const children = [];
  const blockLetterSpacing = Math.round(Number(block.letterSpacing || 0) * PREVIEW_SCALE * 10) / 10;
  const strokeWidth = Math.max(1, Math.round(Number(block.strokeWidth || 2) * PREVIEW_SCALE));
  const vertical = isVerticalTextBlock(block);
  ops.forEach(op => {
    const attrs = op.attributes || {};
    const parts = String(op.insert || '').split(/(\n)/);
    const fontSize = Math.max(Math.round((parseInt(attrs.size || attrs.fontSize || 30, 10) || 30) * PREVIEW_SCALE), 12);
    const letterSpacing = Math.round(Number(attrs.letterSpacing || block.letterSpacing || 0) * PREVIEW_SCALE * 10) / 10;
    const style = [
      `font-size:${fontSize}rpx`,
      `color:${attrs.color || '#4B4038'}`,
      `opacity:${attrs.opacity || 1}`,
      attrs.bold ? 'font-weight:700' : '',
      attrs.italic ? 'font-style:italic' : '',
      attrs.underline ? 'text-decoration:underline' : '',
      attrs.background ? `background:${attrs.background}` : '',
      attrs.backgroundColor ? `background:${attrs.backgroundColor}` : '',
      (attrs.fontFamily || block.fontFamily) ? `font-family:${attrs.fontFamily || block.fontFamily}` : '',
      block.stroke ? `-webkit-text-stroke:${strokeWidth}rpx ${block.strokeColor || '#FFFFFF'}` : '',
      block.shadow ? `text-shadow:0 ${Math.round(Number(block.shadowOffsetY || 4) * PREVIEW_SCALE)}rpx ${Math.round(Number(block.shadowBlur || 10) * PREVIEW_SCALE)}rpx ${block.shadowColor || 'rgba(72,48,26,0.24)'}` : ''
    ].filter(Boolean).join(';');
    parts.forEach(part => {
      if (!part) return;
      if (part === '\n') children.push({ name: 'br' });
      else children.push({ name: 'span', attrs: { style }, children: [{ type: 'text', text: part }] });
    });
  });
  return [{
    name: 'div',
    attrs: {
      style: [
        `letter-spacing:${blockLetterSpacing}rpx`,
        `line-height:${block.lineHeight || 1.6}`,
        vertical ? 'writing-mode:vertical-rl' : '',
        vertical ? 'text-orientation:upright' : '',
        vertical ? 'height:100%' : ''
      ].filter(Boolean).join(';')
    },
    children
  }];
}

function hydrateDesign(design) {
  const copyDesign = clone(design);
  const previewPxScale = getPreviewPxScale(copyDesign);
  copyDesign.blocks = (copyDesign.blocks || []).map(block => {
    const height = getBlockTextHeight(block);
    const attrs = getFirstTextAttrs(block);
    const fontFamily = block.fontFamily || attrs.fontFamily || '';
    return {
      ...block,
      placeholder: block.placeholder || EMPTY_TEXT_PLACEHOLDER,
      height,
      previewX: Math.round((block.x || 0) * previewPxScale),
      previewY: Math.round((block.y || 0) * previewPxScale),
      previewWidth: Math.round((block.width || 500) * PREVIEW_SCALE),
      previewHeight: Math.round(height * PREVIEW_SCALE),
      previewOverlayHeight: Math.round(height * PREVIEW_SCALE),
      previewHeightStyle: `height:${Math.round(height * PREVIEW_SCALE)}rpx;`,
      // 编辑模式锁定高度：用 max(当前高度, 200rpx) 固定，防止 editor 渲染导致 movable-view 尺寸跳动
      editingHeightStyle: `height:${Math.max(Math.round(height * PREVIEW_SCALE), 200)}rpx;`,
      previewFontFamilyStyle: fontFamily ? `font-family:${fontFamily};` : '',
      previewTransformStyle: block.rotation ? `transform: rotate(${Number(block.rotation || 0)}deg);` : '',
      previewVerticalClass: isVerticalTextBlock(block) ? 'vertical' : '',
      previewFontSizeStyle: `font-size:${Math.round(getBlockFontSize(block) * PREVIEW_SCALE)}rpx;`,
      previewLetterSpacingStyle: `letter-spacing:${Math.round(Number(block.letterSpacing || 0) * PREVIEW_SCALE * 10) / 10}rpx;`,
      previewNodes: deltaToNodes(block.delta, block),
      plainText: deltaToText(block.delta)
    };
  });
  return copyDesign;
}

function createBlankDesign(template) {
  const design = clone(template || {});
  design.id = '';
  design.inputText = '';
  design.blocks = [
    {
      id: 'quote',
      type: 'text',
      x: getCenteredBlockX(design, DEFAULT_TEXT_BOX_WIDTH),
      y: DEFAULT_TEXT_BOX_Y,
      width: DEFAULT_TEXT_BOX_WIDTH,
      height: DEFAULT_TEXT_BOX_HEIGHT,
      manualHeight: DEFAULT_TEXT_BOX_HEIGHT,
      placeholderHeight: DEFAULT_TEXT_BOX_HEIGHT,
      rotation: 0,
      align: 'left',
      lineHeight: 1.6,
      letterSpacing: 1,
      placeholder: EMPTY_TEXT_PLACEHOLDER,
      placeholderSize: 30,
      delta: { ops: [{ insert: '', attributes: { size: 30, color: '#6B4F39' } }] }
    }
  ];
  design.decorations = [];
  design.qrcode = { ...(design.qrcode || {}), visible: false, src: '' };
  return design;
}

Page({
  data: {
    design: {},
    activeBlockId: '',
    activeBlock: {},
    activePlainText: '',
    inlineEditing: false,
    selectionStart: 0,
    selectionEnd: 0,
    activePanel: 'background',
    activeStyleTool: 'text',
    textInputFocus: false,
    formats: {},
    colors: getSortedColors(['#8B5A2B', '#A67C52', '#B8860B', '#CD853F', '#D2691E', '#DAA520', '#CC7722', '#BC6C25', '#A0522D', '#8B4513', '#704214', '#5C3317', '#3D3028', '#F7C7CE', '#FFB6A3', '#FF9A7A', '#FF867D', '#FF7F50', '#FF6347', '#FF5151', '#FF173D', '#E8A87C', '#C9915E', '#A77E50', '#FFFFFF', '#F4EEE6', '#C9AA84', '#8E7054', '#4B3428', '#17100D']),
    bgColors: ['#FFFFFF', '#FFF2C7', '#FFE4B5', '#FFDAB9', '#F7E1D7', '#E8D7C0', '#F5E6D3', '#E9D5BF', '#D4B896', '#C4A574', '#FFF0F0', '#FFD4D4', '#DDEEDB', '#E4F3D8', '#3D3028'],
    activeShadowColor: 'rgba(72,48,26,0.24)',
    bgOpacity: 0.8,
    backgroundColors: ['#F7F1EA', '#FFF7E8', '#FFF2D8', '#F6E7D1', '#EAF1E7', '#E8E8D6', '#F3DED8', '#E9D7BF', '#D8C7AE', '#BFA07A', '#8B6F55', '#314538'],
    showSolidPalette: false,
    backgroundPaletteMode: 'solid',
    fonts: getSortedFonts(),
    inputText: '',
    activeBackground: '#FFF2C7',
    activeTextColor: '#4B4038',
    activeStrokeColor: '#FFFFFF',
    activeFontId: 'system',
    fontSize: 32,
    textOpacity: 1,
    shadowStrength: 0,
    previewBackground: '#F7F1EA',
    previewBackgroundImage: '',
    nodeVersion: 0,
    bgOffsetX: 0,
    bgOffsetY: 0,
    bgDisplayWidth: PREVIEW_STAGE_RPX,
    bgDisplayHeight: PREVIEW_STAGE_HEIGHT_RPX,
    showColorPicker: false,
    colorPickerTarget: '',
    colorPickerTitle: '选取颜色',
    colorPickerPreview: '#4B4038',
    colorPickerHuePure: '#FF0000',
    colorPickerHueY: 0,
    colorPickerSvX: 0,
    colorPickerSvY: 0,
  canUndo: false,
  canRedo: false
  },

  // ==================== 撤销 / 重做 历史栈 ====================
  _history: [],
  _historyIndex: -1,
  _maxHistory: 30,

  /** 保存当前状态到历史栈（在每次 setDesign 之前调用） */
  _saveHistory() {
    const design = this.data.design;
    if (!design || !design.blocks) return;
    const snapshot = clone(design);
    // 如果当前不在历史末尾，截断后面的记录
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }
    this._history.push(snapshot);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    } else {
      this._historyIndex++;
    }
    this._updateUndoRedoState();
  },

  /** 撤销：恢复到上一个状态 */
  undo() {
    if (this._historyIndex <= 0) {
      wx.showToast({ title: '没有可撤销的操作', icon: 'none' });
      return;
    }
    this._historyIndex--;
    const prevDesign = this._history[this._historyIndex];
    if (prevDesign) {
      const activeId = prevDesign.blocks && prevDesign.blocks[0] ? prevDesign.blocks[0].id : '';
      this.setData({
        design: hydrateDesign(prevDesign),
        activeBlockId: activeId,
        activeBlock: prevDesign.blocks[0] || {},
        inlineEditing: false,
        textInputFocus: false
      }, () => {
        wx.showToast({ title: '已撤销', icon: 'none' });
      });
    }
    this._updateUndoRedoState();
  },

  /** 重做：恢复到下一个状态 */
  redo() {
    if (this._historyIndex >= this._history.length - 1) {
      wx.showToast({ title: '没有可重做的操作', icon: 'none' });
      return;
    }
    this._historyIndex++;
    const nextDesign = this._history[this._historyIndex];
    if (nextDesign) {
      const activeId = nextDesign.blocks && nextDesign.blocks[0] ? nextDesign.blocks[0].id : '';
      this.setData({
        design: hydrateDesign(nextDesign),
        activeBlockId: activeId,
        activeBlock: nextDesign.blocks[0] || {},
        inlineEditing: false,
        textInputFocus: false
      }, () => {
        wx.showToast({ title: '已重做', icon: 'none' });
      });
    }
    this._updateUndoRedoState();
  },

  /** 更新撤销/重做按钮的可用状态 */
  _updateUndoRedoState() {
    this.setData({
      canUndo: this._historyIndex > 0,
      canRedo: this._historyIndex < this._history.length - 1
    });
  },

  onLoad(query) {
    this.setData({ fonts: getSortedFonts() });
    setTimeout(() => this.preloadVisibleFonts(), 120);
    let design;
    if (query.draftId) {
      const draft = cardStorage.getDraft(query.draftId);
      design = draft && draft.design ? draft.design : templates.getTemplate('solar-term-paper');
      design.id = query.draftId;
    } else {
      design = createBlankDesign(templates.getTemplate(query.templateId || 'solar-term-paper'));
      design.templateId = query.templateId || design.id;
      design.id = '';
    }
    this.setDesign(design, (design.blocks && design.blocks[0] && design.blocks[0].id) || '');
// 初始状态也加入历史栈，使撤销可以从这里开始
this._saveHistory();
  },

  setDesign(design, activeId) {
    this._saveHistory();
    const hydrated = hydrateDesign(design);
    const activeBlock = hydrated.blocks.find(item => item.id === activeId) || hydrated.blocks[0] || {};
    const attrs = getFirstTextAttrs(activeBlock);
    if (attrs.fontUrl && attrs.fontFamily) {
      this.loadPreviewFont({ id: attrs.fontId || attrs.fontFamily, family: attrs.fontFamily, fontUrl: attrs.fontUrl });
    }
    this.setData({
      design: hydrated,
      activeBlockId: activeBlock.id || '',
      activeBlock,
      activePlainText: deltaToText(activeBlock.delta),
      inlineEditing: false,
      selectionStart: 0,
      selectionEnd: 0,
      textInputFocus: false,
      ...getTextPanelState(activeBlock, this.data),
      inputText: hydrated.inputText || this.data.inputText,
      previewBackground: this.getPreviewBackground(hydrated.background),
      // 保护背景图：新设计有图则用新的，否则保留当前已有的
      previewBackgroundImage: (this.getPreviewBackgroundImage(hydrated.background) || this.data.previewBackgroundImage),
      previewBlurStyle: this.getPreviewBlurStyle(hydrated.background),
      bgOffsetX: (hydrated.background && hydrated.background.offsetX) || 0,
      bgOffsetY: (hydrated.background && hydrated.background.offsetY) || 0,
      bgDisplayWidth: getBackgroundImageLayout(hydrated.background).width,
      bgDisplayHeight: getBackgroundImageLayout(hydrated.background).height
    });
  },

getPreviewBackground(bg) {
    if (!bg) return '#F7F1EA';
    // 背景图类型：返回纯色作为底层，实际图片由 previewBackgroundImage 单独渲染
    if (bg.type === 'image' && bg.src) return bg.color || '#F7F1EA';
    if (bg.type === 'gradient') {
      const colors = bg.colors || ['#FFF7E8', '#F5EEE1'];
      return `linear-gradient(180deg, ${colors[0]}, ${colors[1] || colors[0]})`;
    }
    return bg.color || '#F7F1EA';
  },

  getPreviewBackgroundImage(bg) {
    return bg && bg.type === 'image' && bg.src ? bg.src : '';
  },

  getPreviewBlurStyle(bg) {
    if (!bg || !bg.blur) return '';
    const color = bg.glassColor || bg.color || ((bg.colors && bg.colors[0]) || '#F7F1EA');
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.24);`;
  },

  switchPanel(e) {
    const activePanel = e.currentTarget.dataset.panel || 'background';
    this.setData({
      activePanel,
      activeStyleTool: activePanel === 'style' && this.data.activeStyleTool === 'background' ? 'text' : this.data.activeStyleTool
    });
    if (activePanel === 'font') {
      setTimeout(() => this.preloadVisibleFonts(), 80);
    }
  },

  switchStyleTool(e) {
    this.setData({ activeStyleTool: e.currentTarget.dataset.tool || 'text' });
  },

  onActiveTextInput(e) {
    const text = e.detail.value || '';
    const block = this.data.activeBlock || {};
    const firstAttrs = block.delta && block.delta.ops && block.delta.ops[0] ? (block.delta.ops[0].attributes || {}) : {};
    const delta = { ops: [{ insert: text, attributes: firstAttrs }] };
    const cursor = typeof e.detail.cursor === 'number' ? e.detail.cursor : text.length;
    this.setData({ activePlainText: text, inputText: text, selectionStart: cursor, selectionEnd: cursor });
    this.updateActiveBlock({ delta }, { silentEditor: true });
  },

  onTextSelection(e) {
    const detail = e.detail || {};
    const start = typeof detail.selectionStart === 'number' ? detail.selectionStart : detail.cursor;
    const end = typeof detail.selectionEnd === 'number' ? detail.selectionEnd : detail.cursor;
    if (typeof start !== 'number') return;
    this.setData({
      selectionStart: start,
      selectionEnd: typeof end === 'number' ? end : start
    });
  },

  onEditorReady() {
    wx.createSelectorQuery().in(this).select('#stageRichEditor').context(res => {
      if (res && res.context) {
        this.editorCtx = res.context;
      }
    }).exec();
  },

  syncStageEditor() {
    if (!this.editorCtx || !this.data.activeBlock || !this.data.activeBlock.delta) return;
    const delta = this.data.activeBlock.delta;
    const end = getDeltaLength(delta);
    this.editorCtx.setContents({
      delta,
      success: () => {
        this.setData({ selectionStart: end, selectionEnd: end, textInputFocus: true });
      }
    });
  },

  syncEditorContentsToDesign() {
    if (!this.editorCtx || typeof this.editorCtx.getContents !== 'function') return;
    this.editorCtx.getContents({
      success: res => {
        if (res && res.delta) {
          const delta = this.enrichEditorDelta(res.delta);
          this.updateActiveBlock({ delta }, { silentEditor: true });
          this.setData({ activePlainText: deltaToText(delta), inputText: deltaToText(delta) });
        }
      }
    });
  },

  enrichEditorDelta(delta) {
    const font = this.pendingFont;
    if (!font) return delta;
    return {
      ops: ((delta && delta.ops) || []).map(op => {
        const attrs = op.attributes || {};
        if (attrs.fontFamily !== font.family) return op;
        return {
          ...op,
          attributes: {
            ...attrs,
            fontId: font.id,
            fontUrl: font.fontUrl || ''
          }
        };
      })
    };
  },

  onEditorInput(e) {
    const delta = e.detail && e.detail.delta ? e.detail.delta : { ops: [] };
    const text = deltaToText(delta);
    this.updateActiveBlock({ delta }, { silentEditor: true });
    const end = getDeltaLength(delta);
    this.setData({ activePlainText: text, inputText: text, selectionStart: end, selectionEnd: end });
  },

  onStatusChange(e) {
    this.setData({ formats: { ...(this.data.formats || {}), ...(e.detail || {}) } });
  },

  finishInlineEditing() {
    this.editorCtx = null;
    this.setData({ inlineEditing: false, textInputFocus: false });
  },

  selectBlock(e) {
    if (this._suppressNextTap) return;
    const id = e.currentTarget.dataset.id;
    const block = (this.data.design.blocks || []).find(item => item.id === id);
    // 点击直接进入编辑模式
    return this.enterEditMode(id, block);
  },

  enterEditMode(id, block) {
    block = block || (this.data.design.blocks || []).find(item => item.id === id);
    if (!block) return;
    const end = getDeltaLength(block && block.delta);

    // 如果已经是同一个框的编辑模式，不重复处理
    if (this.data.inlineEditing && this.data.activeBlockId === id) return;

    this.setData({
      activeBlockId: id,
      activeBlock: block || {},
      activePlainText: deltaToText(block && block.delta),
      textInputFocus: true,
      inlineEditing: true,
      selectionStart: end,
      selectionEnd: end,
      ...getTextPanelState(block, this.data)
    });
  },

  editBlockText(e) {
    const id = e.currentTarget.dataset.id;
    const block = (this.data.design.blocks || []).find(item => item.id === id);
    this.enterEditMode(id, block);
  },

  updateActiveBlock(patch, options) {
    const design = clone(this.data.design);
    const index = design.blocks.findIndex(item => item.id === this.data.activeBlockId);
    if (index < 0) return;
    design.blocks[index] = { ...design.blocks[index], ...patch };
    if (design.blocks[index].type === 'text') {
      design.blocks[index].height = getBlockTextHeight(design.blocks[index]);
    }
    if (options && options.silentEditor) {
      const hydrated = hydrateDesign(design);
      const activeBlock = hydrated.blocks.find(item => item.id === this.data.activeBlockId) || {};
      this.setData({
        design: hydrated,
        activeBlock,
        activePlainText: deltaToText(activeBlock.delta),
        nodeVersion: (this.data.nodeVersion || 0) + 1,
        ...getTextPanelState(activeBlock, this.data)
      });
      return;
    }
    this.setDesign(design, design.blocks[index].id);
  },

  onBlockTouchStart(e) {
    const id = e.currentTarget.dataset.id || '';
    const block = (this.data.design.blocks || []).find(item => item.id === id);
    this._dragBlockId = id;
    this._dragMoved = false;
    const touch = e.touches && e.touches[0];
    if (touch && block) {
      this._dragStartX = touch.clientX;
      this._dragStartY = touch.clientY;
      this._dragStartPreviewX = Number(block.previewX || 0);
      this._dragStartPreviewY = Number(block.previewY || 0);
    }
  },

  // 替代 movable-view 的拖动：用触摸坐标计算位移
  onBlockMoveByResize(e) {
    if (this.data.inlineEditing) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const id = this._dragBlockId || (e.currentTarget.dataset.id || '');
    if (!id) return;
    let rpxPerPx = 1;
    try { rpxPerPx = 750 / (wx.getSystemInfoSync().windowWidth || 750); } catch (err) {}
    const dx = (touch.clientX - (this._dragStartX || touch.clientX)) * rpxPerPx;
    const dy = (touch.clientY - (this._dragStartY || touch.clientY)) * rpxPerPx;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) this._dragMoved = true;

    const blocks = (this.data.design.blocks || []).map(block => {
      if (block.id !== id) return block;
      const maxX = PREVIEW_STAGE_RPX - Number(block.previewWidth || 0);
      const maxY = PREVIEW_STAGE_HEIGHT_RPX - Number(block.previewHeight || 0);
      return {
        ...block,
        previewX: Math.max(0, Math.min(maxX, Math.round((this._dragStartPreviewX || 0) + dx))),
        previewY: Math.max(0, Math.min(maxY, Math.round((this._dragStartPreviewY || 0) + dy)))
      };
    });
    this.setData({ 'design.blocks': blocks });
  },

  onBlockTouchEnd(e) {
    const id = this._dragBlockId || (e.currentTarget.dataset.id || '');
    const moved = !!this._dragMoved;
    this._dragBlockId = '';
    this._dragMoved = false;
    this._dragStartX = null;
    this._dragStartY = null;
    this._dragStartPreviewX = null;
    this._dragStartPreviewY = null;
    if (!id) return;
    if (!moved) {
      const block = (this.data.design.blocks || []).find(b => b.id === id);
      if (block) this.enterEditMode(id, block);
      return;
    }
    this._suppressNextTap = true;
    setTimeout(() => {
      this._suppressNextTap = false;
    }, 80);

    const block = (this.data.design.blocks || []).find(b => b.id === id);
    if (!block) return;

    const design = clone(this.data.design);
    const index = design.blocks.findIndex(item => item.id === id);
    if (index >= 0) {
      const previewPxScale = getPreviewPxScale(design);
      design.blocks[index].x = Math.round((block.previewX || 0) / previewPxScale);
      design.blocks[index].y = Math.round((block.previewY || 0) / previewPxScale);
      this.setDesign(design, id);
    }
  },

  onResizeStart(e) {
    const touches = e.touches;
    const id = e.currentTarget.dataset.id || this.data.activeBlockId;
    const block = (this.data.design.blocks || []).find(item => item.id === id) || {};
    if (!touches || !touches.length || !block.id) return;
    let rpxPerPx = 1;
    try {
      const info = wx.getSystemInfoSync();
      rpxPerPx = 750 / (info.windowWidth || 750);
    } catch (err) {}

    const edge = e.currentTarget.dataset.edge || 'br';
    this.setData({
      activeBlockId: block.id,
      activeBlock: block,
      inlineEditing: false,
      textInputFocus: false,
      ...getTextPanelState(block, this.data)
    });
    this.resizeState = {
      id: block.id,
      edge,
      startX: touches[0].clientX,
      startY: touches[0].clientY,
      x: Number(block.x || 0),
      y: Number(block.y || 0),
      width: Number(block.width || DEFAULT_TEXT_BOX_WIDTH),
      height: Number(block.manualHeight || block.height || getBlockTextHeight(block)),
      baseWidth: Number(block.width || DEFAULT_TEXT_BOX_WIDTH),
      baseHeight: Number(block.manualHeight || block.height || getBlockTextHeight(block)),
      baseFontSize: getBlockFontSize(block),
      baseDelta: clone(block.delta || { ops: [] }),
      rpxPerPx,
      isPinch: touches.length >= 2
    };

    if (touches.length >= 2) {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      this.resizeState.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
    }
  },

  onResizeMove(e) {
    const touches = e.touches;
    const state = this.resizeState;
    if (!touches || !touches.length || !state || state.id !== this.data.activeBlockId) return;

    // ===== 双指缩放模式 =====
    if (state.isPinch && touches.length >= 2) {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!dist || !state.pinchStartDist) return;

      const scale = Math.max(0.5, Math.min(3.0, dist / state.pinchStartDist));
      const newWidth = Math.max(MIN_TEXT_BOX_WIDTH, Math.min(MAX_TEXT_BOX_WIDTH, Math.round(state.baseWidth * scale)));
      const newHeight = Math.max(MIN_TEXT_BOX_HEIGHT, Math.min(MAX_TEXT_BOX_HEIGHT, Math.round(state.baseHeight * scale)));
      const newFontSize = clampFontSize(Math.round(state.baseFontSize * scale));
      const delta = scaleDeltaFontSizes(state.baseDelta, scale);
      this.updateActiveBlock({ width: newWidth, manualHeight: newHeight, delta }, { silentEditor: true });
      this.setData({ fontSize: newFontSize });
      return;
    }

    // ===== 单指调整大小模式（根据手柄方向） =====
    if (!state.isPinch && touches.length === 1) {
      const touch = touches[0];
      const edge = state.edge || 'br';
      const dx = (touch.clientX - state.startX) * state.rpxPerPx / PREVIEW_SCALE;
      const dy = (touch.clientY - state.startY) * state.rpxPerPx / PREVIEW_SCALE;

      let newX = state.x;
      let newY = state.y;
      let newWidth = state.width;
      let newHeight = state.height;

      if (edge.includes('l')) {
        newWidth = Math.max(MIN_TEXT_BOX_WIDTH, Math.min(MAX_TEXT_BOX_WIDTH, Math.round(state.width - dx)));
        newX = state.x + (state.width - newWidth);
      }
      if (edge.includes('r')) newWidth = Math.max(MIN_TEXT_BOX_WIDTH, Math.min(MAX_TEXT_BOX_WIDTH, Math.round(state.width + dx)));
      if (edge.includes('t')) {
        newHeight = Math.max(MIN_TEXT_BOX_HEIGHT, Math.min(MAX_TEXT_BOX_HEIGHT, Math.round(state.height - dy)));
        newY = state.y + (state.height - newHeight);
      }
      if (edge.includes('b')) newHeight = Math.max(MIN_TEXT_BOX_HEIGHT, Math.min(MAX_TEXT_BOX_HEIGHT, Math.round(state.height + dy)));

      newX = Math.max(0, Math.min(Number((this.data.design.size && this.data.design.size.width) || 750) - newWidth, newX));
      newY = Math.max(0, Math.min(Number((this.data.design.size && this.data.design.size.height) || 1000) - newHeight, newY));

      const widthScale = newWidth / state.baseWidth;
      const heightScale = newHeight / state.baseHeight;
      const fontScale = (edge === 'tm' || edge === 'bm') ? heightScale : widthScale;
      const newFontSize = clampFontSize(Math.round(state.baseFontSize * fontScale));
      const delta = scaleDeltaFontSizes(state.baseDelta, fontScale);
      this.updateActiveBlock({ x: newX, y: newY, width: newWidth, manualHeight: newHeight, delta }, { silentEditor: true });
      this.setData({ fontSize: newFontSize });
    }
  },

  onResizeEnd() {
    this.resizeState = null;
  },

  /**
   * 将属性应用到当前文字框的全部文字（所有 ops），用于排列面板的全局操作。
   */
  applyFormatToAllText(attrs, blockPatch) {
    const block = this.data.activeBlock || {};
    if (!block.delta || !block.delta.ops) return;
    const newOps = (block.delta.ops || []).map(op => ({
      ...op,
      attributes: { ...(op.attributes || {}), ...attrs }
    }));
    const newDelta = { ops: newOps };
    if (this.editorCtx && this.data.inlineEditing) {
      this.editorCtx.setContents({ delta: newDelta });
    }
    this.updateActiveBlock({ ...(blockPatch || {}), delta: newDelta }, { silentEditor: true });
  },

  format(e) {
    const name = e.currentTarget.dataset.name;
    let value = e.currentTarget.dataset.value;
    if (!name) return;
    if (name === 'bold' || name === 'italic' || name === 'underline') {
      const attrs = getAttrsAtOffset(this.data.activeBlock && this.data.activeBlock.delta, this.data.selectionStart || 0);
      const nextValue = !attrs[name];
      // 排列面板的 B/I/U 应用到全部文字
      this.applyFormatToAllText({ [name]: nextValue });
      this.setData({ formats: { ...(this.data.formats || {}), [name]: nextValue } });
      return;
    }
    if (name === 'backgroundColor') {
      if (this.editorCtx && this.data.inlineEditing) {
        this.editorCtx.format('backgroundColor', value);
        setTimeout(() => this.syncEditorContentsToDesign(), 60);
        this.setData({ activeBackground: value });
        return;
      }
      this.setData({ activeBackground: value });
      this.updateActiveBlockTextAttributes({ background: value, backgroundColor: value });
      return;
    }
    if (name === 'color') {
      recordColorUsage(value);
      if (this.editorCtx && this.data.inlineEditing) {
        this.editorCtx.format('color', value);
        setTimeout(() => this.syncEditorContentsToDesign(), 60);
        this.setData({ activeTextColor: value });
        return;
      }
      this.setData({ activeTextColor: value });
      this.updateActiveBlockTextAttributes({ color: value });
    }
  },

  changeFontSize(e) {
    const fontSize = Number(e.detail.value || 32);
    this.setData({ fontSize });
    this.applyFormatToAllText({ size: fontSize });
  },

  changeLineHeight(e) {
    const lineHeight = Number(e.detail.value || 1.6).toFixed(1);
    if (this.editorCtx && this.data.inlineEditing) {
      this.editorCtx.format('lineHeight', String(lineHeight));
    }
    this.updateActiveBlock({ lineHeight }, { silentEditor: true });
  },

  changeLetterSpacing(e) {
    const letterSpacing = Number(e.detail.value || 0);
    this.setData({ 'activeBlock.letterSpacing': letterSpacing });
    this.applyFormatToAllText({ letterSpacing }, { letterSpacing });
  },

  changeOpacity(e) {
    const opacity = Number(e.detail.value || 1);
    this.setData({ textOpacity: opacity });
    this.applyFormatToAllText({ opacity });
  },

  /**
   * 基于当前选区(selectionStart/selectionEnd)对 delta 做局部属性修改，
   * 有选区时只修改选中部分，无选区时修改全部文字。
   * 同时同步到 editor 组件（编辑器模式下）和预览区。
   */
  applyFormatToSelection(attrs, blockPatch) {
    const block = this.data.activeBlock || {};
    if (!block.delta || !block.delta.ops) return;
    const hasSelection = hasTextSelection(this.data.selectionStart, this.data.selectionEnd);
    const delta = applyAttrsToDeltaRange(
      clone(block.delta),
      hasSelection ? this.data.selectionStart : 0,
      hasSelection ? this.data.selectionEnd : 0,
      attrs
    );
    if (this.editorCtx && this.data.inlineEditing) {
      this.editorCtx.setContents({ delta });
    }
    this.updateActiveBlock({ ...(!hasSelection ? (blockPatch || {}) : {}), delta }, { silentEditor: true });
  },

  changeShadowStrength(e) {
    const shadowStrength = Number(e.detail.value || 0);
    const shadow = shadowStrength > 0;
    this.setData({ shadowStrength });
    this.updateActiveBlock({
      shadow,
      shadowStrength,
      shadowBlur: Math.round(4 + shadowStrength * 18),
      shadowOffsetY: Math.round(2 + shadowStrength * 6),
      shadowColor: 'rgba(72,48,26,0.26)'
    }, { silentEditor: true });
  },

  updateActiveBlockTextAttributes(attrs, blockPatch) {
    const block = this.data.activeBlock || {};
    const delta = applyAttrsToDeltaRange(
      clone(block.delta || { ops: [] }),
      this.data.selectionStart,
      this.data.selectionEnd,
      attrs
    );
    this.updateActiveBlock({ ...(blockPatch || {}), delta }, { silentEditor: true });
  },

  setAlign(e) {
    const align = e.currentTarget.dataset.align || 'center';
    if (this.editorCtx && this.data.inlineEditing) {
      this.editorCtx.format('align', align);
    }
    this.updateActiveBlock({ align });
  },

  setFontFamily(e) {
    const fontId = e.currentTarget.dataset.id || 'system';
    const font = findFontById(fontId);
    recordFontUsage(font.id);
    this.setData({ activeFontId: font.id, fonts: getSortedFonts() });
    this.loadPreviewFont(font);

    const block = this.data.activeBlock || {};
    if (!block.delta || !block.delta.ops) return;

    const newOps = (block.delta.ops || []).map(op => ({
      ...op,
      attributes: {
        ...(op.attributes || {}),
        fontId: font.id,
        fontFamily: font.family,
        fontUrl: font.fontUrl || ''
      }
    }));
    const newDelta = { ops: newOps };

    if (this.editorCtx && this.data.inlineEditing) {
      if (typeof this.editorCtx.format === 'function') {
        this.editorCtx.format('fontFamily', font.family);
      }
      this.editorCtx.setContents({ delta: newDelta });
    }
    this.updateActiveBlock({
      delta: newDelta,
      fontId: font.id,
      fontFamily: font.family,
      fontUrl: font.fontUrl || ''
    }, { silentEditor: true });
  },

  loadPreviewFont(font) {
    if (!font || !font.fontUrl || this.loadedFonts && this.loadedFonts[font.id]) return Promise.resolve();
    this.loadedFonts = this.loadedFonts || {};
    return new Promise(resolve => {
      wx.loadFontFace({
        family: font.family,
        source: `url("${font.fontUrl}")`,
        global: false,
        success: () => {
          this.loadedFonts[font.id] = true;
          this.setData({ design: hydrateDesign(clone(this.data.design)) });
          resolve();
        },
        fail: () => resolve()
      });
    });
  },

  preloadVisibleFonts() {
    (this.data.fonts || [])
      .filter(font => font && font.fontUrl)
      .slice(0, 12)
      .forEach(font => this.loadPreviewFont(font));
  },

  setStrokeColor(e) {
    const activeStrokeColor = e.currentTarget.dataset.value || '#FFFFFF';
    this.setData({ activeStrokeColor });
    this.updateActiveBlock({ stroke: true, strokeColor: activeStrokeColor, strokeWidth: 2 });
  },

  pickTextColor() {
    this.openColorPicker('text', this.data.activeTextColor || '#4B4038', '文字颜色');
  },

  pickStrokeColor() {
    this.openColorPicker('stroke', this.data.activeStrokeColor || '#FFFFFF', '描边颜色');
  },

  setBgColor(e) {
    const activeBackground = e.currentTarget.dataset.value || '#FFF2C7';
    this.setData({ activeBackground });
    this.applyFormatToAllText({ background: activeBackground, backgroundColor: activeBackground });
  },

  pickBackgroundColor() {
    this.openColorPicker('bg', this.data.activeBackground || '#FFF2C7', '文字背景');
  },

  changeBgOpacity(e) {
    const bgOpacity = Number(e.detail.value || 0.8);
    this.setData({ bgOpacity });
    // 背景透明度通过调整颜色的 alpha 值实现
    const hex = this.data.activeBackground || '#FFF2C7';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const rgba = `rgba(${r},${g},${b},${bgOpacity})`;
    this.applyFormatToAllText({ background: rgba, backgroundColor: rgba });
  },

  setShadowColor(e) {
    const activeShadowColor = e.currentTarget.dataset.value || 'rgba(72,48,26,0.24)';
    this.setData({ activeShadowColor: activeShadowColor });
    if (this.data.activeBlock && this.data.activeBlock.shadow) {
      this.updateActiveBlock({
        shadowColor: activeShadowColor,
        shadow: true,
        shadowBlur: Math.round(4 + (this.data.shadowStrength || 0) * 18),
        shadowOffsetY: Math.round(2 + (this.data.shadowStrength || 0) * 6)
      }, { silentEditor: true });
    }
  },

  pickShadowColor() {
    this.openColorPicker('shadow', this.data.activeShadowColor || '#48301A', '阴影颜色');
  },

  /* ===== 颜色选择器核心逻辑 ===== */

  openColorPicker(target, defaultHex, title) {
    const hsl = this.hexToHsl(defaultHex);
    const svPos = this.hslToSvPosition(hsl.h, hsl.s, hsl.v);
    const huePure = this.hsvToHex(hsl.h, 100, 100);
    const hueBarHeight = 360;
    this._cpTarget = target;
    this._cpHue = hsl.h;
    this.setData({
      showColorPicker: true,
      colorPickerTarget: target,
      colorPickerTitle: title,
      colorPickerPreview: defaultHex,
      colorPickerHuePure: huePure,
      colorPickerHueY: (hsl.h / 360) * hueBarHeight,
      colorPickerSvX: svPos.x,
      colorPickerSvY: svPos.y
    });
  },

  closeColorPicker() {
    this.setData({ showColorPicker: false });
    this._cpTarget = '';
    this._cpHue = 0;
  },

  confirmColorPicker() {
    const color = this.data.colorPickerPreview;
    const target = this._cpTarget;
    recordColorUsage(color);

    if (target === 'text') {
      this.setData({ activeTextColor: color });
      if (this.editorCtx && this.data.inlineEditing) {
        this.editorCtx.format('color', color);
        setTimeout(() => this.syncEditorContentsToDesign(), 60);
      } else {
        this.updateActiveBlockTextAttributes({ color });
      }
    } else if (target === 'stroke') {
      this.setData({ activeStrokeColor: color });
      this.updateActiveBlock({ stroke: true, strokeColor: color, strokeWidth: 2 });
    } else if (target === 'bg') {
      this.setData({ activeBackground: color });
      this.applyFormatToAllText({ background: color, backgroundColor: color });
    } else if (target === 'shadow') {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const rgba = `rgba(${r},${g},${b},0.35)`;
      this.setData({ activeShadowColor: rgba });
      if (this.data.activeBlock && this.data.activeBlock.shadow) {
        this.updateActiveBlock({
          shadowColor: rgba,
          shadow: true,
          shadowBlur: Math.round(4 + (this.data.shadowStrength || 0) * 18),
          shadowOffsetY: Math.round(2 + (this.data.shadowStrength || 0) * 6)
        }, { silentEditor: true });
      }
    } else if (target === 'canvasBg') {
      const design = clone(this.data.design);
      const prevBg = design.background || {};
      design.background = {
        ...prevBg,
        type: prevBg.type === 'image' && prevBg.src ? 'image' : 'solid',
        color,
        glassColor: color
      };
      this.setData({
        showSolidPalette: false,
        backgroundPaletteMode: 'solid'
      });
      this.setDesign(design, this.data.activeBlockId);
    }

    this.closeColorPicker();
    // 选完颜色后自动进入编辑模式，方便用户直接输入文字
    if (target !== 'canvasBg' && this.data.activeBlockId && !this.data.inlineEditing) {
      const block = (this.data.design.blocks || []).find(item => item.id === this.data.activeBlockId);
      if (block) setTimeout(() => this.enterEditMode(this.data.activeBlockId, block), 200);
    }
  },

  stopPropagation() {},

  updateSvPanelBg(hue) {
    const svPanel = this.selectComponent ? null : null;
    // 通过 setData 设置 SV 面板背景
    const white = '#FFFFFF';
    const black = '#000000';
    const pure = this.hsvToHex(hue, 100, 100);
    this.setData({
      _svBgLeftTop: white,
      _svBgRightTop: pure,
      _svBgLeftBottom: pure,
      _svBgRightBottom: black
    });
  },

  onSvPanelTouchStart(e) {
    this._cpSvDragging = true;
    this.handleSvPanelMove(e);
  },

  onSvPanelTouchMove(e) {
    if (!this._cpSvDragging) return;
    this.handleSvPanelMove(e);
  },

  onSvPanelTouchEnd() {
    this._cpSvDragging = false;
  },

  handleSvPanelMove(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const query = wx.createSelectorQuery().in(this);
    query.select('.cp-sv-panel').boundingClientRect(rect => {
      if (!rect) return;
      let x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
      let y = Math.max(0, Math.min(rect.height, touch.clientY - rect.top));
      const s = (x / rect.width) * 100;
      const v = (1 - y / rect.height) * 100;
      const hex = this.hsvToHex(this._cpHue || 0, s, v);
      this.setData({
        colorPickerSvX: x,
        colorPickerSvY: y,
        colorPickerPreview: hex
      });
    }).exec();
  },

  onHueBarTouchStart(e) {
    this._cpHueDragging = true;
    this.handleHueBarMove(e);
  },

  onHueBarTouchMove(e) {
    if (!this._cpHueDragging) return;
    this.handleHueBarMove(e);
  },

  onHueBarTouchEnd() {
    this._cpHueDragging = false;
  },

  handleHueBarMove(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const query = wx.createSelectorQuery().in(this);
    query.select('.cp-hue-bar').boundingClientRect(rect => {
      if (!rect) return;
      let y = Math.max(0, Math.min(rect.height, touch.clientY - rect.top));
      const hue = (y / rect.height) * 360;
      this._cpHue = hue;
      // 用当前 SV 值重新计算颜色
      const svQuery = wx.createSelectorQuery().in(this);
      svQuery.select('.cp-sv-panel').boundingClientRect(svRect => {
        if (!svRect) return;
        const sx = this.data.colorPickerSvX || 0;
        const sy = this.data.colorPickerSvY || 0;
        const s = (sx / svRect.width) * 100;
        const v = (1 - sy / svRect.height) * 100;
        const hex = this.hsvToHex(hue, s, v);
        this.setData({
          colorPickerHueY: y,
          colorPickerPreview: hex,
          colorPickerHuePure: this.hsvToHex(hue, 100, 100)
        });
      }).exec();
    }).exec();
  },

  /* ===== 颜色转换工具函数 ===== */

  hexToHsl(hex) {
    hex = String(hex || '').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(((2 * l + (s * (1 - Math.abs(2 * l - 1)))) / 2) * 100) };
  },

  hslToSvPosition(h, s, v) {
    // 返回 SV 面板上的 x,y 像素坐标（基于 480x360 的面板尺寸）
    const panelW = 240; // 480rpx ≈ 240px
    const panelH = 180; // 360rpx ≈ 180px
    return { x: (s / 100) * panelW, y: (1 - v / 100) * panelH };
  },

  hsvToHex(h, s, v) {
    s /= 100; v /= 100;
    const i = Math.floor(h / 60) % 6;
    const f = h / 60 - Math.floor(h / 60);
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r, g, b;
    switch (i) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      default: r = v; g = p; b = q; break;
    }
    const toHex = c => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  },

  deleteActiveBlock() {
    const design = clone(this.data.design);
    const blocks = Array.isArray(design.blocks) ? design.blocks : [];
    const activeId = this.data.activeBlockId;
    const index = blocks.findIndex(item => item && item.type === 'text' && item.id === activeId);
    if (index < 0) {
      wx.showToast({ title: '请先选中文字框', icon: 'none' });
      return;
    }
    blocks.splice(index, 1);
    design.blocks = blocks;
    this.editorCtx = null;
    this.setData({ inlineEditing: false, textInputFocus: false });
    if (!blocks.length) {
      this.setData({
        design: hydrateDesign(design),
        activeBlockId: '',
        activeBlock: {},
        activePlainText: '',
        selectionStart: 0,
        selectionEnd: 0
      });
      wx.showToast({ title: '已删除文字框', icon: 'none' });
      return;
    }
    const nextIndex = Math.min(index, blocks.length - 1);
    this.setDesign(design, blocks[nextIndex].id);
    wx.showToast({ title: '已删除文字框', icon: 'none' });
  },

  copyActiveBlock() {
    const design = clone(this.data.design);
    const blocks = design.blocks || [];
    const source = blocks.find(item => item.id === this.data.activeBlockId);
    if (!source) return;
    const copied = {
      ...clone(source),
      id: `text_${Date.now()}`,
      x: Math.min(Number(source.x || 0) + 36, 690),
      y: Math.min(Number(source.y || 0) + 36, 860)
    };
    blocks.push(copied);
    this.editorCtx = null;
    this.setData({ inlineEditing: false, textInputFocus: false });
    this.setDesign(design, copied.id);
    wx.showToast({ title: '已复制文字框', icon: 'none' });
  },

  rotateActiveBlock() {
    const current = Number((this.data.activeBlock && this.data.activeBlock.rotation) || 0);
    const rotation = (current + 15) % 360;
    this.updateActiveBlock({ rotation });
  },

  toggleStroke() {
    this.updateActiveBlock({ stroke: !this.data.activeBlock.stroke, strokeColor: this.data.activeStrokeColor || '#FFFFFF', strokeWidth: 2 });
  },

  toggleShadow() {
    const shadow = !this.data.activeBlock.shadow;
    const shadowStrength = shadow ? (this.data.shadowStrength || 0.65) : 0;
    this.updateActiveBlock({
      shadow,
      shadowStrength,
      shadowBlur: Math.round(4 + shadowStrength * 18),
      shadowOffsetY: Math.round(2 + shadowStrength * 6),
      shadowColor: 'rgba(72,48,26,0.26)'
    });
  },

  addTextBlock() {
    const design = clone(this.data.design);
    const textBlockCount = (design.blocks || []).filter(item => item.type === 'text').length;
    const baseY = DEFAULT_TEXT_BOX_Y;
    const stepY = 128;
    const nextY = Math.min(baseY + textBlockCount * stepY, 640);
    const block = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: getCenteredBlockX(design, DEFAULT_TEXT_BOX_WIDTH),
      y: nextY,
      width: DEFAULT_TEXT_BOX_WIDTH,
      height: DEFAULT_TEXT_BOX_HEIGHT,
      manualHeight: DEFAULT_TEXT_BOX_HEIGHT,
      placeholderHeight: DEFAULT_TEXT_BOX_HEIGHT,
      align: 'left',
      lineHeight: 1.6,
      letterSpacing: 1,
      placeholder: EMPTY_TEXT_PLACEHOLDER,
      placeholderSize: 30,
      delta: { ops: [{ insert: '', attributes: { size: 30, color: '#6B4F39' } }] }
    };
    design.blocks.push(block);
    this.setDesign(design, block.id);
    setTimeout(() => this.setData({ textInputFocus: true, inlineEditing: true, selectionStart: 0, selectionEnd: 0 }), 80);
  },

  chooseBackground() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async res => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file || !file.tempFilePath) {
          wx.showToast({ title: '选择图片失败', icon: 'none' });
          return;
        }
        const design = clone(this.data.design);
        const prevBg = design.background || {};
        const info = await getImageInfo(file.tempFilePath);
        const bgWidth = Number(file.width || info.width || 0);
        const bgHeight = Number(file.height || info.height || 0);
        const layout = getBackgroundImageLayout({ bgWidth, bgHeight });

        design.background = {
          type: 'image',
          src: file.tempFilePath,
          blur: !!prevBg.blur,
          color: prevBg.color || '#F7F1EA',
          glassColor: prevBg.glassColor,
          baseColor: prevBg.baseColor,
          offsetX: 0,
          offsetY: 0,
          bgWidth,
          bgHeight
        };

        // 先设置背景图 URL 和偏移，确保 WXML 立即渲染
        this.setData({
          previewBackgroundImage: file.tempFilePath,
          bgOffsetX: 0,
          bgOffsetY: 0,
          bgDisplayWidth: layout.width,
          bgDisplayHeight: layout.height
        });
        // 再更新完整设计
        this.setDesign(design, this.data.activeBlockId);
      },
      fail: err => {
        console.warn('chooseMedia fail:', err);
        // 用户取消选择时不提示
      }
    });
  },

  onBgTouchStart(e) {
    const touch = e.touches && e.touches[0];
    if (touch) {
      this._bgDragStartX = touch.clientX;
      this._bgDragStartY = touch.clientY;
      this._bgOffsetStartX = this.data.bgOffsetX || 0;
      this._bgOffsetStartY = this.data.bgOffsetY || 0;
    }
  },

  onBgTouchMove(e) {
    const touch = e.touches && e.touches[0];
    if (!touch || this._bgDragStartX == null) return;
    let rpxPerPx = 1;
    try {
      const info = wx.getSystemInfoSync();
      rpxPerPx = 750 / (info.windowWidth || 750);
    } catch (err) {}
    const dx = (touch.clientX - this._bgDragStartX) * rpxPerPx;
    const dy = (touch.clientY - this._bgDragStartY) * rpxPerPx;
    this.setData({
      bgOffsetX: Math.round(this._bgOffsetStartX + dx),
      bgOffsetY: Math.round(this._bgOffsetStartY + dy)
    });
  },

  onBgTouchEnd() {
    // 拖动结束，同步 offset 到 design 中以便保存
    const design = clone(this.data.design);
    if (design.background) {
      design.background.offsetX = this.data.bgOffsetX || 0;
      design.background.offsetY = this.data.bgOffsetY || 0;
    }
    this.setData({ 'design.background': design.background });
    this._bgDragStartX = null;
    this._bgDragStartY = null;
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: res => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        const design = clone(this.data.design);
        design.avatar = { visible: true, src: file.tempFilePath, x: 76, y: 760, size: 112, radius: 56 };
        this.setDesign(design, this.data.activeBlockId);
      }
    });
  },

  chooseQrCode() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: res => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        const design = clone(this.data.design);
        design.qrcode = { ...(design.qrcode || {}), visible: true, src: file.tempFilePath };
        this.setDesign(design, this.data.activeBlockId);
      }
    });
  },

  deleteQrCode() {
    const design = clone(this.data.design);
    design.qrcode = { ...(design.qrcode || {}), visible: false, src: '' };
    this.setData({ design: hydrateDesign(design) });
    wx.showToast({ title: '已删除二维码', icon: 'none' });
  },

  setBackgroundType(e) {
    const type = e.currentTarget.dataset.type;
    const design = clone(this.data.design);
    if (type === 'solid') {
      const current = (design.background && (design.background.color || design.background.glassColor || design.background.baseColor)) || '#F7F1EA';
      this.openColorPicker('canvasBg', current, '背景颜色');
      return;
    }
    if (type === 'gradient') {
      this.setData({ showSolidPalette: true, backgroundPaletteMode: 'gradient' });
      const base = (design.background && (design.background.baseColor || design.background.color || design.background.glassColor)) || '#FFF7E8';
      design.background = {
        type: 'gradient',
        colors: buildGradientColors(base),
        baseColor: normalizeHex(base),
        direction: 'vertical',
        blur: !!(design.background && design.background.blur),
        glassColor: design.background && design.background.glassColor
      };
    }
    if (type === 'blur') {
      this.setData({ showSolidPalette: true, backgroundPaletteMode: 'blur' });
      const base = (design.background && (design.background.glassColor || design.background.baseColor || design.background.color)) || '#F7F1EA';
      design.background = buildGlassBackground(base, design.background);
    }
    this.setDesign(design, this.data.activeBlockId);
  },

  setBackgroundPaletteColor(e) {
    const color = e.currentTarget.dataset.color || '#F7F1EA';
    const design = clone(this.data.design);
    const mode = this.data.backgroundPaletteMode || 'solid';
    if (mode === 'gradient') {
      design.background = {
        type: 'gradient',
        colors: buildGradientColors(color),
        baseColor: normalizeHex(color),
        direction: 'vertical',
        blur: !!(design.background && design.background.blur),
        glassColor: design.background && design.background.glassColor
      };
    } else if (mode === 'blur') {
      design.background = buildGlassBackground(color, design.background);
    } else {
      design.background = { type: 'solid', color, blur: !!(design.background && design.background.blur), glassColor: design.background && design.background.glassColor };
    }
    this.setData({ showSolidPalette: true });
    this.setDesign(design, this.data.activeBlockId);
  },

  toggleBlur() {
    const design = clone(this.data.design);
    this.setData({ showSolidPalette: true, backgroundPaletteMode: 'blur' });
    const base = (design.background && (design.background.glassColor || design.background.baseColor || design.background.color)) || '#F7F1EA';
    design.background = buildGlassBackground(base, design.background);
    this.setDesign(design, this.data.activeBlockId);
  },

  saveDraft(options) {
    const saved = cardStorage.saveDraft(clone(this.data.design));
    this.setData({ 'design.id': saved.id });
    if (!options || !options.silent) {
      wx.showToast({ title: '已保存草稿', icon: 'success' });
    }
    return saved;
  },

  saveImageToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => wx.showToast({ title: '已保存', icon: 'success' }),
      fail: err => {
        if ((err.errMsg || '').indexOf('auth') >= 0) {
          wx.showModal({
            title: '需要授权',
            content: '请允许保存到相册后重试',
            confirmText: '去设置',
            success: res => {
              if (res.confirm) wx.openSetting();
            }
          });
          return;
        }
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  async goExport() {
    if (this.data.inlineEditing) {
      this.finishInlineEditing();
    }
    const saved = this.saveDraft({ silent: true });
    const exportDesign = clone(this.data.design);
    exportDesign.id = saved.id;
    cardStorage.setCurrentExportDesign(exportDesign);
    wx.showLoading({ title: '导出中...' });
    try {
      const imagePath = await renderer.exportPoster(this, '#exportCanvas', exportDesign, { scale: 3 });
      wx.hideLoading();
      this.saveImageToAlbum(imagePath);
    } catch (e) {
      console.error('导出失败', e);
      wx.hideLoading();
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  }
});
