// pages/chanting-add/chanting-add.js — 添加/搜索功课
const chant = require('../../utils/chanting');

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
    // 标记已添加的
    const tasks = chant.getTasks();
    const addedIds = new Set(tasks.map(t => t.id));
    list = list.map(item => ({ ...item, added: addedIds.has(item.id) }));
    this.setData({ results: list });
  },

  /** 添加内置功课 */
  onAddBuiltin(e) {
    const item = e.currentTarget.dataset.item;
    if (item.added) return;
    const task = chant.addTask(item.name, item.unit, 0, 0, false, item.id);
    if (task) {
      wx.showToast({ title: '已添加「' + item.name + '」', icon: 'success' });
      this.doSearch(this.data.keyword);
      setTimeout(() => { wx.navigateBack(); }, 800);
    } else {
      wx.showToast({ title: '该功课已存在', icon: 'none' });
    }
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
    
    // 检查是否已存在同名
    const tasks = chant.getTasks();
    const exist = tasks.find(t => t.name === name);
    if (exist) {
      wx.showToast({ title: '「' + name + '」已存在', icon: 'none' });
      return;
    }
    
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
  }
});
