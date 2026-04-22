// pages/index/index.js — 首页（日历 + 节日 + 倒计时 + 金句）
const calendarUtil = require('../../utils/calendar');
const storage = require('../../utils/storage');
const quotes = require('../../utils/quotes');
const solarTerms = require('../../utils/solar-terms');

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
    todayFestivals: [],
    todayNote: null,

    // === 重要日子倒计时 ===
    upcomingEvents: [],

    // === 近期节日 ===
    upcomingFestivals: [],

    // === 功过格 ===
    meritTodayNet: null
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
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

  processEvents(events) {
    if (!events || !events.length) return [];
    const categoryNames = { birthday: '生日', anniversary: '纪念日', salary: '发薪日', custom: '自定义' };
    return events.map(e => {
      // 格式化目标日期显示
      let displayDate = '';
      if (e.date) {
        const d = new Date(e.date);
        if (!isNaN(d.getTime())) {
          displayDate = `${d.getMonth() + 1}月${d.getDate()}日`;
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

  initPage() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${calendarUtil.padZero(now.getMonth() + 1)}-${calendarUtil.padZero(now.getDate())}`;
    const todayInfo = calendarUtil.getTodayInfo();

    // 获取今日节气信息
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const todayST = solarTerms.getTodaySolarTerm(year, month, day);
    let todaySolarTermName = '';
    let todaySolarTermHealth = null;
    if (todayST) {
      todaySolarTermName = todayST.name;
      todaySolarTermHealth = solarTerms.getSolarTermHealth(todayST.name);
    }

    // 获取当前节气（非当天时显示简短提示）
    let currentSolarTermName = '';
    let currentSolarTermTip = '';
    if (!todayST) {
      const nearby = solarTerms.getNearbySolarTerms(year, month, day);
      const currentTerm = nearby.prev || nearby.next;
      if (currentTerm) {
        currentSolarTermName = currentTerm.name;
        currentSolarTermTip = solarTerms.getSolarTermHealthTip(currentTerm.name) || '顺应天时，调和身心';
      }
    }

    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      todayStr,
      selectedDateStr: todayStr,
      todayInfo,
      dailyQuote: quotes.getDailyQuote(),
      todayFestivals: this.processFestivals(todayInfo.festivals),
      todayNote: storage.getNoteByDate(todayStr),
      // 节气养生数据
      todaySolarTermName,
      todaySolarTermHealth,
      currentSolarTermName,
      currentSolarTermTip
    });

    this.generateCalendar();
    this.loadUpcomingEvents();
    this.loadUpcomingFestivals();

    // 加载今日功过格数据
    this.loadTodayMerit();
  },

  /**
   * 加载今日功过格净功德
   */
  loadTodayMerit() {
    const todayRecord = storage.getMeritRecordByDate(this.data.todayStr);
    if (todayRecord && todayRecord.items) {
      let net = 0;
      todayRecord.items.forEach(item => {
        if (item.type === 'good') net += (item.merit || 0);
        else net -= (item.demerit || 0);
      });
      this.setData({ meritTodayNet: net });
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
      this.setData({ dailyQuote: quotes.getDailyQuote() });
    }

    this.loadUpcomingEvents();
    this.loadUpcomingFestivals();
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
    // 读取用户设置，控制近期节日中是否包含六斋日/初一/十五/佛教纪念日
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
          // 倒计时文字预处理
          countdownText: item.daysAway === 0 ? '今天' : (item.daysAway === 1 ? '明天' : (item.daysAway <= 7 ? item.daysAway + '天后' : item.daysAway + '天')),
          countdownClass: item.daysAway === 0 ? '' : (item.daysAway === 1 ? 'fc-tomorrow' : (item.daysAway <= 7 ? 'fc-soon' : 'fc-normal'))
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
    const date = this.data.todayInfo.dateStr || this.data.todayStr;
    wx.navigateTo({ url: `/pages/merit/merit?date=${date}` });
  },

  // ==================== 分享 ====================

  onShareAppMessage() {
    const { todayInfo, dailyQuote } = this.data;
    return {
      title: `${todayInfo.month}月${todayInfo.day}日 · ${dailyQuote}`,
      path: '/pages/index/index'
    };
  }
});
