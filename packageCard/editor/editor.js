const templates = require('../common/templates');
const cardStorage = require('../common/storage');
const renderer = require('../common/renderer');

const PREVIEW_STAGE_RPX = 680;
const PREVIEW_SCALE = PREVIEW_STAGE_RPX / 750;
const PREVIEW_STAGE_HEIGHT_RPX = Math.round(1000 * PREVIEW_SCALE);
const CANVAS_SIZE_OPTIONS = [
  { id: 'portrait', name: '竖版', width: 750, height: 1000 },
  { id: 'square', name: '方形', width: 1000, height: 1000 },
  { id: 'landscape', name: '横版', width: 1000, height: 750 },
  { id: 'image', name: '跟随图片', width: 0, height: 0 }
];
const VERTICAL_WIDTH_THRESHOLD = 160;
const MIN_TEXT_BOX_WIDTH = 60;
const MAX_TEXT_BOX_WIDTH = PREVIEW_STAGE_RPX;   // 可拉到画布最大宽度
const MIN_TEXT_BOX_HEIGHT = 50;
const MAX_TEXT_BOX_HEIGHT = PREVIEW_STAGE_HEIGHT_RPX - 40;  // 保留底部边距，不超出画页
const DEFAULT_TEXT_BOX_WIDTH = 420;
const DEFAULT_TEXT_BOX_HEIGHT = 140;
const DEFAULT_TEXT_BOX_Y = 280;
const FONT_CDN = 'https://cdn.jsdelivr.net/fontsource/fonts';
const EMPTY_TEXT_PLACEHOLDER = '输入文字...';
const SELECTION_HIGHLIGHT_COLOR = 'rgba(255, 211, 78, 0.56)';
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
  { id: 'hanyi-hongyikai', name: '华康弘一楷书', family: '"DFHongYiKaiShu", "华康弘一楷书", "STKaiti", serif', previewFamily: '"DFHongYiKaiShu", "华康弘一楷书", "STKaiti", serif' },
  { id: 'han-shaojie-hongyi-haier', name: '韩绍杰弘一法师孩儿体', family: '"HanShaoJieHongYiHaiEr", "韩绍杰弘一法师孩儿体", "STKaiti", cursive', previewFamily: '"HanShaoJieHongYiHaiEr", "韩绍杰弘一法师孩儿体", "STKaiti", cursive' },
  { id: 'fz-taishan-jingangjing-lishu', name: '方正泰山金刚经隶书', family: '"FZTaiShanJinGangJingLiShu", "方正泰山金刚经隶书", "STLiti", serif', previewFamily: '"FZTaiShanJinGangJingLiShu", "方正泰山金刚经隶书", "STLiti", serif' },
  { id: 'yixin-bore-song', name: '壹心般若宋', family: '"YiXinBanRuoSong", "壹心般若宋", "Songti SC", serif', previewFamily: '"YiXinBanRuoSong", "壹心般若宋", "Songti SC", serif' },
  { id: 'bore-dakai', name: '般若大楷', family: '"BanRuoDaKai", "般若大楷", "Kaiti SC", serif', previewFamily: '"BanRuoDaKai", "般若大楷", "Kaiti SC", serif' },
  { id: 'zhendian-kaizong-shengdian', name: '真典楷宗圣典楷书', family: '"ZhenDianKaiZongShengDian", "真典楷宗圣典楷书", "Kaiti SC", serif', previewFamily: '"ZhenDianKaiZongShengDian", "真典楷宗圣典楷书", "Kaiti SC", serif' },
  { id: 'fz-badashanren-xingkai', name: '方正八大山人行楷', family: '"FZBaDaShanRenXingKai", "方正八大山人行楷", "STXingkai", cursive', previewFamily: '"FZBaDaShanRenXingKai", "方正八大山人行楷", "STXingkai", cursive' },
  { id: 'hanyi-xianer', name: '汉仪弦二体', family: '"HYXianErTi", "汉仪弦二体", "PingFang SC", sans-serif', previewFamily: '"HYXianErTi", "汉仪弦二体", "PingFang SC", sans-serif' },
  { id: 'fz-zihui-fojun-xingshu', name: '方正字汇佛君行书', family: '"FZZiHuiFoJunXingShu", "方正字汇佛君行书", "STXingkai", cursive', previewFamily: '"FZZiHuiFoJunXingShu", "方正字汇佛君行书", "STXingkai", cursive' },
  { id: 'zhaomengfu-xinjing', name: '赵孟頫心经字库', family: '"ZhaoMengFuXinJing", "赵孟頫心经字库", "STKaiti", serif', previewFamily: '"ZhaoMengFuXinJing", "赵孟頫心经字库", "STKaiti", serif' },
  { id: 'lanmo-runcheng-xingcao', name: '蓝墨润城行草', family: '"LanMoRunChengXingCao", "蓝墨润城行草", "STXingkai", cursive', previewFamily: '"LanMoRunChengXingCao", "蓝墨润城行草", "STXingkai", cursive' },
  { id: 'shanhai-qingchan', name: '山海清禅', family: '"ShanHaiQingChan", "山海清禅", "Kaiti SC", serif', previewFamily: '"ShanHaiQingChan", "山海清禅", "Kaiti SC", serif' },
  { id: 'ziyou-fuchen', name: '字由拂尘', family: '"ZiYouFuChen", "字由拂尘", "STXingkai", cursive', previewFamily: '"ZiYouFuChen", "字由拂尘", "STXingkai", cursive' },
  { id: 'honglei-xingshu', name: '鸿雷行书简体', family: '"HongLeiXingShuJianTi", "鸿雷行书简体", "STXingkai", cursive', previewFamily: '"HongLeiXingShuJianTi", "鸿雷行书简体", "STXingkai", cursive' },
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

function getPreviewScales(design) {
  const designWidth = Number((design && design.size && design.size.width) || 750);
  const designHeight = Number((design && design.size && design.size.height) || 1000);
  const stage = getPreviewStageSize(design);
  return {
    x: stage.width / designWidth,
    y: stage.height / designHeight
  };
}

function getPreviewStageSize(design) {
  const designWidth = Math.max(Number((design && design.size && design.size.width) || 750), 1);
  const designHeight = Math.max(Number((design && design.size && design.size.height) || 1000), 1);
  return {
    width: PREVIEW_STAGE_RPX,
    height: Math.max(1, Math.round(PREVIEW_STAGE_RPX * designHeight / designWidth))
  };
}

function getCenteredBlockX(design, width) {
  const canvasWidth = Number((design && design.size && design.size.width) || 750);
  return Math.max(0, Math.round((canvasWidth - Number(width || DEFAULT_TEXT_BOX_WIDTH)) / 2));
}

function getBackgroundImageLayout(bg, design) {
  const sourceWidth = Number((bg && bg.bgWidth) || 0);
  const sourceHeight = Number((bg && bg.bgHeight) || 0);
  const stage = getPreviewStageSize(design);
  if (!sourceWidth || !sourceHeight) {
    return { width: stage.width, height: stage.height };
  }
  const scale = Math.max(stage.width / sourceWidth, stage.height / sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale))
  };
}

function getBackgroundOffsetBounds(layout, design) {
  const stage = getPreviewStageSize(design);
  const width = Number((layout && layout.width) || stage.width);
  const height = Number((layout && layout.height) || stage.height);
  return {
    x: Math.max(stage.width, Math.round((stage.width + width) / 2)),
    y: Math.max(stage.height, Math.round((stage.height + height) / 2))
  };
}

function clampBackgroundOffset(x, y, layout, design) {
  const bounds = getBackgroundOffsetBounds(layout, design);
  return {
    x: Math.max(-bounds.x, Math.min(bounds.x, Math.round(Number(x || 0)))),
    y: Math.max(-bounds.y, Math.min(bounds.y, Math.round(Number(y || 0))))
  };
}

function normalizeAspectSize(width, height) {
  const w = Math.max(Number(width || 0), 1);
  const h = Math.max(Number(height || 0), 1);
  if (w >= h) return { width: 1000, height: Math.max(1, Math.round(1000 * h / w)) };
  return { width: Math.max(1, Math.round(1000 * w / h)), height: 1000 };
}

