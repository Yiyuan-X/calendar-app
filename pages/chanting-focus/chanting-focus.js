// pages/chanting-focus/chanting-focus.js — 专注模式
const chant = require('../../utils/chanting');

Page({
  data: {
    task: {},
    count: 0
  },

  onLoad(opts) {
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
    this.setData({ count: newCount });
    wx.vibrateShort({ type: 'light' });
  },

  goBack() { wx.navigateBack(); }
});
