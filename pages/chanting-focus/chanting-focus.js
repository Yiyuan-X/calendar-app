// pages/chanting-focus/chanting-focus.js — 专注模式
const chant = require('../../utils/chanting');
const share = require('../../utils/share');

Page({
  data: {
    task: {},
    count: 0
  },

  onLoad(opts) {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    const id = opts.id;
    if (!id) { wx.navigateBack(); return; }
    const tasks = chant.getTasks();
    const task = tasks.find(t => t.id === id) || {};
    this.setData({ task });

    // 加载今日计数
    const today = chant.getToday();
    const rec = chant.getDayRecord(today);
    this.setData({ count: rec[id] || 0 });
  },

  onTap() {
    const id = this.data.task.id;
    const newCount = chant.increment(id, chant.getToday(), 1);
    chant.promoteTaskToTop(id);
    this.setData({ count: newCount });
    wx.vibrateShort({ type: 'light' });
  },

  goBack() { wx.navigateBack(); },

  onShareAppMessage() {
    const taskName = this.data.task.name || '专注计数';
    return share.appMessage({
      title: `${taskName} · 岁时记计数器`,
      path: '/pages/chanting/chanting'
    });
  },

  onShareTimeline() {
    const taskName = this.data.task.name || '专注计数';
    return share.timeline({ title: `${taskName} · 岁时记计数器` });
  }
});