function detectCanvasSizeId(size) {
  if (size && size.preset) return size.preset;
  const width = Number((size && size.width) || 0);
  const height = Number((size && size.height) || 0);
  const fixed = CANVAS_SIZE_OPTIONS.find(item => item.width === width && item.height === height);
  return fixed ? fixed.id : 'custom';
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

/**
 * 替换 delta 中指定范围的文本内容，保留原有格式属性
 * @param {Object} delta - 原始 delta
 * @param {number} start - 起始字符位置
 * @param {number} end - 结束字符位置
 * @param {string} newText - 新文本
 * @returns {Object} 新 delta
 */
function replaceTextInDelta(delta, start, end, newText) {
  const sourceOps = (delta && delta.ops && delta.ops.length) ? delta.ops : [{ insert: '', attributes: {} }];
  const total = getDeltaLength(delta);
  const range = normalizeRange(start, end, total);
  if (range.start === range.end && !newText) return delta;

  const ops = [];
  let cursor = 0;
  let inserted = false;
  sourceOps.forEach(op => {
    const text = String(op.insert || '');
    const length = text.length;
    const opStart = cursor;
    const opEnd = cursor + length;
    const baseAttrs = op.attributes || {};

    if (opEnd <= range.start || opStart >= range.end) {
      // 完全在选区外，原样保留
      ops.push({ insert: text, attributes: baseAttrs });
    } else {
      // 与选区有交集：拆分为 前/中(替换)/后 三段
      const localStart = Math.max(range.start - opStart, 0);
      const localEnd = Math.min(range.end - opStart, length);
      const before = text.slice(0, localStart);
      const after = text.slice(localEnd);

      if (before) ops.push({ insert: before, attributes: baseAttrs });
      if (!inserted) {
        ops.push({ insert: newText, attributes: baseAttrs });
        inserted = true;
      }
      if (after) ops.push({ insert: after, attributes: baseAttrs });
    }
    cursor = opEnd;
  });

  // 如果选区超出所有 op 的范围（比如在末尾追加）
  if (!inserted && newText) {
    ops.push({ insert: newText, attributes: (sourceOps[sourceOps.length - 1] && sourceOps[sourceOps.length - 1].attributes) || {} });
  }

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
  const previewScale = block && block._previewScale ? block._previewScale : { x: PREVIEW_SCALE, y: PREVIEW_SCALE };
  const textScale = previewScale.x || PREVIEW_SCALE;
  if (!deltaToText(delta).trim() && block.placeholder) {
    // placeholder 模式：从 delta attrs 中取实际字体大小，确保 slider 调整时同步变化
    const attrs = getFirstTextAttrs(block);
    const actualFontSize = parseInt(attrs.size || attrs.fontSize || block.placeholderSize || 30, 10) || 30;
    const placeholderFontFamily = block.fontFamily || attrs.fontFamily ? `font-family:${block.fontFamily || attrs.fontFamily}` : '';
    const blockLetterSpacing = Math.round(Number(block.letterSpacing || 0) * textScale * 10) / 10;
    return [{
      name: 'div',
      attrs: { style: [`letter-spacing:${blockLetterSpacing}rpx`, placeholderFontFamily].filter(Boolean).join(';') },
      children: [{
        name: 'span',
        attrs: {
          style: [
            `font-size:${Math.max(Math.round(actualFontSize * textScale), 12)}rpx`,
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
  const blockLetterSpacing = Math.round(Number(block.letterSpacing || 0) * textScale * 10) / 10;
  const vertical = isVerticalTextBlock(block);
  ops.forEach(op => {
    const attrs = op.attributes || {};
    const strokeEnabled = typeof attrs.stroke === 'boolean' ? attrs.stroke : !!block.stroke;
    const shadowEnabled = typeof attrs.shadow === 'boolean' ? attrs.shadow : !!block.shadow;
    const parts = String(op.insert || '').split(/(\n)/);
    const fontSize = Math.max(Math.round((parseInt(attrs.size || attrs.fontSize || 30, 10) || 30) * textScale), 12);
    const letterSpacing = Math.round(Number(attrs.letterSpacing || block.letterSpacing || 0) * textScale * 10) / 10;
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
      strokeEnabled ? `-webkit-text-stroke:${Math.max(1, Math.round(Number(attrs.strokeWidth || block.strokeWidth || 2) * textScale))}rpx ${attrs.strokeColor || block.strokeColor || '#FFFFFF'}` : '',
      shadowEnabled ? `text-shadow:${Math.round(Number(attrs.shadowOffsetX || block.shadowOffsetX || 0) * textScale)}rpx ${Math.round(Number(attrs.shadowOffsetY || block.shadowOffsetY || 4) * textScale)}rpx ${Math.round(Number(attrs.shadowBlur || block.shadowBlur || 10) * textScale)}rpx ${attrs.shadowColor || block.shadowColor || 'rgba(72,48,26,0.24)'}` : ''
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

function applyTemporarySelectionHighlight(delta, start, end) {
  return applyAttrsToDeltaRange(
    clone(delta || { ops: [] }),
    start,
    end,
    { background: SELECTION_HIGHLIGHT_COLOR, backgroundColor: SELECTION_HIGHLIGHT_COLOR }
  );
}

function textStyleFromAttrs(attrs, block, textScale, selected) {
  const strokeEnabled = typeof attrs.stroke === 'boolean' ? attrs.stroke : !!block.stroke;
  const shadowEnabled = typeof attrs.shadow === 'boolean' ? attrs.shadow : !!block.shadow;
  const fontSize = Math.max(Math.round((parseInt(attrs.size || attrs.fontSize || 30, 10) || 30) * textScale), 12);
  return [
    `font-size:${fontSize}rpx`,
    `color:${attrs.color || '#4B4038'}`,
    `opacity:${attrs.opacity || 1}`,
    attrs.bold ? 'font-weight:700' : '',
    attrs.italic ? 'font-style:italic' : '',
    attrs.underline ? 'text-decoration:underline' : '',
    selected ? `background:${SELECTION_HIGHLIGHT_COLOR}` : (attrs.background ? `background:${attrs.background}` : ''),
    !selected && attrs.backgroundColor ? `background:${attrs.backgroundColor}` : '',
    (attrs.fontFamily || block.fontFamily) ? `font-family:${attrs.fontFamily || block.fontFamily}` : '',
    strokeEnabled ? `-webkit-text-stroke:${Math.max(1, Math.round(Number(attrs.strokeWidth || block.strokeWidth || 2) * textScale))}rpx ${attrs.strokeColor || block.strokeColor || '#FFFFFF'}` : '',
    shadowEnabled ? `text-shadow:${Math.round(Number(attrs.shadowOffsetX || block.shadowOffsetX || 0) * textScale)}rpx ${Math.round(Number(attrs.shadowOffsetY || block.shadowOffsetY || 4) * textScale)}rpx ${Math.round(Number(attrs.shadowBlur || block.shadowBlur || 10) * textScale)}rpx ${attrs.shadowColor || block.shadowColor || 'rgba(72,48,26,0.24)'}` : ''
  ].filter(Boolean).join(';');
}

function deltaToSelectionFlowNodes(delta, block, start, end) {
  const previewScale = block && block._previewScale ? block._previewScale : { x: PREVIEW_SCALE, y: PREVIEW_SCALE };
  const textScale = previewScale.x || PREVIEW_SCALE;
  const nodes = [];
  let offset = 0;
  let startInserted = false;
  let endInserted = false;

  function insertHandle(handle) {
    nodes.push({ type: 'handle', handle });
  }

  ((delta && delta.ops) || []).forEach(op => {
    const text = String(op.insert || '');
    const attrs = op.attributes || {};
    for (let i = 0; i < text.length; i++) {
      if (!startInserted && offset === start) {
        insertHandle('start');
        startInserted = true;
      }
      if (!endInserted && offset === end) {
        insertHandle('end');
        endInserted = true;
      }
      const selected = offset >= start && offset < end;
      const style = textStyleFromAttrs(attrs, block, textScale, selected);
      const prev = nodes[nodes.length - 1];
      if (prev && prev.type === 'text' && prev.style === style && prev.selected === selected) {
        prev.text += text[i];
      } else {
        nodes.push({ type: 'text', text: text[i], style, selected });
      }
      offset += 1;
    }
  });
  if (!startInserted) insertHandle('start');
  if (!endInserted) insertHandle('end');
  return nodes;
}

function hydrateDesign(design) {
  const copyDesign = clone(design);
  const previewScale = getPreviewScales(copyDesign);
  const textScale = previewScale.x;
  copyDesign.blocks = (copyDesign.blocks || []).map(block => {
    const height = getBlockTextHeight(block);
    const attrs = getFirstTextAttrs(block);
    const fontFamily = block.fontFamily || attrs.fontFamily || '';
    const previewBlock = { ...block, placeholder: block.placeholder || EMPTY_TEXT_PLACEHOLDER, _previewScale: previewScale };
    return {
      ...block,
      placeholder: block.placeholder || EMPTY_TEXT_PLACEHOLDER,
      height,
      previewX: Math.round((block.x || 0) * previewScale.x),
      previewY: Math.round((block.y || 0) * previewScale.y),
      previewWidth: Math.round((block.width || 500) * previewScale.x),
      previewHeight: Math.round(height * previewScale.y),
      previewOverlayHeight: Math.round(height * previewScale.y),
      previewHeightStyle: `height:${Math.round(height * previewScale.y)}rpx;`,
      // 编辑模式锁定高度：用 max(当前高度, 200rpx) 固定，防止 editor 渲染导致 movable-view 尺寸跳动
      editingHeightStyle: `height:${Math.max(Math.round(height * previewScale.y), 200)}rpx;`,
      previewFontFamilyStyle: fontFamily ? `font-family:${fontFamily};` : '',
      previewTransformStyle: block.rotation ? `transform: rotate(${Number(block.rotation || 0)}deg);` : '',
      previewVerticalClass: isVerticalTextBlock(block) ? 'vertical' : '',
      previewFontSizeStyle: `font-size:${Math.round(getBlockFontSize(block) * textScale)}rpx;`,
      previewLetterSpacingStyle: `letter-spacing:${Math.round(Number(block.letterSpacing || 0) * textScale * 10) / 10}rpx;`,
      previewNodes: deltaToNodes(block.delta, previewBlock),
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
    selectionModeActive: false,
    selectionPreviewNodes: [],
    selectionFlowNodes: [],
    selectionRects: [],
    selectionHandleStartX: 24,
    selectionHandleEndX: 96,
    selectionHandleStartY: 42,
    selectionHandleEndY: 42,
    caretVisible: false,
    caretX: 0,
    caretY: 0,
    caretHeight: 36,
    inlineEditing: false,
    selectionStart: 0,
    selectionEnd: 0,
    activePanel: 'background',
    activeStyleTool: 'text',
    textInputFocus: false,
    isIOS: false,
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
    useCanvasPreview: true,
    previewBackground: '#F7F1EA',
    previewBackgroundImage: '',
    nodeVersion: 0,
    bgOffsetX: 0,
    bgOffsetY: 0,
    bgDisplayWidth: PREVIEW_STAGE_RPX,
    bgDisplayHeight: PREVIEW_STAGE_HEIGHT_RPX,
    previewStageWidth: PREVIEW_STAGE_RPX,
    previewStageHeight: PREVIEW_STAGE_HEIGHT_RPX,
    canvasSizeOptions: CANVAS_SIZE_OPTIONS,
    activeCanvasSizeId: 'portrait',
    showColorPicker: false,
    showPasteTip: false,
    selectionHint: '',
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

  /** 保存设计快照到历史栈 */
  _saveHistory(design) {
    design = design || this.data.design;
    if (!design || !design.blocks) return;
    const snapshot = clone(design);
    const key = JSON.stringify(snapshot);
    const current = this._history[this._historyIndex];
    if (current && JSON.stringify(current) === key) return;
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

  _applyHistorySnapshot(snapshot, activeId) {
    const hydrated = hydrateDesign(snapshot);
    const activeBlock = hydrated.blocks.find(item => item.id === activeId) || hydrated.blocks[0] || {};
    const stage = getPreviewStageSize(hydrated);
    const bgLayout = getBackgroundImageLayout(hydrated.background, hydrated);
    this.setData({
      design: hydrated,
      activeBlockId: activeBlock.id || '',
      activeBlock,
      activePlainText: deltaToText(activeBlock.delta),
      selectionModeActive: false,
      selectionPreviewNodes: [],
      selectionFlowNodes: [],
      selectionRects: [],
      caretVisible: false,
      inlineEditing: false,
      selectionStart: 0,
      selectionEnd: 0,
      textInputFocus: false,
      showPasteTip: false,
      ...getTextPanelState(activeBlock, this.data),
      previewBackground: this.getPreviewBackground(hydrated.background),
      previewBackgroundImage: this.getPreviewBackgroundImage(hydrated.background) || this.data.previewBackgroundImage,
      previewBlurStyle: this.getPreviewBlurStyle(hydrated.background),
      bgOffsetX: (hydrated.background && hydrated.background.offsetX) || 0,
      bgOffsetY: (hydrated.background && hydrated.background.offsetY) || 0,
      bgDisplayWidth: bgLayout.width,
      bgDisplayHeight: bgLayout.height,
      previewStageWidth: stage.width,
      previewStageHeight: stage.height,
      activeCanvasSizeId: detectCanvasSizeId(hydrated.size)
    }, () => this.schedulePreviewRender(0));
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
      const currentActiveId = this.data.activeBlockId;
      const activeId = (prevDesign.blocks || []).some(item => item.id === currentActiveId)
        ? currentActiveId
        : (prevDesign.blocks && prevDesign.blocks[0] ? prevDesign.blocks[0].id : '');
      this._applyHistorySnapshot(prevDesign, activeId);
      wx.showToast({ title: '已撤销', icon: 'none' });
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
      const currentActiveId = this.data.activeBlockId;
      const activeId = (nextDesign.blocks || []).some(item => item.id === currentActiveId)
        ? currentActiveId
        : (nextDesign.blocks && nextDesign.blocks[0] ? nextDesign.blocks[0].id : '');
      this._applyHistorySnapshot(nextDesign, activeId);
      wx.showToast({ title: '已重做', icon: 'none' });
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

  schedulePreviewRender(delay) {
    if (!this.data.useCanvasPreview) return;
    clearTimeout(this._previewRenderTimer);
    this._previewRenderTimer = setTimeout(() => this.renderPreviewCanvas(), typeof delay === 'number' ? delay : 80);
  },

  async renderPreviewCanvas() {
    if (!this.data.useCanvasPreview || !this.data.design) return;
    try {
      await renderer.drawPosterToCanvas(this, '#previewCanvas', this.data.design, {
        scale: 1,
        dpr: 1,
        preloadFonts: false
      });
    } catch (e) {
      console.warn('预览画布渲染失败', e);
    }
  },

  onLoad(query) {
    try {
      const info = wx.getSystemInfoSync();
      const platform = String(info.platform || info.system || '').toLowerCase();
      this.setData({ isIOS: platform.indexOf('ios') >= 0 });
    } catch (e) {}
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
  },

  onReady() {
    this.schedulePreviewRender(0);
  },

  setDesign(design, activeId) {
    const hydrated = hydrateDesign(design);
    const activeBlock = hydrated.blocks.find(item => item.id === activeId) || hydrated.blocks[0] || {};
    const stage = getPreviewStageSize(hydrated);
    const bgLayout = getBackgroundImageLayout(hydrated.background, hydrated);
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
      selectionModeActive: false,
      selectionPreviewNodes: [],
      selectionFlowNodes: [],
      selectionRects: [],
      selectionStart: 0,
      selectionEnd: 0,
      textInputFocus: false,
      caretVisible: false,
      ...getTextPanelState(activeBlock, this.data),
      inputText: hydrated.inputText || this.data.inputText,
      previewBackground: this.getPreviewBackground(hydrated.background),
      // 保护背景图：新设计有图则用新的，否则保留当前已有的
      previewBackgroundImage: (this.getPreviewBackgroundImage(hydrated.background) || this.data.previewBackgroundImage),
      previewBlurStyle: this.getPreviewBlurStyle(hydrated.background),
      bgOffsetX: (hydrated.background && hydrated.background.offsetX) || 0,
      bgOffsetY: (hydrated.background && hydrated.background.offsetY) || 0,
      bgDisplayWidth: bgLayout.width,
      bgDisplayHeight: bgLayout.height,
      previewStageWidth: stage.width,
      previewStageHeight: stage.height,
      activeCanvasSizeId: detectCanvasSizeId(hydrated.size)
    }, () => this.schedulePreviewRender(0));
    this._saveHistory(hydrated);
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

  setCanvasSize(e) {
    const id = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || 'portrait';
    const option = CANVAS_SIZE_OPTIONS.find(item => item.id === id) || CANVAS_SIZE_OPTIONS[0];
    const design = clone(this.data.design);
    const oldSize = design.size || { width: 750, height: 1000 };
    let nextSize;
    if (id === 'image') {
      const bg = design.background || {};
      if (!bg.bgWidth || !bg.bgHeight) {
        wx.showToast({ title: '请先选择背景图', icon: 'none' });
        return;
      }
      nextSize = normalizeAspectSize(bg.bgWidth, bg.bgHeight);
    } else {
      nextSize = { width: option.width, height: option.height };
    }
    const oldWidth = Math.max(Number(oldSize.width || 750), 1);
    const oldHeight = Math.max(Number(oldSize.height || 1000), 1);
    const scaleX = nextSize.width / oldWidth;
    const scaleY = nextSize.height / oldHeight;
    design.size = { ...nextSize, preset: id };
    design.blocks = (design.blocks || []).map(block => ({
      ...block,
      x: Math.round(Number(block.x || 0) * scaleX),
      y: Math.round(Number(block.y || 0) * scaleY),
      width: Math.max(MIN_TEXT_BOX_WIDTH, Math.round(Number(block.width || DEFAULT_TEXT_BOX_WIDTH) * scaleX)),
      height: block.height ? Math.max(MIN_TEXT_BOX_HEIGHT, Math.round(Number(block.height || DEFAULT_TEXT_BOX_HEIGHT) * scaleY)) : block.height,
      manualHeight: block.manualHeight ? Math.max(MIN_TEXT_BOX_HEIGHT, Math.round(Number(block.manualHeight || DEFAULT_TEXT_BOX_HEIGHT) * scaleY)) : block.manualHeight
    }));
    if (design.qrcode) {
      design.qrcode = {
        ...design.qrcode,
        x: Math.round(Number(design.qrcode.x || 0) * scaleX),
        y: Math.round(Number(design.qrcode.y || 0) * scaleY),
        size: Math.max(40, Math.round(Number(design.qrcode.size || 110) * Math.min(scaleX, scaleY)))
      };
    }
    design.decorations = (design.decorations || []).map(item => ({
      ...item,
      x: Math.round(Number(item.x || 0) * scaleX),
      y: Math.round(Number(item.y || 0) * scaleY),
      width: item.width ? Math.round(Number(item.width || 0) * scaleX) : item.width
    }));
    if (design.background) {
      design.background.offsetX = 0;
      design.background.offsetY = 0;
    }
    this.setDesign(design, this.data.activeBlockId);
  },

  onActiveTextInput(e) {
    this._manualTextSelection = null;
    this.exitSelectionMode();
    this._typingHistoryStarted = true;
    const text = e.detail.value || '';
    const block = this.data.activeBlock || {};
    const firstAttrs = block.delta && block.delta.ops && block.delta.ops[0] ? (block.delta.ops[0].attributes || {}) : {};
    // 输入时：直接用当前文字创建干净的单 op delta
    // （格式由底部面板统一控制，不需要保留多 op 结构）
    const delta = { ops: [{ insert: text, attributes: firstAttrs }] };
    const cursor = typeof e.detail.cursor === 'number' ? e.detail.cursor : text.length;
    const newNodeVer = (this.data.nodeVersion || 0) + 1;
    const caretState = this.getCaretState(cursor, text, { ...block, delta, _previewScale: getPreviewScales(this.data.design) });
    this.setData({
      activePlainText: text,
      inputText: text,
      selectionStart: cursor,
      selectionEnd: cursor,
      showPasteTip: false,
      nodeVersion: newNodeVer,
      ...caretState
    });
    this.updateActiveBlock({ delta }, { silentEditor: true });
    this.schedulePreviewRender(150); // 输入后延迟刷新 canvas 预览
  },

  onTextSelection(e) {
    const detail = e.detail || {};
    const start = typeof detail.selectionStart === 'number' ? detail.selectionStart : detail.cursor;
    const end = typeof detail.selectionEnd === 'number' ? detail.selectionEnd : detail.cursor;
    if (typeof start !== 'number') return;
    const nextEnd = typeof end === 'number' ? end : start;
    if (hasTextSelection(start, nextEnd)) {
      this._manualTextSelection = { start, end: nextEnd };
    }
    this.setData({
      selectionStart: start,
      selectionEnd: nextEnd,
      selectionHint: hasTextSelection(start, nextEnd) ? '已选中文字' : this.data.selectionHint
    });
  },

  // textarea 获得焦点时：自动全选 + 弹出工具栏
  onTextareaFocus(e) {
    const text = this.data.activePlainText || '';
    const pendingSelection = this._pendingTextareaSelection;
    if (pendingSelection) {
      this._pendingTextareaSelection = null;
      setTimeout(() => {
        this.setData({
          textInputFocus: true,
          showPasteTip: !!pendingSelection.showPasteTip,
          selectionStart: pendingSelection.start,
          selectionEnd: pendingSelection.end,
          selectionHint: pendingSelection.hint || ''
        });
      }, 80);
      return;
    }
    // 延迟设置选区，等 textarea 完成聚焦
    setTimeout(() => {
      this.setData({
        textInputFocus: true,
        showPasteTip: true,
        selectionStart: 0,
        selectionEnd: text.length,
        selectionHint: text ? '已全选' : ''
      });
    }, 150);
  },

  onStageEditorTap() {
    if (this._skipNextEditorTap) {
      this._skipNextEditorTap = false;
      return;
    }
    this.openFormatMenu();
  },

  onStageEditorTouchEnd() {
    this._skipNextEditorTap = true;
    this.openFormatMenu();
  },

  showPasteTip() {
    this._lastStageEditorTap = 0;
    this._skipNextEditorTap = true;
    this.openFormatMenu();
  },

  handleStageEditorDoubleTap() {
    const now = Date.now();
    const lastTap = Number(this._lastStageEditorTap || 0);
    this._lastStageEditorTap = now;
    if (now - lastTap > 360) {
      if (this.data.showPasteTip) this.setData({ showPasteTip: false });
      return;
    }
    this._lastStageEditorTap = 0;
    this.openFormatMenu();
  },

  openFormatMenu() {
    clearTimeout(this._emptyFormatMenuTimer);
    this.setData({ showPasteTip: true, textInputFocus: true });
  },

  pasteClipboardToActiveText(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (this.shouldSkipFormatAction('paste')) return;
    this._ignoreNextEditorBlur = true;
    this.setData({ textInputFocus: false });
    wx.getClipboardData({
      success: res => {
        const insertText = String((res && res.data) || '');
        if (!insertText) {
          wx.showToast({ title: '剪贴板为空', icon: 'none' });
          return;
        }
        this.replaceActiveTextSelection(insertText);
        this._saveHistory(this.data.design);
        wx.showToast({ title: '已粘贴', icon: 'none', duration: 600 });
        this.schedulePreviewRender(0); // 粘贴后立即刷新 canvas 预览
      },
      fail: () => wx.showToast({ title: '读取剪贴板失败，请用系统粘贴', icon: 'none' }),
      complete: () => {
        setTimeout(() => {
          this.setData({ textInputFocus: !this.data.isIOS });
        }, 80);
      }
    });
  },

  shouldSkipFormatAction(name) {
    const now = Date.now();
    const key = `_lastFormatAction_${name}`;
    if (now - Number(this[key] || 0) < 250) return true;
    this[key] = now;
    this._ignoreNextEditorBlur = true;
    return false;
  },

  getActiveTextSelectionRange(text) {
    const current = String(text || '');
    const max = current.length;
    const manual = this._manualTextSelection;
    if (manual && hasTextSelection(manual.start, manual.end)) {
      const start = Math.max(0, Math.min(manual.start, manual.end, max));
      const end = Math.max(start, Math.min(Math.max(manual.start, manual.end), max));
      if (end > start) return { start, end, manual: true };
    }
    const rawStart = typeof this.data.selectionStart === 'number' ? this.data.selectionStart : max;
    const rawEnd = typeof this.data.selectionEnd === 'number' ? this.data.selectionEnd : rawStart;
    const start = Math.max(0, Math.min(rawStart, rawEnd, max));
    const end = Math.max(start, Math.min(Math.max(rawStart, rawEnd), max));
    return { start, end, manual: false };
  },

  hasActiveTextSelection() {
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
    return hasTextSelection(range.start, range.end);
  },

  estimateSelectionCharWidth(ch, fontSize) {
    if (!ch) return 0;
    if (/[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]/.test(ch)) return fontSize;
    if (/\s/.test(ch)) return fontSize * 0.34;
    if (/[ilI.,:;!|]/.test(ch)) return fontSize * 0.32;
    if (/[mwMW@#%&]/.test(ch)) return fontSize * 0.82;
    return fontSize * 0.58;
  },

  getSelectionLayout(text, blockOverride) {
    const block = blockOverride || this.data.activeBlock || {};
    const width = Math.max(Number(block.previewWidth || Math.round(Number(block.width || DEFAULT_TEXT_BOX_WIDTH) * PREVIEW_SCALE)) || 0, 120);
    const padX = 0;
    const padY = 0;
    const usable = Math.max(width - padX * 2, 40);
    const fontSize = Math.max(Math.round(getBlockFontSize(block) * getPreviewScales(this.data.design).x), 12);
    const lineHeight = Math.max(fontSize * Number(block.lineHeight || 1.6), fontSize + 6);
    const align = block.align || 'left';
    const value = String(text || '');
    const lines = [];
    let current = { chars: [], width: 0, startIndex: 0 };
    for (let i = 0; i < value.length; i++) {
      const ch = value[i];
      if (ch === '\n') {
        lines.push(current);
        current = { chars: [], width: 0, startIndex: i + 1 };
        continue;
      }
      const chWidth = Math.max(this.estimateSelectionCharWidth(ch, fontSize), 1);
      if (current.chars.length && current.width + chWidth > usable) {
        lines.push(current);
        current = { chars: [], width: 0, startIndex: i };
      }
      current.chars.push({ index: i, width: chWidth });
      current.width += chWidth;
    }
    if (current.chars.length || !lines.length || value.endsWith('\n')) lines.push(current);

    const offsets = [];
    lines.forEach((item, line) => {
      let offsetX = padX;
      if (align === 'center') offsetX = padX + Math.max((usable - item.width) / 2, 0);
      if (align === 'right') offsetX = padX + Math.max(usable - item.width, 0);
      let x = offsetX;
      const y = padY + line * lineHeight;
      offsets[item.startIndex] = { index: item.startIndex, x, y, line };
      item.chars.forEach(ch => {
        x += ch.width;
        offsets[ch.index + 1] = { index: ch.index + 1, x, y, line };
      });
    });

    return {
      offsets,
      lines,
      padX,
      usable,
      fontSize,
      lineHeight
    };
  },

  getCaretState(cursor, text, blockOverride) {
    const value = String(text || '');
    const layout = this.getSelectionLayout(value, blockOverride);
    const max = value.length;
    const index = Math.max(0, Math.min(Number(cursor || 0), max));
    let pos = layout.offsets[index];
    if (!pos) {
      for (let i = index; i >= 0; i--) {
        if (layout.offsets[i]) {
          pos = layout.offsets[i];
          break;
        }
      }
    }
    pos = pos || layout.offsets[0] || { x: layout.padX || 0, y: 0, line: 0 };
    const top = Math.round(Number(pos.y || 0) + Math.max((layout.lineHeight - layout.fontSize) / 2, 0));
    const height = Math.max(Math.round(layout.fontSize + 8), 20);
    return {
      caretVisible: true,
      caretX: Math.round(Number(pos.x || 0)),
      caretY: top,
      caretHeight: height
    };
  },

  getSelectionHandlePositions(start, end, textLength, blockOverride) {
    const text = String(this.data.activePlainText || '').slice(0, Math.max(Number(textLength || 0), 0));
    const layout = this.getSelectionLayout(text, blockOverride);
    const max = Math.max(text.length, 0);
    const startIndex = Math.max(0, Math.min(start, max));
    const endIndex = Math.max(0, Math.min(end, max));
    const startPos = layout.offsets[startIndex] || layout.offsets[0];
    const endPos = layout.offsets[endIndex] || layout.offsets[layout.offsets.length - 1] || startPos;
    return {
      startX: Math.round(startPos.x),
      endX: Math.round(endPos.x),
      startY: Math.round(startPos.y + layout.fontSize + 4),
      endY: Math.round(endPos.y + layout.fontSize + 4),
      startLine: startPos.line || 0,
      endLine: endPos.line || 0
    };
  },

  getSelectionRects(start, end, textLength, blockOverride) {
    const text = String(this.data.activePlainText || '').slice(0, Math.max(Number(textLength || 0), 0));
    const layout = this.getSelectionLayout(text, blockOverride);
    const rangeStart = Math.max(0, Math.min(start, end, text.length));
    const rangeEnd = Math.max(rangeStart + 1, Math.min(Math.max(start, end), text.length));
    const rects = [];
    const lines = {};
    for (let i = rangeStart; i < rangeEnd; i++) {
      const from = layout.offsets[i];
      const to = layout.offsets[i + 1];
      if (!from || !to) continue;
      const line = from.line || 0;
      if (!lines[line]) lines[line] = { left: from.x, right: to.x, y: from.y };
      lines[line].left = Math.min(lines[line].left, from.x);
      lines[line].right = Math.max(lines[line].right, to.x);
      lines[line].y = from.y;
    }
    Object.keys(lines).forEach(key => {
      const item = lines[key];
      const left = Math.round(item.left);
      const top = Math.round(item.y + Math.max((layout.lineHeight - layout.fontSize) / 2, 0));
      const width = Math.max(Math.round(item.right - item.left), 4);
      const height = Math.max(Math.round(layout.fontSize + 6), 18);
      rects.push({
        style: `left:${left}rpx;top:${top}rpx;width:${width}rpx;height:${height}rpx;`
      });
    });
    return rects;
  },

  getSelectionIndexFromPoint(x, line) {
    const text = this.data.activePlainText || '';
    const layout = this.getSelectionLayout(text);
    const targetLine = Math.max(0, Number(line || 0));
    let best = layout.offsets[0] || { index: 0, x: layout.padX, line: 0 };
    let bestDistance = Infinity;
    layout.offsets.forEach(pos => {
      if ((pos.line || 0) !== targetLine) return;
      const distance = Math.abs(Number(pos.x || 0) - x);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = pos;
      }
    });
    return Math.max(0, Math.min(best.index || 0, text.length));
  },

  getRpxPerPx() {
    try {
      return 750 / (wx.getSystemInfoSync().windowWidth || 750);
    } catch (e) {
      return 1;
    }
  },

  enterSelectionMode(start, end, hint) {
    const text = this.data.activePlainText || '';
    if (!text) {
      this.setData({ textInputFocus: true, showPasteTip: true, selectionHint: '' });
      return;
    }
    const max = text.length;
    const rangeStart = Math.max(0, Math.min(start, end, max));
    const rangeEnd = Math.max(rangeStart + 1, Math.min(Math.max(start, end), max));
    const block = this.data.activeBlock || {};
    const highlightedDelta = applyTemporarySelectionHighlight(block.delta, rangeStart, rangeEnd);
    const previewBlock = { ...block, _previewScale: getPreviewScales(this.data.design) };
    const handles = this.getSelectionHandlePositions(rangeStart, rangeEnd, max, previewBlock);
    const selectionRects = this.getSelectionRects(rangeStart, rangeEnd, max, previewBlock);
    this._manualTextSelection = { start: rangeStart, end: rangeEnd };
    this.setData({
      textInputFocus: false,
      selectionModeActive: true,
      caretVisible: false,
      selectionPreviewNodes: deltaToNodes(highlightedDelta, previewBlock),
      selectionFlowNodes: deltaToSelectionFlowNodes(block.delta, previewBlock, rangeStart, rangeEnd),
      selectionRects,
      selectionHandleStartX: handles.startX,
      selectionHandleEndX: handles.endX,
      selectionHandleStartY: handles.startY,
      selectionHandleEndY: handles.endY,
      selectionStart: rangeStart,
      selectionEnd: rangeEnd,
      showPasteTip: true,
      selectionHint: hint || `已选中 ${rangeEnd - rangeStart} 个字`
    });
  },

  refreshSelectionPreview(delta, start, end, hint, blockPatch) {
    const text = this.data.activePlainText || deltaToText(delta);
    const max = text.length;
    const rangeStart = Math.max(0, Math.min(start, end, max));
    const rangeEnd = Math.max(rangeStart + 1, Math.min(Math.max(start, end), max));
    const block = { ...(this.data.activeBlock || {}), ...(blockPatch || {}), delta };
    const highlightedDelta = applyTemporarySelectionHighlight(delta, rangeStart, rangeEnd);
    const previewBlock = { ...block, _previewScale: getPreviewScales(this.data.design) };
    const handles = this.getSelectionHandlePositions(rangeStart, rangeEnd, max, previewBlock);
    const selectionRects = this.getSelectionRects(rangeStart, rangeEnd, max, previewBlock);
    this._manualTextSelection = { start: rangeStart, end: rangeEnd };
    this.setData({
      textInputFocus: false,
      selectionModeActive: true,
      caretVisible: false,
      selectionPreviewNodes: deltaToNodes(highlightedDelta, previewBlock),
      selectionFlowNodes: deltaToSelectionFlowNodes(delta, previewBlock, rangeStart, rangeEnd),
      selectionRects,
      selectionHandleStartX: handles.startX,
      selectionHandleEndX: handles.endX,
      selectionHandleStartY: handles.startY,
      selectionHandleEndY: handles.endY,
      selectionStart: rangeStart,
      selectionEnd: rangeEnd,
      showPasteTip: true,
      selectionHint: hint || this.data.selectionHint || `已选中 ${rangeEnd - rangeStart} 个字`
    });
  },

  exitSelectionMode() {
    this._selectionDrag = null;
    if (this.data.selectionModeActive || (this.data.selectionPreviewNodes || []).length || (this.data.selectionFlowNodes || []).length) {
      this.setData({
        selectionModeActive: false,
        selectionPreviewNodes: [],
        selectionFlowNodes: [],
        selectionRects: [],
        caretVisible: false
      });
    }
  },

  returnToTypingFromSelectionMode() {
    const end = typeof this.data.selectionEnd === 'number' ? this.data.selectionEnd : (this.data.activePlainText || '').length;
    this._manualTextSelection = null;
    this.exitSelectionMode();
    this.setData({
      textInputFocus: true,
      selectionStart: end,
      selectionEnd: end,
      showPasteTip: true,
      selectionHint: '',
      ...this.getCaretState(end, this.data.activePlainText || '', this.data.activeBlock || {})
    });
  },

  onSelectionHandleStart(e) {
    const handle = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.handle) || 'end';
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const block = this.data.activeBlock || {};
    const width = Math.max(Number(block.previewWidth || Math.round(Number(block.width || DEFAULT_TEXT_BOX_WIDTH) * PREVIEW_SCALE)) || 0, 120);
    const currentPos = this.getSelectionHandlePositions(
      Number(this.data.selectionStart || 0),
      Number(this.data.selectionEnd || 0),
      (this.data.activePlainText || '').length
    );
    this._selectionDrag = {
      handle,
      startClientX: touch.clientX,
      startIndex: handle === 'start' ? Number(this.data.selectionStart || 0) : Number(this.data.selectionEnd || 0),
      line: handle === 'start' ? currentPos.startLine : currentPos.endLine,
      width
    };
  },

  onSelectionHandleMove(e) {
    if (!this._selectionDrag) return;
    const touch = e.touches && e.touches[0];
    const text = this.data.activePlainText || '';
    if (!touch || !text) return;
    const drag = this._selectionDrag;
    const currentPos = this.getSelectionHandlePositions(
      Number(this.data.selectionStart || 0),
      Number(this.data.selectionEnd || 0),
      text.length
    );
    const baseX = drag.handle === 'start' ? currentPos.startX : currentPos.endX;
    const dxRpx = (touch.clientX - drag.startClientX) * this.getRpxPerPx();
    const index = this.getSelectionIndexFromPoint(baseX + dxRpx, drag.line);
    let start = Number(this.data.selectionStart || 0);
    let end = Number(this.data.selectionEnd || 0);
    if (drag.handle === 'start') start = Math.min(index, end - 1);
    else end = Math.max(index, start + 1);
    this.enterSelectionMode(start, end, `已选中 ${Math.max(end - start, 0)} 个字`);
    this._selectionDrag = { ...drag, startClientX: touch.clientX };
  },

  onSelectionHandleEnd() {
    this._selectionDrag = null;
  },

  replaceActiveTextSelection(insertText) {
    const current = this.data.activePlainText || '';
    const range = this.getActiveTextSelectionRange(current);
    const start = range.start;
    const end = range.end;
    const text = current.slice(0, start) + String(insertText || '') + current.slice(end);
    const cursor = start + String(insertText || '').length;

    // 粘贴时：用完整文本创建干净的单 op delta，避免多 op 重叠
    const block = this.data.activeBlock || {};
    const firstAttrs = block.delta && block.delta.ops && block.delta.ops[0] ? (block.delta.ops[0].attributes || {}) : {};
    const delta = { ops: [{ insert: text, attributes: firstAttrs }] };
    const caretState = this.getCaretState(cursor, text, { ...block, delta, _previewScale: getPreviewScales(this.data.design) });

    this._manualTextSelection = null;
    this.exitSelectionMode();
    const newNodeVer = (this.data.nodeVersion || 0) + 1;
    this.setData({
      activePlainText: text,
      inputText: text,
      textInputFocus: false,
      selectionStart: cursor,
      selectionEnd: cursor,
      showPasteTip: true,
      selectionHint: '',
      nodeVersion: newNodeVer,
      ...caretState
    });
    this.updateActiveBlock({ delta }, { silentEditor: true });
    setTimeout(() => {
      const nextBlock = { ...(this.data.activeBlock || {}), delta, _previewScale: getPreviewScales(this.data.design) };
      this.setData({
        activePlainText: text,
        textInputFocus: !this.data.isIOS,
        selectionStart: cursor,
        selectionEnd: cursor,
        ...this.getCaretState(cursor, text, nextBlock)
      }, () => this.schedulePreviewRender(0));
    }, 30);
  },

  selectAllActiveText(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (this.shouldSkipFormatAction('selectAll')) return;
    const text = this.data.activePlainText || '';
    if (!text) {
      wx.showToast({ title: '没有可选择的文字', icon: 'none' });
      return;
    }
    this.enterSelectionMode(0, text.length, `已选中全部 ${text.length} 个字`);
    wx.showToast({ title: '已全选', icon: 'none', duration: 600 });
  },

  selectCurrentLineText(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (this.shouldSkipFormatAction('selectLine')) return;
    const text = this.data.activePlainText || '';
    if (!text) {
      this.setData({
        textInputFocus: true,
        showPasteTip: true,
        selectionHint: ''
      });
      wx.showToast({ title: '没有可选择的文字', icon: 'none' });
      return;
    }
    const rawCursor = typeof this.data.selectionEnd === 'number'
      ? this.data.selectionEnd
      : (typeof this.data.selectionStart === 'number' ? this.data.selectionStart : text.length);
    const cursor = Math.max(0, Math.min(rawCursor, text.length));
    const selectionLength = Math.min(4, text.length);
    const start = Math.min(cursor, Math.max(0, text.length - selectionLength));
    const end = Math.min(text.length, start + selectionLength);
    const selectedText = text.slice(start, end);
    const hint = end > start ? `已选中 ${end - start} 个字：${selectedText}` : '';
    this.enterSelectionMode(start, end, hint);
    wx.showToast({ title: '已选择', icon: 'none', duration: 600 });
  },

  selectTextBeforeCursor() {
    if (this.shouldSkipFormatAction('selectBefore')) return;
    const text = this.data.activePlainText || '';
    const cursor = Math.max(0, Math.min(Number(this.data.selectionEnd || this.data.selectionStart || text.length), text.length));
    this.setData({
      textInputFocus: true,
      selectionStart: 0,
      selectionEnd: cursor,
      showPasteTip: true,
      selectionHint: cursor ? '已选前半段' : ''
    });
  },

  selectTextAfterCursor() {
    if (this.shouldSkipFormatAction('selectAfter')) return;
    const text = this.data.activePlainText || '';
    const cursor = Math.max(0, Math.min(Number(this.data.selectionEnd || this.data.selectionStart || 0), text.length));
    this.setData({
      textInputFocus: true,
      selectionStart: cursor,
      selectionEnd: text.length,
      showPasteTip: true,
      selectionHint: cursor < text.length ? '已选后半段' : ''
    });
  },

  deleteSelectedText() {
    if (this.shouldSkipFormatAction('delete')) return;
    const current = this.data.activePlainText || '';
    const range = this.getActiveTextSelectionRange(current);
    let start = range.start;
    let end = range.end;
    if (start === end && start > 0) start -= 1;
    const text = current.slice(0, start) + current.slice(end);
    const attrs = getAttrsAtOffset(this.data.activeBlock && this.data.activeBlock.delta, start) || getFirstTextAttrs(this.data.activeBlock || {});
    this._manualTextSelection = null;
    this.exitSelectionMode();
    this.setData({
      activePlainText: text,
      inputText: text,
      textInputFocus: true,
      selectionStart: start,
      selectionEnd: start,
      showPasteTip: true,
      selectionHint: ''
    });
    this.updateActiveBlock({ delta: { ops: [{ insert: text, attributes: attrs }] } }, { silentEditor: true });
    this._saveHistory(this.data.design);
  },

  toggleSelectedBold() {
    if (this.shouldSkipFormatAction('bold')) return;
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || '');
    if (!hasTextSelection(range.start, range.end)) {
      wx.showToast({ title: '请先选择文字', icon: 'none' });
      this.setData({ textInputFocus: true, showPasteTip: true });
      return;
    }
    const attrs = getAttrsAtOffset(this.data.activeBlock && this.data.activeBlock.delta, range.start || 0);
    const bold = !attrs.bold;
    this.applyFormatToSelection({ bold });
    this.setData({ formats: { ...(this.data.formats || {}), bold }, textInputFocus: false, showPasteTip: true });
    this._saveHistory(this.data.design);
  },

  increaseSelectedFontSize() {
    if (this.shouldSkipFormatAction('fontSize')) return;
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || '');
    if (!hasTextSelection(range.start, range.end)) {
      wx.showToast({ title: '请先选择文字', icon: 'none' });
      this.setData({ textInputFocus: true, showPasteTip: true });
      return;
    }
    const attrs = getAttrsAtOffset(this.data.activeBlock && this.data.activeBlock.delta, range.start || 0);
    const fontSize = clampFontSize((parseInt(attrs.size || attrs.fontSize || this.data.fontSize || 32, 10) || 32) + 4);
    this.setData({ fontSize, textInputFocus: false, showPasteTip: true });
    this.applyFormatToSelection({ size: fontSize, fontSize });
    this._saveHistory(this.data.design);
  },

  decreaseSelectedFontSize() {
    if (this.shouldSkipFormatAction('fontSizeDown')) return;
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || '');
    if (!hasTextSelection(range.start, range.end)) {
      wx.showToast({ title: '请先选择文字', icon: 'none' });
      this.setData({ textInputFocus: true, showPasteTip: true });
      return;
    }
    const attrs = getAttrsAtOffset(this.data.activeBlock && this.data.activeBlock.delta, range.start || 0);
    const fontSize = clampFontSize((parseInt(attrs.size || attrs.fontSize || this.data.fontSize || 32, 10) || 32) - 4);
    this.setData({ fontSize, textInputFocus: false, showPasteTip: true });
    this.applyFormatToSelection({ size: fontSize, fontSize });
    this._saveHistory(this.data.design);
  },

  showFontPanelForSelection() {
    if (this.shouldSkipFormatAction('fontPanel')) return;
    this.setData({ activePanel: 'font', textInputFocus: true, showPasteTip: true });
    setTimeout(() => this.preloadVisibleFonts(), 80);
  },

  showColorPanelForSelection() {
    if (this.shouldSkipFormatAction('colorPanel')) return;
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
    if (!hasTextSelection(range.start, range.end)) {
      wx.showToast({ title: '请先选择文字', icon: 'none' });
      this.setData({ textInputFocus: true, showPasteTip: true });
      return;
    }
    const attrs = getAttrsAtOffset(this.data.activeBlock && this.data.activeBlock.delta, range.start || 0);
    this.setData({ activePanel: 'style', activeStyleTool: 'text', textInputFocus: false, showPasteTip: true });
    this.openColorPicker('text', attrs.color || this.data.activeTextColor || '#4B4038', '文字颜色');
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
    clearTimeout(this._emptyFormatMenuTimer);
    if (this._ignoreNextEditorBlur) {
      this._ignoreNextEditorBlur = false;
      return;
    }
    this.editorCtx = null;
    this._manualTextSelection = null;
    this.setData({
      inlineEditing: false,
      textInputFocus: false,
      showPasteTip: false,
      selectionModeActive: false,
      selectionPreviewNodes: [],
      selectionFlowNodes: [],
      selectionRects: [],
      caretVisible: false
    });
    if (this._typingHistoryStarted) {
      this._typingHistoryStarted = false;
      this._saveHistory(this.data.design);
    }
  },

  keepInlineEditing() {
    if (!this.data.inlineEditing) return;
    this._ignoreNextEditorBlur = true;
  },

  finishInlineEditingFromMenu() {
    clearTimeout(this._emptyFormatMenuTimer);
    if (this.shouldSkipFormatAction('done')) return;
    this._ignoreNextEditorBlur = false;
    this.editorCtx = null;
    this._manualTextSelection = null;
    this.setData({
      inlineEditing: false,
      textInputFocus: false,
      showPasteTip: false,
      selectionModeActive: false,
      selectionPreviewNodes: [],
      selectionFlowNodes: [],
      selectionRects: [],
      caretVisible: false,
      selectionHint: ''
    });
    if (this._typingHistoryStarted) {
      this._typingHistoryStarted = false;
      this._saveHistory(this.data.design);
    }
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
    const text = deltaToText(block && block.delta);
    const caretState = this.getCaretState(end, text, { ...(block || {}), _previewScale: getPreviewScales(this.data.design) });

    this.setData({
      activeBlockId: id,
      activeBlock: block || {},
      activePlainText: text,
      selectionModeActive: false,
      selectionPreviewNodes: [],
      selectionFlowNodes: [],
      selectionRects: [],
      textInputFocus: true,
      inlineEditing: true,
      selectionStart: end,
      selectionEnd: end,
      ...caretState,
      ...getTextPanelState(block, this.data)
    });
    this.openFormatMenu();
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
      }, () => this.schedulePreviewRender(options && typeof options.renderDelay === 'number' ? options.renderDelay : undefined));
      return;
    }
    this.setDesign(design, design.blocks[index].id);
  },

  onBlockTouchStart(e) {
    if (this.data.inlineEditing) return;
    const id = e.currentTarget.dataset.id || '';
    const block = (this.data.design.blocks || []).find(item => item.id === id);
    const touches = e.touches || [];
    if (touches.length >= 2 && block) {
      this.startBlockPinchResize(block, touches);
      this._dragBlockId = id;
      this._dragMoved = true;
      return;
    }
    this._dragBlockId = id;
    this._dragMoved = false;
    const touch = touches[0];
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
    const touches = e.touches || [];
    if (this.resizeState && this.resizeState.fromBlockPinch) {
      this.onResizeMove(e);
      this._dragMoved = true;
      return;
    }
    if (touches.length >= 2) {
      const id = this._dragBlockId || (e.currentTarget.dataset.id || '');
      const block = (this.data.design.blocks || []).find(item => item.id === id);
      if (block) {
        this.startBlockPinchResize(block, touches);
        this.onResizeMove(e);
        this._dragMoved = true;
      }
      return;
    }
    const touch = touches[0];
    if (!touch) return;
    const id = this._dragBlockId || (e.currentTarget.dataset.id || '');
    if (!id) return;
    let rpxPerPx = 1;
    try { rpxPerPx = 750 / (wx.getSystemInfoSync().windowWidth || 750); } catch (err) {}
    const dx = (touch.clientX - (this._dragStartX || touch.clientX)) * rpxPerPx;
    const dy = (touch.clientY - (this._dragStartY || touch.clientY)) * rpxPerPx;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) this._dragMoved = true;

    const previewScale = getPreviewScales(this.data.design);
    const stage = getPreviewStageSize(this.data.design);
    const blocks = (this.data.design.blocks || []).map(block => {
      if (block.id !== id) return block;
      const maxX = stage.width - Number(block.previewWidth || 0);
      const maxY = stage.height - Number(block.previewHeight || 0);
      const previewX = Math.max(0, Math.min(maxX, Math.round((this._dragStartPreviewX || 0) + dx)));
      const previewY = Math.max(0, Math.min(maxY, Math.round((this._dragStartPreviewY || 0) + dy)));
      return {
        ...block,
        previewX,
        previewY,
        x: Math.round(previewX / previewScale.x),
        y: Math.round(previewY / previewScale.y)
      };
    });
    this.setData({ 'design.blocks': blocks }, () => this.schedulePreviewRender(16));
  },

  onBlockTouchEnd(e) {
    if (this.data.inlineEditing) return;
    if (this.resizeState && this.resizeState.fromBlockPinch) {
      this._saveHistory(this.data.design);
      this.resizeState = null;
      this._dragBlockId = '';
      this._dragMoved = false;
      this._dragStartX = null;
      this._dragStartY = null;
      this._dragStartPreviewX = null;
      this._dragStartPreviewY = null;
      this._suppressNextTap = true;
      setTimeout(() => {
        this._suppressNextTap = false;
      }, 120);
      return;
    }
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
      const previewScale = getPreviewScales(design);
      design.blocks[index].x = Math.round((block.previewX || 0) / previewScale.x);
      design.blocks[index].y = Math.round((block.previewY || 0) / previewScale.y);
      this.setDesign(design, id);
    }
  },

  startBlockPinchResize(block, touches) {
    if (!block || !block.id || !touches || touches.length < 2) return;
    let rpxPerPx = 1;
    try {
      const info = wx.getSystemInfoSync();
      rpxPerPx = 750 / (info.windowWidth || 750);
    } catch (err) {}
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    const previewScale = getPreviewScales(this.data.design);
    this.setData({
      activeBlockId: block.id,
      activeBlock: block,
      inlineEditing: false,
      textInputFocus: false,
      caretVisible: false,
      ...getTextPanelState(block, this.data)
    });
    this.resizeState = {
      id: block.id,
      edge: 'pinch',
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
      previewScaleX: previewScale.x,
      previewScaleY: previewScale.y,
      isPinch: true,
      fromBlockPinch: true,
      pinchStartDist: Math.sqrt(dx * dx + dy * dy)
    };
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
    const previewScale = getPreviewScales(this.data.design);
    this.setData({
      activeBlockId: block.id,
      activeBlock: block,
      inlineEditing: false,
      textInputFocus: false,
      caretVisible: false,
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
      previewScaleX: previewScale.x,
      previewScaleY: previewScale.y,
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
      const dx = (touch.clientX - state.startX) * state.rpxPerPx / (state.previewScaleX || PREVIEW_SCALE);
      const dy = (touch.clientY - state.startY) * state.rpxPerPx / (state.previewScaleY || PREVIEW_SCALE);

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
    if (this.resizeState) {
      this._saveHistory(this.data.design);
    }
    this.resizeState = null;
  },

  /**
   * 将属性应用到当前文字框的全部文字（所有 ops），用于排列面板的全局操作。
   */
  applyFormatToAllText(attrs, blockPatch) {
    const block = this.data.activeBlock || {};
    if (!block.delta || !block.delta.ops) return;
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(block.delta));
    const hasSelection = hasTextSelection(range.start, range.end);
    const newOps = (block.delta.ops || []).map(op => ({
      ...op,
      attributes: { ...(op.attributes || {}), ...attrs }
    }));
    const newDelta = { ops: newOps };
    if (this.editorCtx && this.data.inlineEditing && !this.data.selectionModeActive) {
      this.editorCtx.setContents({ delta: newDelta });
    }
    this.updateActiveBlock({ ...(blockPatch || {}), delta: newDelta }, { silentEditor: true });
    if (hasSelection) {
      this.refreshSelectionPreview(newDelta, range.start, range.end, undefined, blockPatch);
    }
  },

  format(e) {
    const name = e.currentTarget.dataset.name;
    let value = e.currentTarget.dataset.value;
    if (!name) return;
    if (name === 'bold' || name === 'italic' || name === 'underline') {
      const range = this.getActiveTextSelectionRange(this.data.activePlainText || '');
      const attrs = getAttrsAtOffset(this.data.activeBlock && this.data.activeBlock.delta, range.start || 0);
      const nextValue = !attrs[name];
      this.applyFormatToSelection({ [name]: nextValue });
      this.setData({ formats: { ...(this.data.formats || {}), [name]: nextValue } });
      return;
    }
    if (name === 'backgroundColor') {
      const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
      if (!hasTextSelection(range.start, range.end) && this.editorCtx && this.data.inlineEditing) {
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
      const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
      if (!hasTextSelection(range.start, range.end) && this.editorCtx && this.data.inlineEditing) {
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
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
    if (hasTextSelection(range.start, range.end)) {
      this.applyFormatToSelection({ size: fontSize, fontSize });
    } else {
      this.applyFormatToAllText({ size: fontSize, fontSize });
    }
  },

  changeLineHeight(e) {
    const lineHeight = Number(e.detail.value || 1.6).toFixed(1);
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
    if (this.editorCtx && this.data.inlineEditing) {
      this.editorCtx.format('lineHeight', String(lineHeight));
    }
    this.updateActiveBlock({ lineHeight }, { silentEditor: true });
    if (hasTextSelection(range.start, range.end)) {
      this.refreshSelectionPreview(this.data.activeBlock.delta, range.start, range.end, undefined, { lineHeight });
    }
  },

  changeLetterSpacing(e) {
    const letterSpacing = Number(e.detail.value || 0);
    this.setData({ 'activeBlock.letterSpacing': letterSpacing });
    if (this.hasActiveTextSelection()) {
      this.applyFormatToSelection({ letterSpacing }, { letterSpacing });
    } else {
      this.applyFormatToAllText({ letterSpacing }, { letterSpacing });
    }
  },

  changeOpacity(e) {
    const opacity = Number(e.detail.value || 1);
    this.setData({ textOpacity: opacity });
    if (this.hasActiveTextSelection()) {
      this.applyFormatToSelection({ opacity });
    } else {
      this.applyFormatToAllText({ opacity });
    }
  },

  /**
   * 基于当前选区(selectionStart/selectionEnd)对 delta 做局部属性修改，
   * 有选区时只修改选中部分，无选区时修改全部文字。
   * 同时同步到 editor 组件（编辑器模式下）和预览区。
   */
  applyFormatToSelection(attrs, blockPatch) {
    const block = this.data.activeBlock || {};
    if (!block.delta || !block.delta.ops) return;
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(block.delta));
    const hasSelection = hasTextSelection(range.start, range.end);
    const delta = applyAttrsToDeltaRange(
      clone(block.delta),
      hasSelection ? range.start : 0,
      hasSelection ? range.end : getDeltaLength(block.delta),
      attrs
    );
    if (this.editorCtx && this.data.inlineEditing && !this.data.selectionModeActive) {
      this.editorCtx.setContents({ delta });
    }
    if (hasSelection) {
      this._manualTextSelection = { start: range.start, end: range.end };
    }
    this.updateActiveBlock({ ...(!hasSelection ? (blockPatch || {}) : {}), delta }, { silentEditor: true, renderDelay: 0 });
    if (hasSelection) {
      this.refreshSelectionPreview(delta, range.start, range.end);
    }
    this.schedulePreviewRender(0);
  },

  changeShadowStrength(e) {
    const shadowStrength = Number(e.detail.value || 0);
    const shadow = shadowStrength > 0;
    this.setData({ shadowStrength });
    const attrs = {
      shadow,
      shadowStrength,
      shadowBlur: Math.round(4 + shadowStrength * 18),
      shadowOffsetY: Math.round(2 + shadowStrength * 6),
      shadowColor: this.data.activeShadowColor || 'rgba(72,48,26,0.26)'
    };
    if (this.hasActiveTextSelection()) {
      this.applyFormatToSelection(attrs);
      return;
    }
    this.updateActiveBlock(attrs, { silentEditor: true });
  },

  updateActiveBlockTextAttributes(attrs, blockPatch) {
    this.applyFormatToSelection(attrs, blockPatch);
  },

  setAlign(e) {
    const align = e.currentTarget.dataset.align || 'center';
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
    if (this.editorCtx && this.data.inlineEditing) {
      this.editorCtx.format('align', align);
    }
    this.updateActiveBlock({ align });
    if (hasTextSelection(range.start, range.end)) {
      this.refreshSelectionPreview(this.data.activeBlock.delta, range.start, range.end, undefined, { align });
    }
  },

  setFontFamily(e) {
    const fontId = e.currentTarget.dataset.id || 'system';
    const font = findFontById(fontId);
    recordFontUsage(font.id);
    this.setData({ activeFontId: font.id, fonts: getSortedFonts() });
    this.loadPreviewFont(font);

    const block = this.data.activeBlock || {};
    if (!block.delta || !block.delta.ops) return;

    const fontAttrs = {
      fontId: font.id,
      fontFamily: font.family,
      fontUrl: font.fontUrl || ''
    };
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(block.delta));
    if (hasTextSelection(range.start, range.end)) {
      this.applyFormatToSelection(fontAttrs, fontAttrs);
      this._saveHistory(this.data.design);
      return;
    }

    this.applyFormatToAllText(fontAttrs, fontAttrs);
    this._saveHistory(this.data.design);
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
          this.setData({ design: hydrateDesign(clone(this.data.design)) }, () => this.schedulePreviewRender(0));
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
    if (this.hasActiveTextSelection()) {
      this.applyFormatToSelection({ stroke: true, strokeColor: activeStrokeColor, strokeWidth: 2 });
      this._saveHistory(this.data.design);
      return;
    }
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
    if (this.hasActiveTextSelection()) {
      this.applyFormatToSelection({ background: activeBackground, backgroundColor: activeBackground });
    } else {
      this.applyFormatToAllText({ background: activeBackground, backgroundColor: activeBackground });
    }
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
    if (this.hasActiveTextSelection()) {
      this.applyFormatToSelection({ background: rgba, backgroundColor: rgba });
    } else {
      this.applyFormatToAllText({ background: rgba, backgroundColor: rgba });
    }
  },

  setShadowColor(e) {
    const activeShadowColor = e.currentTarget.dataset.value || 'rgba(72,48,26,0.24)';
    this.setData({ activeShadowColor: activeShadowColor });
    const shadowStrength = this.data.shadowStrength || 0.65;
    const attrs = {
      shadow: true,
      shadowColor: activeShadowColor,
      shadowStrength,
      shadowBlur: Math.round(4 + shadowStrength * 18),
      shadowOffsetY: Math.round(2 + shadowStrength * 6)
    };
    if (this.hasActiveTextSelection()) {
      this.applyFormatToSelection(attrs);
      this._saveHistory(this.data.design);
      return;
    }
    this.updateActiveBlock(attrs, { silentEditor: true });
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
      const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
      if (!hasTextSelection(range.start, range.end) && this.editorCtx && this.data.inlineEditing) {
        this.editorCtx.format('color', color);
        setTimeout(() => this.syncEditorContentsToDesign(), 60);
      } else {
        this.updateActiveBlockTextAttributes({ color });
        if (hasTextSelection(range.start, range.end)) this._saveHistory(this.data.design);
      }
    } else if (target === 'stroke') {
      this.setData({ activeStrokeColor: color });
      if (this.hasActiveTextSelection()) {
        this.applyFormatToSelection({ stroke: true, strokeColor: color, strokeWidth: 2 });
        this._saveHistory(this.data.design);
      } else {
        this.updateActiveBlock({ stroke: true, strokeColor: color, strokeWidth: 2 });
      }
    } else if (target === 'bg') {
      this.setData({ activeBackground: color });
      if (this.hasActiveTextSelection()) {
        this.applyFormatToSelection({ background: color, backgroundColor: color });
      } else {
        this.applyFormatToAllText({ background: color, backgroundColor: color });
      }
    } else if (target === 'shadow') {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const rgba = `rgba(${r},${g},${b},0.35)`;
      this.setData({ activeShadowColor: rgba });
      const shadowStrength = this.data.shadowStrength || 0.65;
      const attrs = {
        shadowColor: rgba,
        shadow: true,
        shadowStrength,
        shadowBlur: Math.round(4 + shadowStrength * 18),
        shadowOffsetY: Math.round(2 + shadowStrength * 6)
      };
      if (this.hasActiveTextSelection()) {
        this.applyFormatToSelection(attrs);
        this._saveHistory(this.data.design);
      } else {
        this.updateActiveBlock(attrs, { silentEditor: true });
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
    this.setData({ inlineEditing: false, textInputFocus: false, caretVisible: false });
    if (!blocks.length) {
      this.setData({
        design: hydrateDesign(design),
        activeBlockId: '',
        activeBlock: {},
        activePlainText: '',
        selectionStart: 0,
        selectionEnd: 0,
        caretVisible: false
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
    this.setData({ inlineEditing: false, textInputFocus: false, caretVisible: false });
    this.setDesign(design, copied.id);
    wx.showToast({ title: '已复制文字框', icon: 'none' });
  },

  rotateActiveBlock() {
    const current = Number((this.data.activeBlock && this.data.activeBlock.rotation) || 0);
    const rotation = (current + 15) % 360;
    this.updateActiveBlock({ rotation });
  },

  toggleStroke() {
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
    if (hasTextSelection(range.start, range.end)) {
      const attrs = getAttrsAtOffset(this.data.activeBlock && this.data.activeBlock.delta, range.start || 0);
      const stroke = !(typeof attrs.stroke === 'boolean' ? attrs.stroke : false);
      this.applyFormatToSelection({ stroke, strokeColor: this.data.activeStrokeColor || '#FFFFFF', strokeWidth: 2 });
      this._saveHistory(this.data.design);
      return;
    }
    this.updateActiveBlock({ stroke: !this.data.activeBlock.stroke, strokeColor: this.data.activeStrokeColor || '#FFFFFF', strokeWidth: 2 });
  },

  toggleShadow() {
    const range = this.getActiveTextSelectionRange(this.data.activePlainText || deltaToText(this.data.activeBlock && this.data.activeBlock.delta));
    const currentAttrs = getAttrsAtOffset(this.data.activeBlock && this.data.activeBlock.delta, range.start || 0);
    const selected = hasTextSelection(range.start, range.end);
    const shadow = selected
      ? !(typeof currentAttrs.shadow === 'boolean' ? currentAttrs.shadow : false)
      : !this.data.activeBlock.shadow;
    const shadowStrength = shadow ? (this.data.shadowStrength || 0.65) : 0;
    const attrs = {
      shadow,
      shadowStrength,
      shadowBlur: Math.round(4 + shadowStrength * 18),
      shadowOffsetY: Math.round(2 + shadowStrength * 6),
      shadowColor: this.data.activeShadowColor || 'rgba(72,48,26,0.26)'
    };
    if (selected) {
      this.applyFormatToSelection(attrs);
      this._saveHistory(this.data.design);
      return;
    }
    this.updateActiveBlock(attrs);
  },

  addTextBlock() {
    this._ignoreNextEditorBlur = true;
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
    setTimeout(() => {
      this.setData({
        activeBlockId: block.id,
        activeBlock: block,
        activePlainText: '',
        inputText: '',
        textInputFocus: true,
        inlineEditing: true,
        selectionStart: 0,
        selectionEnd: 0,
        ...getTextPanelState(block, this.data)
      });
    }, 80);
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
        if (this.data.activeCanvasSizeId === 'image' && bgWidth && bgHeight) {
          design.size = { ...normalizeAspectSize(bgWidth, bgHeight), preset: 'image' };
        }
        const layout = getBackgroundImageLayout({ bgWidth, bgHeight }, design);

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
    const layout = {
      width: this.data.bgDisplayWidth || this.data.previewStageWidth || PREVIEW_STAGE_RPX,
      height: this.data.bgDisplayHeight || this.data.previewStageHeight || PREVIEW_STAGE_HEIGHT_RPX
    };
    let rpxPerPx = 1;
    try {
      const info = wx.getSystemInfoSync();
      rpxPerPx = 750 / (info.windowWidth || 750);
    } catch (err) {}
    const dx = (touch.clientX - this._bgDragStartX) * rpxPerPx;
    const dy = (touch.clientY - this._bgDragStartY) * rpxPerPx;
    const offset = clampBackgroundOffset(this._bgOffsetStartX + dx, this._bgOffsetStartY + dy, layout, this.data.design);
    this.setData({
      bgOffsetX: offset.x,
      bgOffsetY: offset.y,
      'design.background.offsetX': offset.x,
      'design.background.offsetY': offset.y
    }, () => this.schedulePreviewRender(16));
  },

  onBgTouchEnd() {
    // 拖动结束，同步 offset 到 design 中以便保存
    const design = clone(this.data.design);
    if (design.background) {
      design.background.offsetX = this.data.bgOffsetX || 0;
      design.background.offsetY = this.data.bgOffsetY || 0;
    }
    this.setData({ 'design.background': design.background }, () => this.schedulePreviewRender(0));
    this._saveHistory(design);
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
    this.setData({ design: hydrateDesign(design) }, () => this.schedulePreviewRender(0));
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
      const imagePath = await renderer.exportPoster(this, '#exportCanvas', exportDesign, { scale: 2 });
      wx.hideLoading();
      this.saveImageToAlbum(imagePath);
    } catch (e) {
      console.error('导出失败', e);
      wx.hideLoading();
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  }
});
