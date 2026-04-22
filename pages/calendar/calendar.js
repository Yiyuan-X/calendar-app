// pages/calendar/calendar.js
const calendarUtil = require('../../utils/calendar');
const storage = require('../../utils/storage');
const solarTerms = require('../../utils/solar-terms');
const huangli = require('../../utils/huangli');

Page({
  data: {
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
    selectedDate: null,
    selectedNote: null
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      todayStr: `${now.getFullYear()}-${calendarUtil.padZero(now.getMonth() + 1)}-${calendarUtil.padZero(now.getDate())}`
    });

    this.generateCalendar();

    // 默认选中今天
    this.selectDate(this.data.todayStr);
  },

  // ==================== 日历生成（全部预处理） ====================

  generateCalendar() {
    const { currentYear, currentMonth } = this.data;
    const calData = calendarUtil.getMonthCalendar(currentYear, currentMonth);

    // 获取当月所有重要日子，建立 dateStr -> event 的索引
    const allEvents = storage.getEvents() || [];
    const eventIndex = {}; // { '2026-05-01': [{...}, ...] }
    allEvents.forEach(ev => {
      if (!ev.date) return;
      const d = ev.date; // 格式 YYYY-MM-DD 或 YYYY/MM/DD 等
      const normalized = d.replace(/\//g, '-');
      if (!eventIndex[normalized]) eventIndex[normalized] = [];
      eventIndex[normalized].push(ev);
    });

    // 处理每个格子的所有显示字段（避免 WXML 中调用方法）
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
      let festivalDisplayName = '';

      if (item.isCurrentMonth) {
        // 最高优先级：有重要日子时显示小圆点 + 名称
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
          festivalDisplayName = fest.name;
          const displayName = fest.shortName || fest.name || '';
          const nameLen = displayName.length;
          if (nameLen > 4) {
            markerText = displayName.substring(0, 3);
          } else {
            markerText = displayName;
          }
          markerType = 'festival';
        } else if (item.lunar && item.lunar.dayStr) {
          if (item.lunar.dayStr === '初一') {
            markerText = (item.lunar.monthStr || '') + '月';
          } else {
            markerText = item.lunar.dayStr;
          }
          markerType = 'lunar';
        }
      }

      // === 预处理多节日/多事件圆点 ===
      let showMultiDots = (hasFestival && item.festival.length > 1 || dayEvents.length > 1) && item.isCurrentMonth;

      // === 预处理格子样式类名 ===
      const cellClasses = [
        'day-cell',
        item.isCurrentMonth ? 'current-month' : 'other-month',
        item.isToday ? 'today' : '',
        item.isSelected ? 'selected' : '',
        hasFestival ? 'has-festival' : '',
        hasBuddhist ? 'has-buddhist' : '',
        hasEvent ? 'has-event' : ''
      ].filter(Boolean).join(' ');

      return {
        ...item,
        // 标记
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
        festivalDisplayName: festivalDisplayName,
        showMultiDots: showMultiDots,
        // 样式
        cellClass: cellClasses
      };
    });

    this.setData({ calendarData: processedData });
  },

  // ==================== 月份切换 ====================

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
    this.selectDate(this.data.todayStr);
  },

  // ==================== 日期选择 ====================

  onDayTap(e) {
    const dateStr = e.currentTarget.dataset.date;
    const info = e.currentTarget.dataset.info;

    if (!info.isCurrentMonth) {
      if (info.isPrevMonth) { this.prevMonth(); } else { this.nextMonth(); }
      setTimeout(() => { this.selectDate(dateStr); }, 50);
      return;
    }

    this.selectDate(dateStr);
  },

  selectDate(dateStr) {
    // 更新选中状态
    const calendarData = this.data.calendarData.map(item => ({
      ...item,
      isSelected: item.dateStr === dateStr
    }));

    const selectedInfo = calendarData.find(item => item.dateStr === dateStr);

    if (selectedInfo && selectedInfo.isCurrentMonth) {
      const note = storage.getNoteByDate(dateStr);

      const dateObj = new Date(selectedInfo.dateStr.replace(/-/g, '/'));
      const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

      // 预处理节日标签样式和分类文字
      let processedFestivals = [];
      if (selectedInfo.festivals && selectedInfo.festivals.length > 0) {
        processedFestivals = selectedInfo.festivals.map(f => ({
          ...f,
          tagClass: this.getTagClass(f.color),
          categoryText: f.category === 'holiday' ? '节日' : (f.type === 'buddhist' ? '佛教纪念日' : '纪念')
        }));
      }

      // 预处理选中日期的展示信息
      let lunarDisplay = '';
      let ganzhiYear = '';
      let animalYear = '';
      if (selectedInfo.lunar) {
        lunarDisplay = selectedInfo.lunar.display || '';
        ganzhiYear = selectedInfo.lunar.yearGanZhi || '';
        animalYear = selectedInfo.lunar.animal || '';
      }

      // 计算黄历资料
      let huangliData = null;
      try {
        huangliData = huangli.getHuangLiData(
          dateObj.getFullYear(),
          dateObj.getMonth() + 1,
          dateObj.getDate(),
          selectedInfo.lunar
        );
        // 防御：确保返回值有效
        if (!huangliData || !huangliData.dayGanZhi) {
          console.warn('黄历数据计算异常，使用备用方案');
          huangliData = null;
        }
      } catch (e) {
        console.error('黄历计算出错:', e);
        huangliData = null;
      }

      this.setData({
        calendarData,
        selectedDate: {
          ...selectedInfo,
          festivals: processedFestivals,
          year: dateObj.getFullYear(),
          month: dateObj.getMonth() + 1,
          day: dateObj.getDate(),
          weekNameShort: weekNames[dateObj.getDay()],
          // 预处理面板显示
          lunarDisplay: lunarDisplay,
          ganzhiYear: ganzhiYear,
          animalYear: animalYear,
          solarTermName: selectedInfo.solarTerm ? selectedInfo.solarTerm.name : '',
          // 获取节气养生信息
          solarTermHealth: selectedInfo.solarTerm ? solarTerms.getSolarTermHealth(selectedInfo.solarTerm.name) : null,
          // 黄历资料
          huangli: huangliData
        },
        selectedNote: note
      });
    } else {
      this.setData({ calendarData, selectedDate: null, selectedNote: null });
    }
  },

  // ==================== 工具方法 ====================

  getTagClass(color) {
    const colorMap = {
      'red': 'tag-red', 'purple': 'tag-purple', 'gold': 'tag-gold',
      'pink': 'tag-pink', 'blue': 'tag-blue', 'green': 'tag-green', 'orange': 'tag-orange'
    };
    return colorMap[color] || 'tag-blue';
  },

  // ==================== 页面跳转 ====================

  goToFestivalDetail(e) {
    const festival = e.currentTarget.dataset.festival;
    if (!festival) return;
    wx.navigateTo({
      url: `/pages/festival-detail/festival-detail?data=${encodeURIComponent(JSON.stringify(festival))}`
    });
  },

  goToNotes(e) {
    const date = this.data.selectedDate ? this.data.selectedDate.dateStr : '';
    if (!date) return;
    wx.navigateTo({ url: `/pages/notes/notes?date=${date}` });
  },

  goToAddEventWithDate() {
    const date = this.data.selectedDate ? this.data.selectedDate.dateStr : '';
    if (!date) return;
    wx.navigateTo({ url: `/pages/add-event/add-event?date=${date}` });
  },

  // ==================== 分享 ====================

  onShareAppMessage() {
    const { currentYear, currentMonth } = this.data;
    return {
      title: `${currentYear}年${currentMonth}月 · 岁时记`,
      path: '/pages/calendar/calendar'
    };
  }
});
