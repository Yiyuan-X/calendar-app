// pages/settings/settings.js — 设置页面（佛教大日子开关等）
const storage = require('../../utils/storage');
const share = require('../../utils/share');

Page({
  data: {
    showLiuZhai: false,
    showLunarFestivals: true,
    showBuddhistFestivals: true,
    elderMode: false
  },

  onLoad() {
    share.enableShareMenu();
    this.loadSettings();
  },

  onShow() {
    share.enableShareMenu();
    // 每次显示时刷新设置（可能从其他页面修改过）
    this.loadSettings();
  },

  loadSettings() {
    const settings = storage.getSettings();
    this.setData({
      showLiuZhai: settings.showLiuZhai,
      showLunarFestivals: settings.showLunarFestivals,
      showBuddhistFestivals: settings.showBuddhistFestivals,
      elderMode: settings.elderMode
    });
    getApp().applyDisplaySettings(this);
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

  onSwitchElderMode(e) {
    const value = e.detail.value;
    storage.updateSettings({ elderMode: value });
    this.setData({ elderMode: value });
    getApp().applyDisplaySettings(this);
    wx.showToast({
      title: value ? '已开启长辈模式' : '已关闭长辈模式',
      icon: 'none',
      duration: 1200
    });
  },

  goToHelp() {
    wx.navigateTo({ url: '/pages/help/help' });
  },

  previewPromotionCode() {
    wx.previewImage({
      urls: ['/images/promo-qrcode.png'],
      current: '/images/promo-qrcode.png'
    });
  },

  copyWechat() {
    wx.setClipboardData({
      data: 'HSTS08',
      success: () => wx.showToast({ title: '微信号已复制', icon: 'success' })
    });
  },

  onShareAppMessage() {
    return share.appMessage({
      title: '岁时记 · 日历节日倒计时',
      path: '/pages/index/index'
    });
  },

  onShareTimeline() {
    return share.timeline({ title: '岁时记 · 日历节日倒计时' });
  }
});
