// pages/index/index.js — 首页（日历 + 节日 + 倒计时 + 金句）
const calendarUtil = require('../../utils/calendar');
const storage = require('../../utils/storage');
const quotes = require('../../utils/quotes');
const solarTerms = require('../../utils/solar-terms');
const meritUtil = require('../../utils/merit');
const chant = require('../../utils/chanting');
const privacy = require('../../utils/privacy');
const share = require('../../utils/share');
const poster = require('../../utils/poster');
const analytics = require('../../utils/analytics');

Page({
  data: {
    // === 日历相关 ===
    currentYear: 0,
    currentMonth: 0,
    todayStr: '',
    weekDays: [
      { name: '日', isWeekend: true },
      { name: '一', isWeekend: false },
      { name: '二', isWeekend: false },
      { name: '三', isWeekend: false },
      { name: '四', isWeekend: false },
      { name: '五', isWeekend: false },
      { name: '六', isWeekend: true }
    ],
    calendarData: [],
    selectedDateStr: '',

    // === 今日信息 ===
    todayInfo: {},
    dailyQuote: '',
    dailyQuoteLines: [],
    dailyQuoteFavorited: false,
    todayFestivals: [],
    todayNote: null,

    // === 重要日子倒计时 ===
    upcomingEvents: [],

    // === 近期节日 ===
    upcomingFestivals: [],

    // === 节气养生 ===
    todaySolarTermName: '',
    todaySolarTermHealth: null,
    todaySolarTermPeriod: '',
    currentSolarTermName: '',
    currentSolarTermTip: '',
    currentSolarTermPeriod: '',

    // === 每日素食养生语录 ===
    dailyVegetarianTip: '',

    // === 功过格 ===
    meritTodayNet: null,
    showPrivacyAuthorization: false,
    privacyContractName: '用户隐私保护指引'
  },

  onLoad() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    this.initPage();
  },

  onShow() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    analytics.track('home_open');
    if (getApp().checkEventReminders) {
      getApp().checkEventReminders();
    }
    this.refreshData();
  },

  onPullDownRefresh() {
    this.refreshData();
    wx.stopPullDownRefresh();
  },

  // ==================== 工具方法 ====================

  getTagClass(color) {
    const map = { 'red': 'tag-red', 'purple': 'tag-purple', 'gold': 'tag-gold', 'pink': 'tag-pink', 'blue': 'tag-blue' };
    return map[color] || 'tag-blue';
  },

  getDotClass(category) {
    const map = { 'birthday': 'dot-pink', 'anniversary': 'dot-red', 'salary': 'dot-green', 'custom': 'dot-blue' };
    return map[category] || 'dot-blue';
  },

  getSubtitleText(isCountdown, daysAway) {
    if (!isCountdown) return '已过去';
    if (daysAway === 0) return '就是今天';
    if (daysAway === 1) return '明天';
    return '还有';
  },

  processFestivals(festivals) {
    if (!festivals || !festivals.length) return [];
    return festivals.map(f => ({ ...f, tagClass: this.getTagClass(f.color) }));
  },

  formatQuoteLines(quote) {
    const text = String(quote || '').trim();
    if (!text) return [];
    const maxLineLength = 11;
    const noBreakWords = [
      '价值', '财物', '快乐', '安详', '平安', '吉祥', '平稳', '安静',
      '慈悲', '智慧', '烦恼', '因缘', '感恩', '珍惜', '生命', '当下',
      '看破放下', '晴空万里', '心地安详', '世间一切'
    ];
    const getBreakIndex = segment => {
      let breakIndex = maxLineLength;
      const nextChar = segment.slice(breakIndex, breakIndex + 1);
      const pauseIndex = segment.slice(0, breakIndex).lastIndexOf('、');

      if (pauseIndex >= 4) {
        breakIndex = pauseIndex;
      } else if ('，。；、'.indexOf(nextChar) >= 0) {
        breakIndex += 1;
      }

      noBreakWords.some(word => {
        const wordStart = segment.indexOf(word);
        const wordEnd = wordStart + word.length;
        if (wordStart >= 0 && breakIndex > wordStart && breakIndex < wordEnd) {
          breakIndex = wordStart >= 3 ? wordStart : wordEnd;
          return true;
        }
        return false;
      });

      return breakIndex;
    };
    const parts = text
      .replace(/[「」]/g, '')
      .split(/([，。；])/)
      .reduce((lines, part) => {
        if (!part) return lines;
        if (/[，。；]/.test(part) && lines.length) {
          lines[lines.length - 1] += part;
          return lines;
        }
        lines.push(part);
        return lines;
      }, []);
    const mergedParts = parts.reduce((lines, part) => {
      const lastIndex = lines.length - 1;
      const last = lines[lastIndex] || '';
      if (last && last.length + part.length <= maxLineLength) {
        lines[lastIndex] = last + part;
      } else {
        lines.push(part);
      }
      return lines;
    }, []);

    return mergedParts.reduce((lines, part) => {
      let segment = part.trim();
      while (segment.length > maxLineLength) {
        const breakIndex = getBreakIndex(segment);
        lines.push(segment.slice(0, breakIndex));
        segment = segment.slice(breakIndex).replace(/^、/, '');
      }
      if (segment) lines.push(segment);
      return lines;
    }, []);
  },

  processEvents(events) {
    if (!events || !events.length) return [];
    const categoryNames = { birthday: '生日', anniversary: '纪念日', salary: '发薪日', custom: '自定义' };
    return events.map(e => {
      // 格式化目标日期显示
      let displayDate = '';
      if (e.date) {
        const d = new Date(e.date);
        if (!isNaN(d.getTime())) {
          displayDate = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        } else {
          // 如果date不是标准日期格式，尝试直接展示
          displayDate = String(e.date);
        }
      }
      // 名称兜底
      const eventName = e.name || e.title || '未命名事件';
      return {
        ...e,
        name: eventName, // 确保name字段存在
        dotClass: this.getDotClass(e.category),
        subtitleText: this.getSubtitleText(e.isCountdown, e.daysAway),
        categoryName: categoryNames[e.category] || '自定义',
        displayDate: displayDate
      };
    });
  },

  // ==================== 日历生成（与日历页统一逻辑） ====================

  generateCalendar() {
    const { currentYear, currentMonth } = this.data;
    const calData = calendarUtil.getMonthCalendar(currentYear, currentMonth);

    // 获取当月所有重要日子索引
    const allEvents = storage.getEvents() || [];
    const eventIndex = {};
    allEvents.forEach(ev => {
      if (!ev.date) return;
      const normalized = ev.date.replace(/\//g, '-');
      if (!eventIndex[normalized]) eventIndex[normalized] = [];
      eventIndex[normalized].push(ev);
    });

    const processedData = calData.map(item => {
      // === 基础状态 ===
      let hasFestival = !!(item.festival && item.festival.length > 0);
      let hasBuddhist = !!(item.festival && item.festival.some(f => f.type === 'buddhist'));
      let hasRedFestival = !!(item.festival && item.festival.some(f => f.color === 'red'));
      let hasGoldFestival = !!(item.festival && item.festival.some(f => f.color === 'gold'));

      // === 重要日子标记 ===
      const dayEvents = eventIndex[item.dateStr] || [];
      const hasEvent = dayEvents.length > 0;

      // === 预处理节日颜色类名 ===
      let festivalMarkerClass = '';
      if (hasFestival && item.festival[0]) {
        const color = item.festival[0].color;
        festivalMarkerClass = color === 'red' ? 'festival-red' : (color === 'purple' ? 'festival-purple' : 'festival-gold');
      }

      // === 预处理标记文字（重要日子 > 节气 > 节日名称(最短优先) > 农历日期） ===
      let markerText = '';
      let markerType = '';

      if (item.isCurrentMonth) {
        // 最高优先级：有重要日子时显示事件名称
        if (hasEvent && dayEvents[0]) {
          const evName = dayEvents[0].name || dayEvents[0].title || '';
          markerText = evName.length > 4 ? evName.substring(0, 3) + '..' : evName;
          markerType = 'event';
        } else if (item.solarTerm && item.solarTerm.name) {
          markerText = item.solarTerm.name;
          markerType = 'solar-term';
        } else if (hasFestival && item.festival[0] && item.festival[0].name) {
          // 按名称长度排序，选最短的节日名显示
          const sortedFests = [...item.festival].sort((a, b) => {
            const nameA = (a.shortName || a.name || '');
            const nameB = (b.shortName || b.name || '');
            return nameA.length - nameB.length;
          });
          const fest = sortedFests[0];
          const displayName = fest.shortName || fest.name || '';
          const nameLen = displayName.length;
          if (nameLen > 4) {
            markerText = displayName.substring(0, 3);
          } else {
            markerText = displayName;
          }
          markerType = 'festival';
        } else if (item.lunar && item.lunar.dayStr) {
          // 农历日期：初一/十五/三十 显示完整，其他取末字
          if (item.lunar.dayStr === '初一') {
            markerText = (item.lunar.monthStr || '') + '月';
          } else {
            markerText = item.lunar.dayStr;
          }
          markerType = 'lunar';
        }
      }

      // === 预处理多节日圆点 ===
      let showMultiDots = ((hasFestival && item.festival.length > 1) || dayEvents.length > 1) && item.isCurrentMonth;

      // === 预处理格子样式类名 ===
      const cellClasses = [
        'day-cell',
        item.isCurrentMonth ? 'current-month' : 'other-month',
        item.isToday ? 'today' : '',
        item.dateStr === this.data.selectedDateStr ? 'selected' : '',
        hasFestival ? 'has-festival' : '',
        hasBuddhist ? 'has-buddhist' : '',
        hasEvent ? 'has-event' : ''
      ].filter(Boolean).join(' ');

      return {
        ...item,
        // 标记状态
        hasFestival,
        hasBuddhist,
        hasRedFestival,
        hasGoldFestival,
        festivalMarkerClass,
        hasEvent: hasEvent,
        eventCount: dayEvents.length,
        // 预处理的显示文字
        markerText: markerText,
        markerType: markerType,
        showMultiDots: showMultiDots,
        // 样式
        cellClass: cellClasses
      };
    });

    this.setData({ calendarData: processedData });
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 1) { currentMonth = 12; currentYear--; }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  goToToday() {
    const now = new Date();

    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    this.generateCalendar();
    this.setData({ selectedDateStr: this.data.todayStr });
  },

  onDayTap(e) {
    const dateStr = e.currentTarget.dataset.date;
    const info = e.currentTarget.dataset.info;

    if (!info.isCurrentMonth) {
      if (info.isPrevMonth) this.prevMonth(); else this.nextMonth();
      setTimeout(() => { this.setData({ selectedDateStr: dateStr }); }, 50);
      return;
    }

    this.setData({ selectedDateStr: dateStr });
    this.generateCalendar(); // 更新选中状态
  },

  // ==================== 数据加载 ====================

  /** 获取节气时间段（从当前节气到下一个节气的日期范围） */
  _getSolarTermPeriod(year, month, day) {
    try {
      const nearby = solarTerms.getNearbySolarTerms(year, month, day);
      const currentTerm = nearby.prev || nearby.next;
      const nextTerm = nearby.next || nearby.prev;
      if (currentTerm && nextTerm) {
        return `${currentTerm.year || year}年${currentTerm.month}月${currentTerm.day}日 — ${nextTerm.year || year}年${nextTerm.month}月${nextTerm.day}日`;
      } else if (currentTerm) {
        return `${currentTerm.month}月起`;
      }
    } catch(e) {}
    return '';
  },

  initPage() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${calendarUtil.padZero(now.getMonth() + 1)}-${calendarUtil.padZero(now.getDate())}`;
    const todayInfo = calendarUtil.getTodayInfo();
    const dailyQuote = quotes.getDailyQuote();

    // 获取今日节气信息
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const todayST = solarTerms.getTodaySolarTerm(year, month, day);
    let todaySolarTermName = '';
    let todaySolarTermHealth = null;
    let todaySolarTermPeriod = '';
    if (todayST) {
      todaySolarTermName = todayST.name;
      todaySolarTermHealth = solarTerms.getSolarTermHealth(todayST.name, { randomTip: true });
      todaySolarTermPeriod = this._getSolarTermPeriod(year, month, day);
    }

    // 获取当前节气（非当天时显示简短提示）
    let currentSolarTermName = '';
    let currentSolarTermTip = '';
    let currentSolarTermPeriod = '';
    if (!todayST) {
      const nearby = solarTerms.getNearbySolarTerms(year, month, day);
      const currentTerm = nearby.prev || nearby.next;
      if (currentTerm) {
        currentSolarTermName = currentTerm.name;
        currentSolarTermTip = solarTerms.getRandomSolarTermHealthTip(currentTerm.name) || '顺应天时，调和身心';
        currentSolarTermPeriod = this._getSolarTermPeriod(year, month, day);
      }
    }

    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      todayStr,
      selectedDateStr: todayStr,
      todayInfo,
      dailyQuote,
      dailyQuoteLines: this.formatQuoteLines(dailyQuote),
      dailyQuoteFavorited: storage.isQuoteFavorited(dailyQuote),
      todayFestivals: this.processFestivals(todayInfo.festivals),
      todayNote: storage.getNoteByDate(todayStr),
      // 节气养生数据
      todaySolarTermName,
      todaySolarTermHealth,
      todaySolarTermPeriod,
      currentSolarTermName,
      currentSolarTermTip,
      currentSolarTermPeriod,

      // 每日素食养生语录
      dailyVegetarianTip: solarTerms.getDailyVegetarianTip()
    });

    this.generateCalendar();
    this.loadUpcomingEvents();
    this.loadUpcomingFestivals();

    // 加载今日积善数据
    this.loadTodayMerit();
  },

  /**
   * 加载今日净善
   */
  loadTodayMerit() {
    const todayRecord = storage.getMeritRecordByDate(this.data.todayStr);
    if (todayRecord && todayRecord.items) {
      this.setData({ meritTodayNet: meritUtil.calculateNetMerit(todayRecord) });
    } else {
      this.setData({ meritTodayNet: null });
    }
  },

  refreshData() {
    const todayInfo = calendarUtil.getTodayInfo();

    this.setData({
      todayInfo,
      todayFestivals: this.processFestivals(todayInfo.festivals),
      todayNote: storage.getNoteByDate(todayInfo.dateStr)
    });

    if (Math.random() > 0.7) {
      const dailyQuote = quotes.getDailyQuote();
      this.setData({
        dailyQuote,
        dailyQuoteLines: this.formatQuoteLines(dailyQuote),
        dailyQuoteFavorited: storage.isQuoteFavorited(dailyQuote)
      });
    }

    // 刷新每日素食养生语录
    try {
      this.setData({ dailyVegetarianTip: solarTerms.getDailyVegetarianTip() });
    } catch(e) {
      console.error('刷新每日素食语录失败:', e);
    }

    this.refreshSolarTermTip();

    this.loadUpcomingEvents();
    this.loadUpcomingFestivals();
  },

  refreshSolarTermTip() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const todayST = solarTerms.getTodaySolarTerm(year, month, day);

      if (todayST) {
        this.setData({
          todaySolarTermHealth: solarTerms.getSolarTermHealth(todayST.name, { randomTip: true })
        });
        return;
      }

      const nearby = solarTerms.getNearbySolarTerms(year, month, day);
      const currentTerm = nearby.prev || nearby.next;
      if (currentTerm) {
        this.setData({
          currentSolarTermTip: solarTerms.getRandomSolarTermHealthTip(currentTerm.name) || '顺应天时，调和身心'
        });
      }
    } catch (e) {
      console.error('刷新节气提示失败:', e);
    }
  },

  loadUpcomingEvents() {
    const events = storage.getUpcomingEvents(10);
    this.setData({ upcomingEvents: this.processEvents(events) });
  },

  /**
   * 加载即将到来的节日（展开为平铺列表，每个节日一行）
   */
  loadUpcomingFestivals() {
    const { year, month, day } = this.data.todayInfo;
    // 读取用户设置，控制近期节日中是否包含六斋日/初一/十五/纪念日
    const festOpts = {
      showLiuZhai: storage.getSetting('showLiuZhai'),
      showLunarFestivals: storage.getSetting('showLunarFestivals'),
      showBuddhistFestivals: storage.getSetting('showBuddhistFestivals')
    };
    const rawList = require('../../utils/festivals').getUpcomingFestivals(year, month, day, 45, festOpts);

    // 将嵌套的 festivals 数组展平为单层列表
    const flatList = [];
    rawList.forEach(item => {
      if (item.daysAway < 0 || item.daysAway > 45) return;
      (item.festivals || []).forEach(f => {
        // 预处理日期（WXML不支持split方法）
        const dateParts = (item.date || '').split('-');
        const festMonth = dateParts[1] ? parseInt(dateParts[1], 10) + '月' : '';
        const festDay = dateParts[2] || '';

        // 名称兜底：优先 name，其次 shortName，最后用 type 拼接
        let displayName = f.name || f.shortName || '';
        if (!displayName && f.type) {
          const typeMap = { legal: '法定节日', traditional: '传统节日', buddhist: '佛教纪念日', common: '纪念日', solarTerm: '节气' };
          displayName = typeMap[f.type] || '节日';
        }

        flatList.push({
          ...f,
          date: item.date,
          daysAway: item.daysAway,
          dayOfWeek: item.dayOfWeek,
          // 预处理所有显示文本（避免WXML中调用JS方法）
          displayName: displayName,
          displayDesc: f.description || '',
          lunarDateText: f.lunarDate || '',
          typeLabel: this.getFestivalTypeLabel(f.type),
          chipColor: f.color === 'red' ? 'chip-red' : (f.color === 'purple' ? 'chip-purple' : (f.color === 'pink' ? 'chip-pink' : 'chip-gold')),
          // 预处理日期显示
          festMonth: festMonth,
          festDay: festDay,
          // 倒计时文字预处理：和“重要日子”保持同一阅读方式
          countdownPrefix: item.daysAway === 0 ? '今天' : '还有',
          countdownDays: item.daysAway > 0 ? item.daysAway : '',
          countdownUnit: item.daysAway > 0 ? '天' : '',
          countdownClass: item.daysAway === 0 ? 'fc-today' : (item.daysAway <= 7 ? 'fc-soon' : 'fc-normal')
        });
      });
    });

    this.setData({ upcomingFestivals: flatList.slice(0, 10) });
  },

  /**
   * 获取节日类型中文标签
   */
  getFestivalTypeLabel(type) {
    const map = {
      legal: '法定', traditional: '传统', buddhist: '佛教',
      common: '纪念', solarTerm: '节气'
    };
    return map[type] || '';
  },

  // ==================== 页面跳转 ====================

  goToAddEvent() {
    wx.navigateTo({ url: '/pages/add-event/add-event' });
  },

  goToEditEvent(e) {
    const event = e.currentTarget.dataset.event;
    wx.navigateTo({ url: `/pages/add-event/add-event?id=${event.id}` });
  },

  onDeleteEvent(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个重要日子吗？',
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          storage.deleteEvent(id);
          this.loadUpcomingEvents();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  },

  goToFestivalDetail(e) {
    const festival = e.currentTarget.dataset.festival;
    if (!festival) return;
    wx.navigateTo({
      url: `/pages/festival-detail/festival-detail?data=${encodeURIComponent(JSON.stringify(festival))}`
    });
  },

  goToNotes(e) {
    const date = e.currentTarget.dataset.date || this.data.todayInfo.dateStr;
    wx.navigateTo({ url: `/pages/notes/notes?date=${date}` });
  },

  goToAddEventWithDate() {
    const date = this.data.selectedDateStr || this.data.todayStr;
    if (!date) return;
    wx.navigateTo({ url: `/pages/add-event/add-event?date=${date}` });
  },

  goToCalendarPage() {
    // 切换到日历 Tab
    // 由于当前已在今日Tab，这里可以跳转到日历的完整页面
    wx.switchTab({ url: '/pages/calendar/calendar' });
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

goToMerit() {
  wx.switchTab({ url: '/pages/merit/merit' });
},

  toggleDailyQuoteFavorite() {
    const result = storage.toggleFavoriteQuote(this.data.dailyQuote);
    analytics.track('quote_favorite', {
      favorited: result.favorited,
      quote: this.data.dailyQuote
    });
    this.setData({ dailyQuoteFavorited: result.favorited });
    wx.showToast({
      title: result.favorited ? '已收藏' : '已取消收藏',
      icon: 'none'
    });
  },

  onDailyQuoteTap() {
    analytics.track('daily_quote_click', {
      quote: this.data.dailyQuote
    });
  },

  // ==================== 分享 ====================

  onShareAppMessage(options) {
    const shareType = options && options.target && options.target.dataset
      ? options.target.dataset.shareType
      : '';
    analytics.track('content_share', {
      page: 'index',
      shareType: shareType || 'default'
    });
    return {
      title: this.getShareAssetTitle(shareType),
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return share.timeline({
      title: this.getShareAssetTitle('almanac')
    });
  },

  getShareAssetTitle(type) {
    const todayInfo = this.data.todayInfo || {};
    const month = todayInfo.month || '';
    const day = todayInfo.day || '';
    const quote = this.data.dailyQuote || '';

    if (type === 'quote') {
      return `今日一句：${quote}`;
    }

    if (type === 'buddhist') {
      const item = this.getShareFestival('buddhist');
      if (item) return this.formatCountdownShareTitle(item.displayName || item.name, item.daysAway, '静心准备');
      return `今日一句：${quote}`;
    }

    if (type === 'event') {
      const event = (this.data.upcomingEvents || []).find(item => item.category === 'anniversary') || (this.data.upcomingEvents || [])[0];
      if (event) return this.formatCountdownShareTitle(event.name, event.daysAway, '记得提前准备');
      return `${month}月${day}日 今日提醒：记得记录重要日子`;
    }

    if (type === 'practice') {
      return this.getMonthPracticeShareTitle();
    }

    const termName = this.data.todaySolarTermName || this.data.currentSolarTermName || '';
    const tip = this.data.currentSolarTermTip || (this.data.todaySolarTermHealth && this.data.todaySolarTermHealth.tip) || '宜静心养身';
    if (termName) return `${month}月${day}日 ${termName}提醒：${this.trimShareText(tip, 16)}`;
    return `${month}月${day}日 今日黄历：${todayInfo.lunarMonth || ''}${todayInfo.lunarDay || ''}`;
  },

  getShareFestival(type) {
    const today = (this.data.todayFestivals || []).find(item => item.type === type);
    if (today) return { ...today, displayName: today.name, daysAway: 0 };
    return (this.data.upcomingFestivals || []).find(item => item.type === type);
  },

  formatCountdownShareTitle(name, daysAway, actionText) {
    if (!name) return '今日提醒 · 岁时记';
    if (daysAway === 0) return `${name}就是今天，${actionText}`;
    if (daysAway === 1) return `明天是${name}，${actionText}`;
    return `距离${name}还有 ${daysAway} 天，${actionText}`;
  },

  getMonthPracticeShareTitle() {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${calendarUtil.padZero(now.getMonth() + 1)}`;
    const records = storage.getMeritRecords();
    const chantingRecords = chant.getAllRecords();
    let completeDays = {};
    let monthNet = 0;
    let chantingTotal = 0;

    Object.keys(records || {}).forEach(dateStr => {
      const record = records[dateStr] || {};
      if (dateStr.indexOf(monthPrefix) === 0) {
        monthNet += meritUtil.calculateNetMerit(record);
        if ((record.items && record.items.length > 0) || record.note) completeDays[dateStr] = true;
      }
    });

    Object.keys(chantingRecords || {}).forEach(dateStr => {
      const dayRecord = chantingRecords[dateStr] || {};
      const dayTotal = Object.keys(dayRecord).reduce((sum, id) => sum + (Number(dayRecord[id]) || 0), 0);
      chantingTotal += dayTotal;
      if (dateStr.indexOf(monthPrefix) === 0 && dayTotal > 0) completeDays[dateStr] = true;
    });

    const netText = monthNet >= 0 ? `+${monthNet}` : String(monthNet);
    return `本月修心记录：完成 ${Object.keys(completeDays).length} 天，净善 ${netText}，念诵 ${chantingTotal} 次`;
  },

  trimShareText(text, maxLength) {
    const value = String(text || '').replace(/[【】]/g, '').trim();
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  },

  /** 分享到朋友圈 */
  shareToMoments() {
    this.generateShareImage({}, function(res) {
      if (res.success) {
        wx.previewImage({ urls: [res.tempFilePath], current: res.tempFilePath });
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  /** 保存到相册 */
  saveImage() {
    var that = this;
    this.generateShareImage({}, function(res) {
      if (res.success) {
        privacy.ensurePrivacyAuthorized({
          success: function() {
            that.saveImageToAlbum(res.tempFilePath);
          }
        });
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  showDailySignOptions() {
    var that = this;
    wx.showActionSheet({
      itemList: ['只分享金句', '展示今日备忘录', '展示今日反省'],
      success: function(res) {
        var modes = ['quote', 'note', 'reflection'];
        var mode = modes[res.tapIndex] || 'quote';
        that.generateShareImage({ mode: mode }, function(result) {
          if (result.success) {
            wx.previewImage({ urls: [result.tempFilePath], current: result.tempFilePath });
          } else {
            wx.showToast({ title: '生成失败', icon: 'none' });
          }
        });
      }
    });
  },

  saveImageToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: function() { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
      fail: function(err) {
        if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
          wx.showModal({
            title: '提示', content: '需要您授权保存相册权限',
            confirmText: '去设置',
            success: function(modalRes) { if (modalRes.confirm) wx.openSetting(); }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  openPrivacyContract() {
    privacy.openPrivacyContract();
  },

  onAgreePrivacyAuthorization(e) {
    privacy.agreePrivacyAuthorization(this, e.detail);
  },

  onDisagreePrivacyAuthorization() {
    privacy.disagreePrivacyAuthorization(this);
  },

  noop() {},

  /** 生成分享海报（首页版 — 含节气卡片 / 今日签内容 + 自定义二维码） */
  generateShareImage(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};
    var that = this;
    var ti = this.data.todayInfo;
    var quote = this.data.dailyQuote || '';
    var festivals = this.data.todayFestivals || [];
    var mode = options.mode || 'home';
    var isDailySign = mode === 'quote' || mode === 'note' || mode === 'reflection';
    var signExtra = this._getDailySignExtra(mode);
    // 节气数据
    var stName = that.data.todaySolarTermName || that.data.currentSolarTermName || '';
    var stHealth = that.data.todaySolarTermHealth || null;
    var stPeriod = that.data.todaySolarTermPeriod || that.data.currentSolarTermPeriod || '';
    var vegTip = that.data.dailyVegetarianTip || '';

    wx.showLoading({ title: '正在生成...' });

    var query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec(function(res) {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading(); callback({ success: false }); return;
      }

      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getSystemInfoSync().pixelRatio;

      // 根据是否有节气内容动态调整高度
      var hasSTContent = !!(stName && (stHealth || stPeriod));
      var W = 500, H = isDailySign ? (signExtra ? 740 : 640) : (hasSTContent ? 780 : 650);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      try {
        // ===== 背景 =====
        var bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#FFF8E7'); bgGrad.addColorStop(1, '#FFF3D6');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

        // 边框
        ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, W - 30, H - 30);

        // ===== 标题 =====
        ctx.fillStyle = '#8B6914'; ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(isDailySign ? '今日签 · 岁时记' : '今日 · 岁时记', W / 2, 58);

        // ===== 日期 =====
        ctx.fillStyle = '#5D4037'; ctx.font = '28px sans-serif';
        ctx.fillText((ti.year || '') + '年' + (ti.month || '') + '月' + (ti.day || '') + '日', W / 2, 98);

        // 农历
        ctx.fillStyle = '#A08520'; ctx.font = '22px sans-serif';
        ctx.fillText((ti.lunarMonth || '') + (ti.lunarDay || ''), W / 2, 130);

        // 节日标签
        var curY = 164;
        if (festivals.length > 0) {
          ctx.fillStyle = '#D93B3B'; ctx.font = '19px sans-serif';
          var festNames = festivals.map(function(f) { return f.name; }).join(' · ');
          ctx.fillText(festNames, W / 2, curY);
          curY += 28;
        }

        // ===== 金句区域 =====
        ctx.fillStyle = '#6D5A2E'; ctx.font = 'bold 25px sans-serif';
        ctx.textAlign = 'center';
        var quoteY = curY + 48;
        that._wrapText(ctx, '「' + quote + '」', 52, quoteY, W - 104, 34, true);

        if (isDailySign) {
          var extraY = quoteY + (quote.length > 18 ? 96 : 62);
          if (signExtra) {
            that._drawSignExtra(ctx, signExtra, 38, extraY, W - 76);
          } else if (mode !== 'quote') {
            ctx.fillStyle = '#A08520'; ctx.font = '20px sans-serif';
            ctx.fillText(mode === 'note' ? '今日还没有备忘录' : '今日还没有反省记录', W / 2, extraY + 42);
          }
        }

        // ===== 节气卡片（紧凑版） =====
        if (!isDailySign && hasSTContent) {
          var cardX = 30, cardW = W - 60;
          var cardY = curY + 78;
          var cardPadding = 18;

          // 卡片背景（圆角矩形）
          ctx.fillStyle = 'rgba(255, 252, 240, 0.9)';
          that._drawRoundRect(ctx, cardX, cardY, cardW, 230, 14);
          ctx.fill();

          // 左侧金色竖条
          ctx.fillStyle = '#FFB300';
          ctx.fillRect(cardX, cardY, 4, 230);

          // 节气标题行
          var ty = cardY + 32;
          ctx.fillStyle = '#5D4037'; ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('当前节气：' + stName, cardX + cardPadding, ty);

          // 时间段
          if (stPeriod) {
            ty += 30;
            ctx.fillStyle = '#B8860B'; ctx.font = '20px sans-serif';
            ctx.fillText(stPeriod, cardX + cardPadding, ty);
          }

          // 养生描述
          if (stHealth) {
            if (stHealth.desc) {
              ty += 30;
              ctx.fillStyle = '#374151'; ctx.font = '19px sans-serif';
              that._wrapText(ctx, stHealth.desc, cardX + cardPadding, ty, cardW - cardPadding * 2, 26);
            }
            if (stHealth.health) {
              ty += 30;
              ctx.fillStyle = '#4B5563'; ctx.font = '18px sans-serif';
              that._wrapText(ctx, stHealth.health, cardX + cardPadding, ty, cardW - cardPadding * 2, 25);
            }
          }

          // 今日推荐（vegTip 已自带【今日推荐】前缀，不再重复绘制标题）
          if (vegTip) {
            ty += 34;
            ctx.fillStyle = '#4B5563'; ctx.font = '19px sans-serif';
            that._wrapText(ctx, vegTip, cardX + cardPadding, ty, cardW - cardPadding * 2, 29);
          }
        }

        // ===== 底部品牌 =====
        ctx.textAlign = 'center';
        ctx.fillStyle = '#AEAEB2'; ctx.font = '15px sans-serif';
        ctx.fillText('— 岁时记 · 记录时光 —', W / 2, H - 46);
        ctx.font = '12px sans-serif';
        ctx.fillText('长按识别小程序码查看更多', W / 2, H - 24);

        // 使用自定义二维码图片
        poster.drawPromotionCode(canvas, ctx, {
          x: W - 110, y: H - 140, size: 72,
          src: '/images/PQ_today.png'
        }, function() {
          setTimeout(function() {
            wx.canvasToTempFilePath({
              canvas: canvas, width: W, height: H,
              destWidth: W * 2, destHeight: H * 2,
              fileType: 'jpg', quality: 0.95,
              success: function(saveRes) {
                analytics.track('poster_generate', {
                  page: 'index',
                  mode: mode
                });
                wx.hideLoading(); callback({ success: true, tempFilePath: saveRes.tempFilePath });
              },
              fail: function(err) {
                console.error('canvasToTempFilePath 失败:', err);
                wx.hideLoading(); callback({ success: false });
              }
            });
          }, 100);
        });
      } catch (e) {
        console.error('绘制出错:', e); wx.hideLoading(); callback({ success: false });
      }
    });
  },

  /** 绘制圆角矩形路径 */
  _drawRoundRect: function(ctx, x, y, w, h, r) {
    r = r || 8;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x + r, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  /** 文字自动换行绘制 */
  _wrapText: function(ctx, text, x, y, maxWidth, lineHeight, center) {
    if (!text) return y;
    var chars = text.split('');
    var line = '';
    var curY = y;
    for (var i = 0; i < chars.length; i++) {
      var testLine = line + chars[i];
      var metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line.length > 0) {
        ctx.fillText(line, center ? x + maxWidth / 2 : x, curY);
        line = chars[i];
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, center ? x + maxWidth / 2 : x, curY);
      curY += lineHeight;
    }
    return curY;
  },

  _getDailySignExtra: function(mode) {
    var dateStr = this.data.todayStr || (this.data.todayInfo && this.data.todayInfo.dateStr) || '';
    if (mode === 'note') {
      var note = storage.getNoteByDate(dateStr);
      var noteText = note && note.content ? String(note.content).trim() : '';
      return noteText ? { label: '今日备忘录', text: noteText } : null;
    }
    if (mode === 'reflection') {
      var record = storage.getMeritRecordByDate(dateStr);
      var reflection = record && record.note ? String(record.note).trim() : '';
      return reflection ? { label: '今日反省', text: reflection } : null;
    }
    return null;
  },

  _drawSignExtra: function(ctx, extra, x, y, w) {
    this._drawRoundRect(ctx, x, y, w, 178, 14);
    ctx.fillStyle = 'rgba(255, 252, 240, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.24)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#B8860B';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(extra.label, x + 20, y + 34);

    ctx.fillStyle = '#4B5563';
    ctx.font = '19px sans-serif';
    this._wrapText(ctx, extra.text.slice(0, 90), x + 20, y + 68, w - 40, 28);
  }
});
