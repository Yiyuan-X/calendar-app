// pages/calendar/calendar.js
const calendarUtil = require('../../utils/calendar');
const storage = require('../../utils/storage');
const solarTerms = require('../../utils/solar-terms');
const privacy = require('../../utils/privacy');
const share = require('../../utils/share');
const poster = require('../../utils/poster');

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    yearPickerValue: '',
    todayStr: '',
    todayDisplay: '',
    isCurrentMonth: true,
    isTodaySelected: true,
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
    selectedNote: null,
    showPrivacyAuthorization: false,
    privacyContractName: '用户隐私保护指引'
  },

  onLoad() {
    this._skipNextShowRefresh = true;
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    const now = new Date();
    const monthNames = ['','一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      yearPickerValue: `${now.getFullYear()}-01-01`,
      todayStr: `${now.getFullYear()}-${calendarUtil.padZero(now.getMonth() + 1)}-${calendarUtil.padZero(now.getDate())}`,
      todayDisplay: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
      isCurrentMonth: true,
      isTodaySelected: true
    });

    this.generateCalendar();

    // 默认选中今天。黄历计算延后，避免首屏同步计算阻塞 AppService。
    setTimeout(() => {
      this.selectDate(this.data.todayStr);
    }, 0);
  },

  onShow() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    if (this._skipNextShowRefresh) {
      this._skipNextShowRefresh = false;
      return;
    }
    // 每次显示时重新生成日历（确保设置变更后即时生效）
    if (this.data.currentYear > 0) {
      this.generateCalendar();
      // 保持当前选中日期
      if (this.data.selectedDate) {
        setTimeout(() => {
          this.selectDate(this.data.selectedDate.dateStr);
        }, 0);
      }
    }
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

      // === 预处理标记文字（支持多事件合并显示） ===
      // 优先级：重要日子 > 节气+节日合并 > 单独节日 > 单独节气 > 农历日期
      let markerText = '';
      let markerType = '';
      let festivalDisplayName = '';
      let isCombinedMarker = false;  // 是否为合并标记

      /**
       * 智能截断名称：保证至少4个字符（菩萨名称等不被截断太短）
       * @param {string} name 原始名称
       * @param {number} maxLen 最大长度
       * @returns {string} 截断后的名称
       */
      function smartTruncate(name, maxLen) {
        if (!name) return '';
        if (name.length <= maxLen) return name;
        // 至少保留4个字符 + ..
        const keepLen = Math.max(4, maxLen - 1);
        return name.substring(0, keepLen) + '..';
      }

      if (item.isCurrentMonth) {
        // ===== 收集当天所有可显示的标记项 =====
        const markerItems = [];  // { text, type, priority }

        // 1. 重要日子/自定义事件
        if (hasEvent) {
          for (const ev of dayEvents) {
            const evName = ev.name || ev.title || '';
            markerItems.push({ text: evName, type: 'event', priority: 10 });
          }
        }

        // 2. 有意义的节日（排除初一/十五/斋日等通用标记）
        if (hasFestival && item.festival.length > 0) {
          const meaningfulFests = item.festival.filter(f =>
            f.name !== '初一' && f.name !== '十五' && f.name !== '六斋日'
          );
          for (const fest of meaningfulFests) {
            const displayName = fest.shortName || fest.name || '';
            festivalDisplayName = fest.name;  // 保留完整名供详情面板使用
            markerItems.push({ text: displayName, type: 'festival', priority: 5, color: fest.color });
          }
          // 如果只有通用标记（初一/十五/斋日），也加入
          if (meaningfulFests.length === 0) {
            const genericFest = item.festival[0];
            const gName = genericFest.shortName || genericFest.name || '';
            if (gName) {
              markerItems.push({ text: gName, type: 'festival', priority: 1 });
            }
          }
        }

        // 3. 节气当天
        if (item.solarTerm && item.solarTerm.name) {
          const isTermDay = solarTerms.isDateSolarTermDay(item.dateStr, item.solarTerm.index);
          if (isTermDay) {
            markerItems.push({ text: item.solarTerm.name, type: 'solar-term', priority: 7 });
          }
        }

        // ===== 生成标记文字 =====
        if (markerItems.length > 0) {
          // 按优先级排序
          markerItems.sort((a, b) => b.priority - a.priority);

          if (markerItems.length >= 2) {
            // 多个事件：合并显示，用 "·" 连接
            // 取前两个最重要的（避免格子过于拥挤）
            const first = markerItems[0].text;
            const second = markerItems[1].text;
            // 智能截断每个部分，使总长度可控
            const firstPart = smartTruncate(first, 4);
            const secondPart = smartTruncate(second, 3);
            markerText = firstPart + '·' + secondPart;
            markerType = markerItems[0].type;  // 主类型以第一个为准
            isCombinedMarker = true;
          } else {
            // 单个事件：直接显示
            const single = markerItems[0];
            markerText = smartTruncate(single.text, 6);  // 单个事件允许最多6字
            markerType = single.type;
            isCombinedMarker = false;
          }
        }

        // 最后兜底：显示农历日期
        if (!markerText && item.lunar && item.lunar.dayStr) {
          if (item.lunar.dayStr === '初一') {
            markerText = (item.lunar.monthStr || '') + '月';
          } else {
            markerText = item.lunar.dayStr;
          }
          markerType = 'lunar';
        }
      }

      // === 预处理多节日/多事件圆点（超过2个事件时仍显示圆点提示） ===
      let showMultiDots = false;
      const totalMarkers = (hasEvent ? dayEvents.length : 0) +
                           (hasFestival ? item.festival.filter(f => f.name !== '初一' && f.name !== '十五' && f.name !== '六斋日').length : 0) +
                           (item.solarTerm && solarTerms.isDateSolarTermDay(item.dateStr, item.solarTerm.index) ? 1 : 0);
      showMultiDots = totalMarkers > 2 && item.isCurrentMonth;

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

      // === 预处理标记的完整CSS类名（避免WXML中嵌套三元表达式导致编译错误） ===
      let markerClass = 'marker';
      if (isCombinedMarker) {
        markerClass += ' combined-marker';
      } else if (markerType === 'solar-term') {
        markerClass += ' solar-term-marker';
      } else if (markerType === 'festival') {
        markerClass += ' festival-marker ' + festivalMarkerClass;
      } else if (markerType === 'event') {
        markerClass += ' event-marker';
      } else if (markerType === 'lunar') {
        markerClass += ' lunar-marker';
      }

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
        isCombinedMarker: isCombinedMarker,
        markerClass: markerClass,
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
    const now = new Date();
    currentMonth--;
    if (currentMonth < 1) { currentMonth = 12; currentYear--; }
    this.setData({
      currentYear, currentMonth,
      yearPickerValue: `${currentYear}-01-01`,
      isCurrentMonth: (currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1)
    });
    this.generateCalendar();
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    const now = new Date();
    currentMonth++;
    if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    this.setData({
      currentYear, currentMonth,
      yearPickerValue: `${currentYear}-01-01`,
      isCurrentMonth: (currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1)
    });
    this.generateCalendar();
  },

  goToToday() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      yearPickerValue: `${now.getFullYear()}-01-01`,
      isCurrentMonth: true,
      isTodaySelected: true
    });
    this.generateCalendar();
    this.selectDate(this.data.todayStr);
  },

  onYearChange(e) {
    const rawValue = e.detail.value || '';
    const pickedYear = parseInt(String(rawValue).slice(0, 4)) || 0;
    if (pickedYear <= 0) return;

    const now = new Date();
    const currentMonth = this.data.currentMonth || 1;
    const selectedDay = this.data.selectedDate ? this.data.selectedDate.day : 1;
    const daysInMonth = new Date(pickedYear, currentMonth, 0).getDate();
    const day = Math.min(selectedDay || 1, daysInMonth);
    const dateStr = `${pickedYear}-${calendarUtil.padZero(currentMonth)}-${calendarUtil.padZero(day)}`;

    this.setData({
      currentYear: pickedYear,
      yearPickerValue: `${pickedYear}-01-01`,
      isCurrentMonth: (pickedYear === now.getFullYear() && currentMonth === now.getMonth() + 1)
    });
    this.generateCalendar();
    this.selectDate(dateStr);
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

    if (selectedInfo) {
      const note = storage.getNoteByDate(dateStr);

      const dateObj = new Date(selectedInfo.dateStr.replace(/-/g, '/'));
      const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

      // 预处理节日标签样式和分类文字
      let rawFestivals = selectedInfo.festivals;
      // 如果日历格子没有节日数据（如跨月日期），实时查询补充
      if (!rawFestivals || rawFestivals.length === 0) {
        try {
          const festOpts = {
            showLiuZhai: storage.getSetting('showLiuZhai'),
            showLunarFestivals: storage.getSetting('showLunarFestivals'),
            showBuddhistFestivals: storage.getSetting('showBuddhistFestivals')
          };
          rawFestivals = require('../../utils/festivals').getFestivalsByDate(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate(), festOpts);
        } catch (e) {
          rawFestivals = [];
        }
      }

      let processedFestivals = [];
      if (rawFestivals && rawFestivals.length > 0) {
        // 过滤掉初一/十五/六斋日等通用标记，只保留有意义的节日
        const meaningfulFests = rawFestivals.filter(f =>
          f.name !== '初一' && f.name !== '十五' && f.name !== '六斋日' && f.name !== '斋日'
        );
        processedFestivals = meaningfulFests.map(f => ({
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
        huangliData = require('../../utils/huangli').getHuangLiData(
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
        isTodaySelected: dateStr === this.data.todayStr,
        selectedDate: {
          ...selectedInfo,
          festivals: processedFestivals,
          year: dateObj.getFullYear(),
          month: dateObj.getMonth() + 1,
          day: dateObj.getDate(),
          weekNameShort: weekNames[dateObj.getDay()],
          // 预处理面板显示
          lunarDisplay: lunarDisplay,
          lunarMonth: selectedInfo.lunar ? selectedInfo.lunar.monthStr + '月' : '',
          lunarDay: selectedInfo.lunar ? selectedInfo.lunar.dayStr : '',
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
      this.setData({
        calendarData,
        isTodaySelected: false,
        selectedDate: null,
        selectedNote: null
      });
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

  /** 微信分享 */
  onShareAppMessage() {
    const { currentYear, currentMonth, selectedDate } = this.data;
    var title = '';
    if (selectedDate && selectedDate.huangli) {
      var hl = selectedDate.huangli;
      title = `${hl.dayGanZhi}日 ${hl.jianChu} ${hl.xiu}宿 · 岁时记`;
    } else {
      title = `${currentYear}年${currentMonth}月 · 岁时记`;
    }
    return {
      title: title,
      path: '/pages/calendar/calendar'
    };
  },

  onShareTimeline() {
    const { currentYear, currentMonth, selectedDate } = this.data;
    var title = '';
    if (selectedDate && selectedDate.huangli) {
      var hl = selectedDate.huangli;
      title = `${hl.dayGanZhi}日 ${hl.jianChu} ${hl.xiu}宿 · 岁时记`;
    } else {
      title = `${currentYear}年${currentMonth}月 · 岁时记`;
    }
    return share.timeline({ title: title });
  },

  /** 分享到朋友圈（生成海报图片） */
  shareToMoments() {
    this.generateShareImage(function(res) {
      if (res.success) {
        wx.previewImage({
          urls: [res.tempFilePath],
          current: res.tempFilePath
        });
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  /** 保存到相册 */
  saveImage() {
    var that = this;
    this.generateShareImage(function(res) {
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

  saveImageToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: function() { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
      fail: function(err) {
        if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册权限',
            confirmText: '去设置',
            success: function(modalRes) {
              if (modalRes.confirm) wx.openSetting();
            }
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

  /**
   * 生成分享海报图片（Canvas 绘制）
   * @param {Function} callback 回调函数，参数 {success, tempFilePath}
   */
  generateShareImage(callback) {
    var that = this;
    var sd = this.data.selectedDate;
    var hl = (sd && sd.huangli) ? sd.huangli : null;

    // 显示加载提示
    wx.showLoading({ title: '正在生成...' });

    // 使用 Canvas 绘制分享图
    var query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec(function(res) {
      if (!res || !res[0] || !res[0].node) {
        // Canvas 不存在，使用备用方案
        wx.hideLoading();
        callback({ success: false });
        return;
      }

      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getSystemInfoSync().pixelRatio;

      // 设置画布尺寸（加大高度以容纳大字体）
      var W = 500;  // 画布宽度
      var H = 900;  // 画布高度（从750增加到900）
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      try {
        // ===== 背景渐变 =====
        var bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#FFF8E7');
        bgGrad.addColorStop(0.5, '#FFFBF0');
        bgGrad.addColorStop(1, '#FFF3D6');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // 装饰边框
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, W - 30, H - 30);

        // 内框装饰线
        ctx.strokeStyle = 'rgba(218,165,32,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(22, 22, W - 44, H - 44);

        // ===== 标题区域 =====
        ctx.fillStyle = '#8B6914';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('黄历 · 岁时记', W / 2, 75);

        // 日期信息
        var dateStr = sd ? (sd.year + '年' + sd.month + '月' + sd.day + '日') : '';
        var lunarStr = sd ? (sd.lunarMonth + sd.lunarDay) : '';

        ctx.fillStyle = '#5D4037';
        ctx.font = '30px sans-serif';
        ctx.fillText(dateStr, W / 2, 120);

        ctx.fillStyle = '#A08520';
        ctx.font = '26px sans-serif';
        ctx.fillText(lunarStr, W / 2, 155);

        // ===== 干支信息 =====
        if (hl) {
          // 日干支大字
          ctx.fillStyle = '#8B6914';
          ctx.font = 'bold 60px serif';
          ctx.fillText(hl.dayGanZhi || '', W / 2, 220);

          // 月干支 + 建除 + 星宿
          ctx.fillStyle = '#6D5A2E';
          ctx.font = '24px sans-serif';
          var subLine = (hl.monthGanZhi ? hl.monthGanZhi + '月' : '') +
                        '  ' + (hl.jianChu ? hl.jianChu + '日' : '') +
                        '  ' + (hl.xiu ? hl.xiu + '宿' : '');
          ctx.fillText(subLine, W / 2, 258);

          // 纳音
          if (hl.naYin) {
            ctx.fillStyle = '#E65100';
            ctx.font = '22px sans-serif';
            ctx.fillText(hl.naYin, W / 2, 288);
          }

          // ===== 佛历 =====
          if (hl.foLiText) {
            ctx.fillStyle = '#7B1FA2';
            ctx.font = '23px sans-serif';
            ctx.fillText('佛历 ' + hl.foLiText, W / 2, 325);
          }

          // ===== 宜忌区域 =====
          if (hl.yi && hl.yi.length > 0) {
            ctx.fillStyle = '#2E7D32';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('宜', 45, 380);

            ctx.fillStyle = '#388E3C';
            ctx.font = '22px sans-serif';
            var yiText = hl.yi.join('  ');
            ctx.fillText(yiText, 85, 383);
          }

          if (hl.ji && hl.ji.length > 0) {
            ctx.fillStyle = '#C62828';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('忌', 45, 430);

            ctx.fillStyle = '#D32F2F';
            ctx.font = '22px sans-serif';
            var jiText = hl.ji.join('  ');
            ctx.fillText(jiText, 85, 433);
          }

          // ===== 冲煞/五行/方位 =====
          ctx.textAlign = 'center';
          ctx.fillStyle = '#E65100';
          ctx.font = '22px sans-serif';
          if (hl.chongText) ctx.fillText('冲煞：' + hl.chongText, W / 2, 490);

          ctx.fillStyle = '#5D4037';
          var wuxingStr = (hl.yinYang || '') + (hl.wuXing || '');
          var fangweiStr = '财神:' + (hl.caiShen || '—') + '  喜神:' + (hl.xiShen || '—') + '  福神:' + (hl.fuShen || '—');
          ctx.font = '20px sans-serif';
          ctx.fillText(wuxingStr, W / 2, 525);
          ctx.fillText(fangweiStr, W / 2, 555);

          // ===== 彭祖百忌 =====
          if (hl.pengZuGan || hl.pengZuZhi) {
            ctx.textAlign = 'left';
            ctx.fillStyle = '#8B6914';
            ctx.font = '20px sans-serif';
            var pzY = 600;
            if (hl.pengZuGan) {
              ctx.fillText(hl.dayGan + ' ' + hl.pengZuGan, 45, pzY);
              pzY += 30;
            }
            if (hl.pengZuZhi) {
              ctx.fillText(hl.dayZhi + ' ' + hl.pengZuZhi, 45, pzY);
            }
          }

          // ===== 底部品牌 =====
          ctx.textAlign = 'center';
          ctx.fillStyle = '#AEAEB2';
          ctx.font = '18px sans-serif';
          ctx.fillText('— 岁时记 · 传统历法 —', W / 2, H - 55);
          ctx.font = '15px sans-serif';
          ctx.fillText('长按识别小程序码查看更多', W / 2, H - 28);
        }

        // 导出为临时文件
        poster.drawPromotionCode(canvas, ctx, { x: W - 116, y: H - 150, size: 76, src: '/images/PQ_calendar.png' }, function() {
          setTimeout(function() {
            wx.canvasToTempFilePath({
              canvas: canvas,
              width: W,
              height: H,
              destWidth: W * 2,
              destHeight: H * 2,
              fileType: 'jpg',
              quality: 0.95,
              success: function(saveRes) {
                wx.hideLoading();
                callback({ success: true, tempFilePath: saveRes.tempFilePath });
              },
              fail: function(err) {
                console.error('canvasToTempFilePath 失败:', err);
                wx.hideLoading();
                callback({ success: false });
              }
            });
          }, 100);
        });

      } catch (e) {
        console.error('绘制分享图出错:', e);
        wx.hideLoading();
        callback({ success: false });
      }
    });
  }
});
