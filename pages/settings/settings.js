// pages/settings/settings.js — 设置页面（佛教大日子开关等）
const storage = require('../../utils/storage');

Page({
  data: {
    showLiuZhai: false,
    showLunarFestivals: true,
    showBuddhistFestivals: true
  },

  onLoad() {
    this.loadSettings();
  },

  onShow() {
    // 每次显示时刷新设置（可能从其他页面修改过）
    this.loadSettings();
  },

  loadSettings() {
    const settings = storage.getSettings();
    this.setData({
      showLiuZhai: settings.showLiuZhai,
      showLunarFestivals: settings.showLunarFestivals,
      showBuddhistFestivals: settings.showBuddhistFestivals
    });
  },

  // ==================== 开关切换 ====================

  onSwitchLiuZhai(e) {
    const value = e.detail.value;
    storage.updateSettings({ showLiuZhai: value });
    this.setData({ showLiuZhai: value });
    wx.showToast({
      title: value ? '已显示六斋日' : '已隐藏六斋日',
      icon: 'none',
      duration: 1200
    });
  },

  onSwitchLunarFestivals(e) {
    const value = e.detail.value;
    storage.updateSettings({ showLunarFestivals: value });
    this.setData({ showLunarFestivals: value });
    wx.showToast({
      title: value ? '已显示初一/十五' : '已隐藏初一/十五',
      icon: 'none',
      duration: 1200
    });
  },

  onSwitchBuddhistFestivals(e) {
    const value = e.detail.value;
    storage.updateSettings({ showBuddhistFestivals: value });
    this.setData({ showBuddhistFestivals: value });
    wx.showToast({
      title: value ? '已显示佛教纪念日' : '已隐藏佛教纪念日',
      icon: 'none',
      duration: 1200
    });
  },

  goToHelp() {
    wx.navigateTo({ url: '/pages/help/help' });
  }
});
