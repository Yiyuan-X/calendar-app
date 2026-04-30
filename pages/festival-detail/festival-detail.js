// pages/festival-detail/festival-detail.js
const storage = require('../../utils/storage');
const quotes = require('../../utils/quotes');
const share = require('../../utils/share');

Page({
  data: {
    festivalInfo: {},
    festivalQuote: '',
    daysAway: 0,
    categoryText: '',
    typeText: ''
  },

  onLoad(options) {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    if (options.data) {
      try {
        const festivalInfo = JSON.parse(decodeURIComponent(options.data));
        this.initPage(festivalInfo);
      } catch (e) {
        console.error('解析节日数据失败:', e);
      }
    }
  },

  /**
   * 初始化页面数据
   */
  initPage(festivalInfo) {
    // 计算距离天数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const festivalDate = new Date(festivalInfo.date.replace(/-/g, '/'));
    festivalDate.setHours(0, 0, 0, 0);
    const daysAway = Math.ceil((festivalDate - today) / (1000 * 60 * 60 * 24));

    // 获取金句
    let festivalQuote = '';
    if (festivalInfo.quote) {
      festivalQuote = festivalInfo.quote;
    } else {
      festivalQuote = quotes.getQuoteByFestival(festivalInfo.name);
    }

    // 分类文本映射
    const categoryMap = {
      'holiday': '节日',
      'commemorate': '纪念日',
      'traditional': '传统节日',
      'buddhist': '佛教纪念日',
      'other': '其他'
    };

    // 类型文本映射
    const typeMap = {
      'legal': '法定节日',
      'traditional': '传统节日',
      'common': '纪念日',
      'buddhist': '佛教纪念日'
    };

    // 预处理标签颜色类名
    const colorTagMap = {
      'red': 'tag-red',
      'purple': 'tag-purple',
      'gold': 'tag-gold',
      'pink': 'tag-pink',
      'blue': 'tag-blue'
    };
    const tagClass = colorTagMap[festivalInfo.color] || 'tag-blue';

    this.setData({
      festivalInfo: { ...festivalInfo, tagClass },
      festivalQuote,
      daysAway,
      categoryText: categoryMap[festivalInfo.category] || '节日',
      typeText: typeMap[festivalInfo.type] || festivalInfo.type || ''
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: festivalInfo.name || '节日详情'
    });
  },

  /**
   * 添加为重要日子
   */
  addAsEvent() {
    const { festivalInfo } = this.data;

    wx.navigateTo({
      url: `/pages/add-event/add-event?date=${festivalInfo.date}&title=${encodeURIComponent(festivalInfo.name)}`
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { festivalInfo, festivalQuote } = this.data;
    return {
      title: `${festivalInfo.name} · ${festivalQuote}`,
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    const { festivalInfo, festivalQuote } = this.data;
    return share.timeline({
      title: `${festivalInfo.name} · ${festivalQuote}`
    });
  }
});
