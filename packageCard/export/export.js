const cardStorage = require('../common/storage');
const renderer = require('../common/renderer');

Page({
  data: {
    draftId: '',
    design: null,
    imagePath: ''
  },

  onLoad(query) {
    const draftId = query.draftId || '';
    const draft = cardStorage.getDraft(draftId);
    const exportDesign = cardStorage.getCurrentExportDesign();
    const design = exportDesign || (draft && draft.design);
    if (!design) {
      wx.showToast({ title: '草稿不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 500);
      return;
    }
    this.setData({ draftId, design }, () => this.generate());
  },

  async generate() {
    if (!this.data.design) return;
    wx.showLoading({ title: '生成中...' });
    try {
      const imagePath = await renderer.exportPoster(this, '#exportCanvas', this.data.design, { scale: 2 });
      this.setData({ imagePath });
    } catch (e) {
      console.error('导出失败', e);
      wx.showToast({ title: '导出失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  regenerate() {
    this.setData({ imagePath: '' }, () => this.generate());
  },

  previewImage() {
    if (!this.data.imagePath) return;
    wx.previewImage({ urls: [this.data.imagePath], current: this.data.imagePath });
  },

  saveToAlbum() {
    if (!this.data.imagePath) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.imagePath,
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
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  }
});
