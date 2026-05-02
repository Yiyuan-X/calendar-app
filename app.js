/**
 * app.js — 岁时记入口
 * 初始化云开发、本地存储、隐私授权
 */
const cloud = require('./utils/cloud');
const privacy = require('./utils/privacy');

App({
  onLaunch() {
    // 1. 初始化云开发（最先执行）
    cloud.initCloud();
    cloud.watchNetworkStatus();

    // 2. 检查本地存储初始化
    this.checkStorageInit();
  },

  onShow() {
    // 检查事件提醒（静默，不阻塞）
    this.checkEventReminders && this.checkEventReminders();
  },

  checkStorageInit() {
    let events = wx.getStorageSync('events') || [];
    const notes = wx.getStorageSync('notes') || {};
    const reminders = wx.getStorageSync('reminders') || {};

    if (!wx.getStorageSync('initialized')) {
      // 首次启动，添加示例数据
      const sampleEvents = [
        {
          id: Date.now().toString(),
          title: '新年',
          date: '2026-01-01',
          type: 'festival',
          category: 'holiday',
          isCountdown: true,
          createdAt: Date.now()
        }
      ];
      wx.setStorageSync('events', sampleEvents);
      wx.setStorageSync('initialized', true);
      events = sampleEvents;
    }

    this.globalData = {
      events: events,
      notes: notes,
      reminders: reminders,
      userInfo: null,
      elderMode: false,
      privacyContractName: '用户隐私保护指引'
    };
  },

  applyDisplaySettings(page) {
    if (!page || typeof page.setData !== 'function') return;

    let settings = {};
    try {
      settings = wx.getStorageSync('settings') || {};
    } catch (e) {
      settings = {};
    }

    const elderMode = !!settings.elderMode;
    this.globalData.elderMode = elderMode;

    if (!page.data || page.data.elderMode !== elderMode) {
      page.setData({ elderMode });
    }
  }
});
