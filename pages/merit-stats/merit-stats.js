const storage = require('../../utils/storage');
const meritUtil = require('../../utils/merit');
const share = require('../../utils/share');

Page({
  data: {
    stats: null,
    level: null,
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
    const stats = meritUtil.getMeritStats(records);
    const level = meritUtil.getMeritLevel(stats.totalNet);

    this.setData({
      stats,
      level,
      recentRecords: records.slice(0, 30).map(record => this.formatRecord(record)),
      categoryGoodList: this.buildCategoryList(stats.categoryGood, meritUtil.GOOD_CATEGORIES),
      categoryBadList: this.buildCategoryList(stats.categoryBad, meritUtil.BAD_CATEGORIES)
    });
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
    const stats = this.data.stats || {};
    const net = stats.totalNet || 0;
    return share.appMessage({
      title: `功德累计 ${net >= 0 ? '+' : ''}${net} · 岁时记`,
      path: '/pages/merit/merit'
    });
  },

  onShareTimeline() {
    const stats = this.data.stats || {};
    const net = stats.totalNet || 0;
    return share.timeline({
      title: `功德累计 ${net >= 0 ? '+' : ''}${net} · 岁时记`
    });
  }
});
