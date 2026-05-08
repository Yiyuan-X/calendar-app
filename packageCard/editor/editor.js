const templates = require('../common/templates');
const cardStorage = require('../common/storage');
const aesthetic = require('../common/aesthetic');

const PREVIEW_SCALE = 520 / 750;

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function deltaToText(delta) {
  return ((delta && delta.ops) || []).map(op => String(op.insert || '')).join('');
}

function deltaToNodes(delta, block) {
  const ops = (delta && delta.ops) || [];
  const children = [];
  const blockLetterSpacing = Math.round(Number(block.letterSpacing || 0) * PREVIEW_SCALE * 10) / 10;
  ops.forEach(op => {
    const attrs = op.attributes || {};
    const parts = String(op.insert || '').split(/(\n)/);
    const fontSize = Math.max(Math.round((parseInt(attrs.size || attrs.fontSize || 30, 10) || 30) * PREVIEW_SCALE), 12);
    const letterSpacing = Math.round(Number(attrs.letterSpacing || block.letterSpacing || 0) * PREVIEW_SCALE * 10) / 10;
    const style = [
      `font-size:${fontSize}rpx`,
      `color:${attrs.color || '#4B4038'}`,
      attrs.bold ? 'font-weight:700' : '',
      attrs.background ? `background:${attrs.background}` : '',
      attrs.backgroundColor ? `background:${attrs.backgroundColor}` : '',
      attrs.fontFamily ? `font-family:${attrs.fontFamily}` : ''
    ].filter(Boolean).join(';');
    parts.forEach(part => {
      if (!part) return;
      if (part === '\n') children.push({ name: 'br' });
      else children.push({ name: 'span', attrs: { style }, children: [{ type: 'text', text: part }] });
    });
  });
  return [{ name: 'div', attrs: { style: `letter-spacing:${blockLetterSpacing}rpx;` }, children }];
}

function hydrateDesign(design) {
  const copyDesign = clone(design);
  copyDesign.blocks = (copyDesign.blocks || []).map(block => ({
    ...block,
    previewX: Math.round((block.x || 0) * PREVIEW_SCALE),
    previewY: Math.round((block.y || 0) * PREVIEW_SCALE),
    previewWidth: Math.round((block.width || 500) * PREVIEW_SCALE),
    previewNodes: deltaToNodes(block.delta, block),
    plainText: deltaToText(block.delta)
  }));
  return copyDesign;
}

