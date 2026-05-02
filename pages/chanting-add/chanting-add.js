// pages/chanting-add/chanting-add.js — 添加/搜索功课
const chant = require('../../utils/chanting');
const share = require('../../utils/share');

Page({
  data: {
    keyword: '',
    results: [],
    customName: '',
    customTarget: '',
    customTotalTarget: '',
    customUnit: '遍'
  },

  onShow() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    this.doSearch('');
  },

  onSearch(e) {
    const kw = (e.detail.value || '').trim();
    this.setData({ keyword: kw });
    this.doSearch(kw);
  },

  onClear() {
    this.setData({ keyword: '' });
    this.doSearch('');
  },

  doSearch(keyword) {
    let list = chant.searchBuiltin(keyword);
    // 不再标记已添加状态，允许重复添加
    list = list.map(item => ({ ...item, added: false }));
    this.setData({ results: list });
  },

  /** 添加内置功课 */
  onAddBuiltin(e) {
    const item = e.currentTarget.dataset.item;
    const task = chant.addTask(item.name, item.unit, 0, 0, false, item.id);
    wx.showToast({ title: '已添加「' + item.name + '」', icon: 'success' });
    this.doSearch(this.data.keyword);
    setTimeout(() => { wx.navigateBack(); }, 800);
  },

  /** 删除已添加的内置功课 */
  onRemoveBuiltin(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除「' + item.name + '」吗？',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          chant.removeTask(item.id);
          wx.showToast({ title: '已删除', icon: 'none' });
          this.doSearch(this.data.keyword);
        }
      }
    });
  },

  onNameInput(e) { this.setData({ customName: e.detail.value }); },
  onTargetInput(e) { this.setData({ customTarget: e.detail.value }); },
  onTotalTargetInput(e) { this.setData({ customTotalTarget: e.detail.value }); },
  onUnitInput(e) { this.setData({ customUnit: e.detail.value || '遍' }); },

  onCreateCustom() {
    const name = this.data.customName.trim();
    if (!name) { wx.showToast({ title: '请输入功课名称', icon: 'none' }); return; }

    const target = parseInt(this.data.customTarget) || 0;
    const totalTarget = parseInt(this.data.customTotalTarget) || 0;
    const unit = (this.data.customUnit.trim() || '遍');
    const task = chant.addTask(name, unit, target, totalTarget, true, null);
    if (!task) {
      wx.showToast({ title: '添加失败', icon: 'none' });
      return;
    }
    wx.showToast({ title: '已添加', icon: 'success' });
    setTimeout(() => { wx.navigateBack(); }, 600);
  },

  onShareAppMessage() {
    return share.appMessage({
      title: '岁时记 · 功课计数器',
      path: '/pages/chanting/chanting'
    });
  },

  onShareTimeline() {
    return share.timeline({ title: '岁时记 · 功课计数器' });
  }
});
