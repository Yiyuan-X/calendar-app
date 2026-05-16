const DRAFT_KEY = 'card_tool_drafts';
const LEGACY_WORK_KEY = 'card_tool_works';
const EXPORT_DESIGN_KEY = 'card_tool_current_export_design';
const DRAFT_LIMIT = 10;

function readList(key) {
  try {
    return wx.getStorageSync(key) || [];
  } catch (e) {
    return [];
  }
}

function writeList(key, list) {
  try {
    wx.setStorageSync(key, list || []);
    return true;
  } catch (e) {
    return false;
  }
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getDrafts() {
  return readList(DRAFT_KEY);
}

function getDraft(id) {
  return getDrafts().find(item => item.id === id) || null;
}

function saveDraft(design) {
  const list = getDrafts();
  const now = Date.now();
  const safeDesign = sanitizeDesign(design || {});
  const item = {
    id: design.id || createId('draft'),
    name: getDraftName(safeDesign),
    templateId: safeDesign.templateId || safeDesign.id || '',
    design: safeDesign,
    updatedAt: now,
    createdAt: design.createdAt || now
  };
  const index = list.findIndex(draft => draft.id === item.id);
  if (index >= 0) {
    list[index] = { ...list[index], ...item };
  } else {
    list.unshift(item);
  }
  writeList(DRAFT_KEY, list.slice(0, DRAFT_LIMIT));
  return item;
}

function removeDraft(id) {
  writeList(DRAFT_KEY, getDrafts().filter(item => item.id !== id));
}

function getLatestDraft() {
  const list = getDrafts();
  return list.length ? list[0] : null;
}

function getDraftCount() {
  return getDrafts().length;
}

function getDraftName(design) {
  const firstTextBlock = (design.blocks || []).find(block => block.type === 'text');
  const text = ((firstTextBlock && firstTextBlock.delta && firstTextBlock.delta.ops) || [])
    .map(op => String(op.insert || ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.slice(0, 16) : (design.name || '未命名卡片');
}

function isLocalImage(src) {
  const value = String(src || '');
  return value.indexOf('wxfile://') === 0 || value.indexOf('http://tmp') === 0 || value.indexOf('file://') === 0;
}

function sanitizeImageConfig(image) {
  if (!image) return null;
  if (isLocalImage(image.src)) return null;
  return { ...image };
}

function sanitizeDesign(design) {
  const result = {
    id: design.id || '',
    templateId: design.templateId || design.id || '',
    styleId: design.styleId || design.templateId || design.id || '',
    inputText: design.inputText || '',
    name: design.name || '',
    size: design.size || { width: 750, height: 1000 },
    fontUrl: design.fontUrl || '',
    fontFamily: design.fontFamily || '',
    background: { ...(design.background || {}) },
    blocks: (design.blocks || []).map(block => ({
      id: block.id,
      type: block.type,
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      manualHeight: block.manualHeight,
      rotation: block.rotation,
      fontId: block.fontId,
      fontFamily: block.fontFamily,
      fontUrl: block.fontUrl,
      placeholder: block.placeholder,
      placeholderSize: block.placeholderSize,
      align: block.align,
      verticalAlign: block.verticalAlign,
      textDirection: block.textDirection,
      lineHeight: block.lineHeight,
      letterSpacing: block.letterSpacing,
      stroke: !!block.stroke,
      strokeColor: block.strokeColor,
      strokeWidth: block.strokeWidth,
      shadow: !!block.shadow,
      shadowColor: block.shadowColor,
      shadowStrength: block.shadowStrength,
      shadowBlur: block.shadowBlur,
      shadowOffsetX: block.shadowOffsetX,
      shadowOffsetY: block.shadowOffsetY,
      delta: block.delta || { ops: [] }
    })),
    decorations: design.decorations || [],
    qrcode: sanitizeImageConfig(design.qrcode) || { visible: false, src: '' }
  };

  if (result.background && result.background.type === 'image' && isLocalImage(result.background.src)) {
    result.background = { type: 'solid', color: '#F7F1EA', blur: !!result.background.blur };
  }

  const avatar = sanitizeImageConfig(design.avatar);
  if (avatar) result.avatar = avatar;
  const overlayImage = sanitizeImageConfig(design.overlayImage);
  if (overlayImage) result.overlayImage = overlayImage;

  return result;
}

function clearLegacyWorks() {
  try {
    wx.removeStorageSync(LEGACY_WORK_KEY);
  } catch (e) {}
}

function setCurrentExportDesign(design) {
  try {
    wx.setStorageSync(EXPORT_DESIGN_KEY, {
      design,
      updatedAt: Date.now()
    });
  } catch (e) {}
}

function getCurrentExportDesign() {
  try {
    const cache = wx.getStorageSync(EXPORT_DESIGN_KEY);
    if (!cache || !cache.design) return null;
    if (Date.now() - (cache.updatedAt || 0) > 30 * 60 * 1000) {
      wx.removeStorageSync(EXPORT_DESIGN_KEY);
      return null;
    }
    return cache.design;
  } catch (e) {
    return null;
  }
}

function clearCurrentExportDesign() {
  try {
    wx.removeStorageSync(EXPORT_DESIGN_KEY);
  } catch (e) {}
}

module.exports = {
  DRAFT_LIMIT,
  getDrafts,
  getDraft,
  getLatestDraft,
  getDraftCount,
  saveDraft,
  removeDraft,
  clearLegacyWorks,
  setCurrentExportDesign,
  getCurrentExportDesign,
  clearCurrentExportDesign
};