Page({
  data: {
    design: {},
    activeBlockId: '',
    activeBlock: {},
    formats: {},
    colors: ['#3D3028', '#6B4F39', '#A77E50', '#C6543A', '#314538', '#FFFFFF'],
    fonts: [
      { name: '系统', family: 'PingFang SC' },
      { name: '宋体', family: 'serif' },
      { name: '手札', family: 'CardSerif' }
    ],
    stylePresets: Object.keys(aesthetic.STYLE_PRESETS).map(key => aesthetic.STYLE_PRESETS[key]),
    inputText: '人生最重要的是内心平静',
    currentStyleId: 'mindful-quote',
    activeBackground: '#FFF2C7',
    fontSize: 32,
    previewBackground: '#F7F1EA',
    previewBackgroundImage: ''
  },

  onLoad(query) {
    let design;
    let shouldApplyAutoLayout = true;
    if (query.draftId) {
      const draft = cardStorage.getDraft(query.draftId);
      design = draft && draft.design ? draft.design : templates.getTemplate('daily-sign-warm');
      design.id = query.draftId;
      shouldApplyAutoLayout = false;
    } else {
      design = templates.getTemplate(query.templateId || 'daily-sign-warm');
      design.templateId = query.templateId || design.id;
      design.id = '';
    }
    if (shouldApplyAutoLayout) {
      design = aesthetic.applyAesthetic(design, design.inputText || this.data.inputText, design.styleId || design.templateId || 'mindful-quote');
    }
    this.setDesign(design, (design.blocks && design.blocks[0] && design.blocks[0].id) || '');
  },

  setDesign(design, activeId) {
    const hydrated = hydrateDesign(design);
    const activeBlock = hydrated.blocks.find(item => item.id === activeId) || hydrated.blocks[0] || {};
    this.setData({
      design: hydrated,
      activeBlockId: activeBlock.id || '',
      activeBlock,
      inputText: hydrated.inputText || this.data.inputText,
      currentStyleId: hydrated.styleId || hydrated.templateId || this.data.currentStyleId,
      previewBackground: this.getPreviewBackground(hydrated.background),
      previewBackgroundImage: this.getPreviewBackgroundImage(hydrated.background)
    }, () => {
      if (this.editorCtx && activeBlock.delta) this.editorCtx.setContents({ delta: activeBlock.delta });
    });
  },

  getPreviewBackground(bg) {
    if (!bg) return '#F7F1EA';
    if (bg.type === 'gradient') {
      const colors = bg.colors || ['#FFF7E8', '#F5EEE1'];
      return `linear-gradient(180deg, ${colors[0]}, ${colors[1] || colors[0]})`;
    }
    if (bg.type === 'image' && bg.src) return '#F7F1EA';
    return bg.color || '#F7F1EA';
  },

  getPreviewBackgroundImage(bg) {
    return bg && bg.type === 'image' && bg.src ? bg.src : '';
  },

  onEditorReady() {
    wx.createSelectorQuery().in(this).select('#richEditor').context(res => {
      this.editorCtx = res.context;
      if (this.data.activeBlock.delta) this.editorCtx.setContents({ delta: this.data.activeBlock.delta });
    }).exec();
  },

  onEditorInput(e) {
    this.updateActiveBlock({ delta: e.detail.delta }, { silentEditor: true });
  },

  onStatusChange(e) {
    this.setData({ formats: e.detail || {} });
  },

  onInputText(e) {
    const inputText = e.detail.value || '';
    this.setData({ inputText });
    this.applyAutoLayout(inputText, this.data.currentStyleId);
  },

  switchAutoStyle(e) {
    const styleId = e.currentTarget.dataset.id || 'mindful-quote';
    this.setData({ currentStyleId: styleId });
    this.applyAutoLayout(this.data.inputText, styleId);
  },

  applyAutoLayout(text, styleId) {
    const template = templates.getTemplate(styleId);
    const design = aesthetic.applyAesthetic(template, text, styleId);
    const currentBackground = this.data.design && this.data.design.background;
    if (currentBackground && currentBackground.type === 'image' && currentBackground.src) {
      design.background = clone(currentBackground);
    }
    design.id = this.data.design.id || '';
    this.setDesign(design, 'quote');
  },

  beautifyCurrentText() {
    const text = this.data.inputText || deltaToText(this.data.activeBlock.delta);
    this.applyAutoLayout(text, this.data.currentStyleId);
    wx.showToast({ title: '已自动排版', icon: 'none' });
  },

  selectBlock(e) {
    const id = e.currentTarget.dataset.id;
    const block = (this.data.design.blocks || []).find(item => item.id === id);
    this.setData({ activeBlockId: id, activeBlock: block || {} }, () => {
      if (this.editorCtx && block && block.delta) this.editorCtx.setContents({ delta: block.delta });
    });
  },

  updateActiveBlock(patch, options) {
    const design = clone(this.data.design);
    const index = design.blocks.findIndex(item => item.id === this.data.activeBlockId);
    if (index < 0) return;
    design.blocks[index] = { ...design.blocks[index], ...patch };
    if (options && options.silentEditor) {
      const hydrated = hydrateDesign(design);
      const activeBlock = hydrated.blocks.find(item => item.id === this.data.activeBlockId) || {};
      this.setData({ design: hydrated, activeBlock });
      return;
    }
    this.setDesign(design, design.blocks[index].id);
  },

  onBlockMove(e) {
    if (e.detail.source !== 'touch') return;
    const id = e.currentTarget.dataset.id;
    const design = clone(this.data.design);
    const index = design.blocks.findIndex(item => item.id === id);
    if (index < 0) return;
    design.blocks[index].x = Math.round(e.detail.x / PREVIEW_SCALE);
    design.blocks[index].y = Math.round(e.detail.y / PREVIEW_SCALE);
    this.setData({ design: hydrateDesign(design) });
  },

  format(e) {
    const name = e.currentTarget.dataset.name;
    let value = e.currentTarget.dataset.value;
    if (!this.editorCtx || !name) return;
    if (name === 'bold') value = undefined;
    this.editorCtx.format(name, value);
  },

  changeFontSize(e) {
    const fontSize = Number(e.detail.value || 32);
    this.setData({ fontSize });
    if (this.editorCtx) this.editorCtx.format('fontSize', `${fontSize}px`);
    this.updateActiveBlockTextAttributes({ size: fontSize });
  },

  changeLineHeight(e) {
    this.updateActiveBlock({ lineHeight: Number(e.detail.value || 1.6).toFixed(1) }, { silentEditor: true });
  },

  changeLetterSpacing(e) {
    const letterSpacing = Number(e.detail.value || 0);
    this.updateActiveBlockTextAttributes({ letterSpacing }, { letterSpacing });
  },

  updateActiveBlockTextAttributes(attrs, blockPatch) {
    const block = this.data.activeBlock || {};
    const delta = clone(block.delta || { ops: [] });
    delta.ops = (delta.ops || []).map(op => ({
      ...op,
      attributes: { ...(op.attributes || {}), ...attrs }
    }));
    this.updateActiveBlock({ ...(blockPatch || {}), delta }, { silentEditor: true });
    if (this.editorCtx) this.editorCtx.setContents({ delta });
  },

  setAlign(e) {
    this.updateActiveBlock({ align: e.currentTarget.dataset.align || 'center' });
  },

  setFontFamily(e) {
    const family = e.currentTarget.dataset.family || 'PingFang SC';
    if (this.editorCtx) this.editorCtx.format('fontFamily', family);
  },

  toggleStroke() {
    this.updateActiveBlock({ stroke: !this.data.activeBlock.stroke, strokeColor: '#FFFFFF', strokeWidth: 2 });
  },

  toggleShadow() {
    this.updateActiveBlock({ shadow: !this.data.activeBlock.shadow });
  },

  addTextBlock() {
    const design = clone(this.data.design);
    const block = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: 100,
      y: 420,
      width: 550,
      align: 'center',
      lineHeight: 1.6,
      letterSpacing: 1,
      delta: { ops: [{ insert: '新的文字段落', attributes: { size: 30, color: '#6B4F39' } }] }
    };
    design.blocks.push(block);
    this.setDesign(design, block.id);
  },

  chooseBackground() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: res => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        const design = clone(this.data.design);
        design.background = { type: 'image', src: file.tempFilePath, blur: !!(design.background && design.background.blur) };
        this.setDesign(design, this.data.activeBlockId);
      }
    });
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

  setBackgroundType(e) {
    const type = e.currentTarget.dataset.type;
    const design = clone(this.data.design);
    if (type === 'solid') design.background = { type: 'solid', color: '#F7F1EA', blur: !!design.background.blur };
    if (type === 'gradient') design.background = { type: 'gradient', colors: ['#FFF7E8', '#EAF1E7'], direction: 'vertical', blur: !!design.background.blur };
    this.setDesign(design, this.data.activeBlockId);
  },

  toggleBlur() {
    const design = clone(this.data.design);
    design.background = { ...(design.background || {}), blur: !(design.background && design.background.blur) };
    this.setDesign(design, this.data.activeBlockId);
  },

  saveDraft() {
    const saved = cardStorage.saveDraft(clone(this.data.design));
    this.setData({ 'design.id': saved.id });
    wx.showToast({ title: '已保存草稿', icon: 'success' });
    return saved;
  },

  goExport() {
    const saved = this.saveDraft();
    const exportDesign = clone(this.data.design);
    exportDesign.id = saved.id;
    cardStorage.setCurrentExportDesign(exportDesign);
    wx.navigateTo({ url: `/packageCard/export/export?draftId=${saved.id}` });
  }
});
