App({
  onLaunch() {
    // 检查本地存储初始化
    this.checkStorageInit();
  },

  checkStorageInit() {
    const events = wx.getStorageSync('events') || [];
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
    }

    // 全局数据
    this.globalData = {
      events: events,
      notes: notes,
      reminders: reminders,
      userInfo: null
    };
  },

  globalData: {
    events: [],
    notes: {},
    reminders: {}
  }
});
