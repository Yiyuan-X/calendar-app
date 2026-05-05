const storage = require('../../utils/storage');
const meritUtil = require('../../utils/merit');
const chant = require('../../utils/chanting');
const share = require('../../utils/share');

Page({
  data: {
    stats: null,
    level: null,
    growthStats: null,
    recentRecords: [],
    categoryGoodList: [],
    categoryBadList: []
  },

  onLoad() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    this.loadStats();
  },

  onShow() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    this.loadStats();
  },

  loadStats() {
    const records = storage.getRecentMeritRecords(365);
    const meritRecords = storage.getMeritRecords();
    const chantingRecords = chant.getAllRecords();
    const stats = meritUtil.getMeritStats(records);
    const level = meritUtil.getMeritLevel(stats.totalNet);

    this.setData({
      stats,
      level,
      growthStats: this.buildGrowthStats(meritRecords, chantingRecords),
      recentRecords: records.slice(0, 30).map(record => this.formatRecord(record)),
      categoryGoodList: this.buildCategoryList(stats.categoryGood, meritUtil.GOOD_CATEGORIES),
      categoryBadList: this.buildCategoryList(stats.categoryBad, meritUtil.BAD_CATEGORIES)
    });
  },

  buildGrowthStats(meritRecords, chantingRecords) {
    const today = this.getDateStr(new Date());
    const monthPrefix = today.slice(0, 7);
    const activeDates = {};
    let monthCompleteDays = 0;
    let monthNet = 0;
    let chantingTotal = 0;

    Object.keys(meritRecords || {}).forEach(dateStr => {
      const record = meritRecords[dateStr] || {};
      const hasRecord = (record.items && record.items.length > 0) || !!record.note;
      if (hasRecord) activeDates[dateStr] = true;
      if (dateStr.indexOf(monthPrefix) === 0) {
        monthNet += meritUtil.calculateNetMerit(record);
      }
    });

    Object.keys(chantingRecords || {}).forEach(dateStr => {
      const day = chantingRecords[dateStr] || {};
      const dayTotal = Object.keys(day).reduce((sum, taskId) => sum + (Number(day[taskId]) || 0), 0);
      if (dayTotal > 0) activeDates[dateStr] = true;
      chantingTotal += dayTotal;
    });

    Object.keys(activeDates).forEach(dateStr => {
      if (dateStr.indexOf(monthPrefix) === 0) monthCompleteDays++;
    });

    const reminders = storage.getReminders();
    const eventReminderCount = Object.keys(reminders || {}).filter(id => {
      const item = reminders[id] || {};
      return item.enabled && (item.sourceType === 'event' || id.indexOf('event_') === 0);
    }).length;

    return {
      streakDays: this.getActiveStreakDays(activeDates, today),
      monthCompleteDays,
      monthNet,
      monthNetText: monthNet >= 0 ? '+' + monthNet : String(monthNet),
      chantingTotal,
      favoriteQuoteCount: storage.getFavoriteQuotes().length,
      eventReminderCount
    };
  },

  getActiveStreakDays(activeDates, todayStr) {
    let checkDate = todayStr;
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      if (!activeDates[checkDate]) break;
      streak++;
      checkDate = this.getPrevDateStr(checkDate);
    }
    return streak;
  },

  getDateStr(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  },

  getPrevDateStr(dateStr) {
    const parts = dateStr.split('-');
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    date.setDate(date.getDate() - 1);
    return this.getDateStr(date);
  },

  formatRecord(record) {
    const net = meritUtil.calculateNetMerit(record);
    const goodCount = (record.items || []).filter(item => item.type === 'good').length;
    const badCount = (record.items || []).filter(item => item.type === 'bad').length;
    return {
      dateStr: record.dateStr,
      dateText: record.dateStr ? record.dateStr.slice(5) : '',
      net,
      netText: net >= 0 ? '+' + net : String(net),
      goodCount,
      badCount,
      note: record.note || ''
    };
  },

  buildCategoryList(categoryStats, categories) {
    const nameMap = {};
    categories.forEach(cat => {
      nameMap[cat.id] = cat.name;
    });

    return Object.keys(categoryStats || {})
      .map(id => ({
        id,
        name: nameMap[id] || '其他',
        value: categoryStats[id]
      }))
      .sort((a, b) => b.value - a.value);
  },

  onShareAppMessage() {
    return share.appMessage({
      title: this.getPracticeShareTitle(),
      path: '/pages/merit-stats/merit-stats'
    });
  },

  onShareTimeline() {
    return share.timeline({
      title: this.getPracticeShareTitle()
    });
  },

  getPracticeShareTitle() {
    const growth = this.data.growthStats || {};
    const netText = growth.monthNetText || '+0';
    return `本月修心记录：完成 ${growth.monthCompleteDays || 0} 天，净善 ${netText}，念诵 ${growth.chantingTotal || 0} 次`;
  }
});
