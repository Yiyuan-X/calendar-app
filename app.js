/**
 * app.js — 岁时记入口
 * 初始化云开发、本地存储、隐私授权
 */
const cloud = require('./utils/cloud');
const privacy = require('./utils/privacy');
const storage = require('./utils/storage');
const reminderUtil = require('./utils/reminder');

App({
  onLaunch() {
    // 1. 初始化云开发（最先执行）
    cloud.initCloud();
    cloud.watchNetworkStatus();

    // 2. 检查本地存储初始化
    this.checkStorageInit();

    // 3. 首次重装/空本地时，稍后再拉云端，避免把云端数据误当空数据处理
    const restoreDelay = this.hasLocalChantingData() ? 0 : 800;
    setTimeout(() => {
      (async () => {
        try {
          await storage.restoreChantingDataFromCloud();
        } catch (e) {}
        storage.syncLocalDataToCloud();
      })();
    }, restoreDelay);
  },

  onShow() {
    // 检查事件提醒（静默，不阻塞）
    this.checkEventReminders();
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

  hasLocalChantingData() {
    try {
      const tasks = wx.getStorageSync('chanting_tasks') || [];
      const records = wx.getStorageSync('chanting_records') || {};
      const daily = wx.getStorageSync('chanting_daily') || {};
      return Array.isArray(tasks) && tasks.length > 0
        || (records && typeof records === 'object' && Object.keys(records).length > 0)
        || (daily && typeof daily === 'object' && Object.keys(daily).length > 0);
    } catch (e) {
      return false;
    }
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
  },

  checkEventReminders() {
    try {
      reminderUtil.showDueLocalReminder();
    } catch (e) {
      console.warn('检查本地提醒失败:', e);
    }
  },

  runDueReminderCheck() {
    reminderUtil.runDueReminderCheck();
  }
});
