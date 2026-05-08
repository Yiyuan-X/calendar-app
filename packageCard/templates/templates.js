const templateStore = require('../common/templates');
const cardStorage = require('../common/storage');

function timeText(timestamp) {
  const date = new Date(timestamp || Date.now());
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

Page({
  data: {
    activeTab: 'templates',
    templates: templateStore.getTemplates(),
    drafts: []
  },

  onLoad() {
    this.loadTemplates();
    cardStorage.clearLegacyWorks();
  },

  onShow() {
    this.loadDrafts();
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab || 'templates' });
    if (this.data.activeTab === 'recent') this.loadDrafts();
  },

  async loadTemplates() {
    const templates = await templateStore.loadTemplates();
    this.setData({ templates });
  },

  loadDrafts() {
    const drafts = cardStorage.getDrafts().map(item => ({ ...item, timeText: timeText(item.updatedAt) }));
    this.setData({ drafts });
  },

  createBlank() {
    wx.navigateTo({ url: '/packageCard/editor/editor?templateId=daily-sign-warm' });
  },

  openTemplate(e) {
    wx.navigateTo({ url: `/packageCard/editor/editor?templateId=${e.currentTarget.dataset.id}` });
  },

  openDraft(e) {
    wx.navigateTo({ url: `/packageCard/editor/editor?draftId=${e.currentTarget.dataset.id}` });
  },

  deleteDraft(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除最近编辑',
      content: '只会删除本机缓存，不影响已保存到相册的图片。',
      confirmText: '删除',
      confirmColor: '#A65F3D',
      success: res => {
        if (!res.confirm) return;
        cardStorage.removeDraft(id);
        this.loadDrafts();
      }
    });
  }
});
