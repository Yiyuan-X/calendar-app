App({
  onLaunch() {
    // 检查本地存储初始化
    this.checkStorageInit();
    this.initPrivacyAuthorization();
  },

  onShow() {
    setTimeout(() => {
      this.checkEventReminders();
    }, 800);
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

    // 全局数据
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
  },

  checkEventReminders() {
    try {
      const events = wx.getStorageSync('events') || [];
      const enabledEvents = events.filter(event => event && event.remind && event.date);
      if (!enabledEvents.length) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = this.formatDate(today);
      const remindKey = 'event_reminder_shown_' + todayStr;
      if (wx.getStorageSync(remindKey)) return;

      const upcoming = enabledEvents
        .map(event => {
          const target = this.parseDate(event.date);
          if (!target) return null;
          target.setHours(0, 0, 0, 0);
          const daysAway = Math.round((target - today) / 86400000);
          return { ...event, daysAway };
        })
        .filter(event => event && event.daysAway >= 0 && event.daysAway <= 7)
        .sort((a, b) => a.daysAway - b.daysAway);

      if (!upcoming.length) return;

      const lines = upcoming.slice(0, 3).map(event => {
        const name = event.name || event.title || '重要日子';
        const dayText = event.daysAway === 0 ? '今天' : event.daysAway + '天后';
        return `${dayText}：${name}`;
      });

      wx.setStorageSync(remindKey, true);
      wx.showModal({
        title: '重要日子提醒',
        content: lines.join('\n'),
        showCancel: false,
        confirmText: '知道了'
      });
    } catch (e) {
      // 打开提醒失败不影响主流程
    }
  },

  parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = String(dateStr).replace(/\//g, '-').split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return isNaN(date.getTime()) ? null : date;
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  initPrivacyAuthorization() {
    if (typeof wx.getPrivacySetting === 'function') {
      wx.getPrivacySetting({
        success: (res) => {
          if (res && res.privacyContractName) {
            this.globalData.privacyContractName = res.privacyContractName;
          }
        }
      });
    }

    if (typeof wx.onNeedPrivacyAuthorization !== 'function') return;

    wx.onNeedPrivacyAuthorization((resolve) => {
      const pages = getCurrentPages();
      const currentPage = pages && pages.length ? pages[pages.length - 1] : null;
      if (!currentPage || typeof currentPage.setData !== 'function') {
        resolve({ event: 'disagree' });
        return;
      }

      currentPage.__privacyResolve = resolve;
      currentPage.setData({
        showPrivacyAuthorization: true,
        privacyContractName: this.globalData.privacyContractName || '用户隐私保护指引'
      });
    });
  },

  globalData: {
    events: [],
    notes: {},
    reminders: {},
    elderMode: false,
    privacyContractName: '用户隐私保护指引'
  }
});
