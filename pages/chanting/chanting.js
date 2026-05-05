// pages/chanting/chanting.js — 功课计数器主页面
const chant = require('../../utils/chanting');
const privacy = require('../../utils/privacy');
const share = require('../../utils/share');
const poster = require('../../utils/poster');
const cloud = require('../../utils/cloud');
const analytics = require('../../utils/analytics');

Page({
  data: {
    tasks: [],
    taskData: [],      // 带今日计数和进度的展示数据
    todaySummary: { completed: 0, total: 0, tasks: 0 },
    showYesterdayTip: false,
    yesterdayIncomplete: [],
    pageMotto: '',
    quickSuggestions: [
      { id: 'b2', name: '大悲咒' },
      { id: 'b3', name: '心经' }
    ],
    quickCount: 0,       // 通用计数器
    memoContent: '',      // 备忘录内容
    showSort: false,      // 排序弹窗显示状态
    sortValues: {},       // 排序输入值 { id: sortOrder }
    isDragging: false,    // 是否正在拖拽
    showPrivacyAuthorization: false,
    privacyContractName: '用户隐私保护指引'
  },

  onShow() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    analytics.track('chanting_open');

    try {
      this.loadData();
      // 加载通用计数器
      const qc = wx.getStorageSync('quick_count') || 0;
      // 加载备忘录
      const memo = wx.getStorageSync('chanting_memo') || '';
      this.setData({
        quickCount: qc,
        memoContent: memo,
        pageMotto: chant.getRandomMotto()
      });
    } catch (e) {
      console.error('loadData 出错:', e);
      this.setData({ tasks: [], taskData: [], todaySummary: { completed: 0, total: 0, tasks: 0 } });
    }
  },

  loadData() {
    const tasks = chant.getTasks();
    const today = chant.getToday();
    const dayRec = chant.getDayRecord(today);
    const comboProgressMap = {};
    try {
      chant.getClassicComboProgress().forEach(combo => {
        comboProgressMap[combo.comboId] = combo;
      });
    } catch(e) { /* 忽略 */ }
    const warmClassMap = buildDuplicateWarmClassMap(tasks || []);

    // 构建展示数据（含拖拽状态字段）
    const taskData = (tasks || []).map((t, index) => {
      const todayCount = (dayRec && dayRec[t.id]) || 0;
      const total = chant.getTaskTotal(t.id);
      const isDailyDone = t.dailyTarget > 0 && todayCount >= t.dailyTarget;
      const isTotalDone = t.totalTarget > 0 && total >= t.totalTarget;
      const comboProgress = t.comboId ? comboProgressMap[t.comboId] : null;
      const comboProgressText = comboProgress
        ? `已完成${comboProgress.completedGroups}组 / 目标${comboProgress.groupTarget}组`
        : '';
      const comboTodayProgressText = comboProgress && comboProgress.dailyGroupTarget > 0
        ? `今日${comboProgress.todayCompletedGroups}/${comboProgress.dailyGroupTarget}组`
        : '';
      return {
        ...t,
        todayCount,
        total: total || 0,
        isDailyDone,
        isTotalDone,
        progressPercent: t.dailyTarget > 0 ? Math.min(100, (todayCount / t.dailyTarget) * 100) : 0,
        totalProgressPercent: t.totalTarget > 0 ? Math.min(100, ((total || 0) / t.totalTarget) * 100) : 0,
        comboProgressText,
        comboTodayProgressText,
        warmClass: warmClassMap[t.id] || '',
        isDragging: false,
        isPlaceholder: false
      };
    });

    const summary = chant.getTodaySummary();

    // 昨日未完成提示（仅显示一次）
    let showTip = false;
    let incomplete = [];
    if (!this._tipShown) {
      try {
        incomplete = chant.getYesterdayIncomplete();
        if (incomplete.length > 0) {
          showTip = true;
          this._tipShown = true;
        }
      } catch(e) { /* 忽略 */ }
    }

    this.setData({
      tasks: tasks || [],
      taskData: taskData || [],
      todaySummary: summary,
      showYesterdayTip: showTip,
      yesterdayIncomplete: incomplete || []
    });
  },

  onShareAppMessage() {
    const summary = this.data.todaySummary || {};
    return share.appMessage({
      title: `今日修行 ${summary.completed || 0}/${summary.total || 0} 项 · 岁时记`,
      path: '/pages/chanting/chanting'
    });
  },

  onShareTimeline() {
    const summary = this.data.todaySummary || {};
    return share.timeline({
      title: `今日修行 ${summary.completed || 0}/${summary.total || 0} 项 · 岁时记`
    });
  },

  /** +1 */
  onIncrement(e) {
    const id = e.currentTarget.dataset.id;
    chant.increment(id, chant.getToday(), 1);
    chant.promoteTaskToTop(id);
    this.loadData();

    // 轻触反馈
    wx.vibrateShort({ type: 'light' });
  },

  /** -1 */
  onDecrement(e) {
    const id = e.currentTarget.dataset.id;
    const today = chant.getToday();
    const rec = chant.getDayRecord(today);
    const cur = rec[id] || 0;
    if (cur <= 1) {
      chant.clearCount(id, today);
    } else {
      chant.increment(id, today, -1);
    }
    this.loadData();
  },

  /** 清零（仅清今日该通道） */
  onClear(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '清零确认',
      content: '确定清零今日计数？累计总数不变',
      confirmColor: '#FF9500',
      success: (res) => {
        if (res.confirm) {
          chant.clearCount(id, chant.getToday());
          this.loadData();
          wx.showToast({ title: '已清零', icon: 'success' });
        }
      }
    });
  },

  /** 删除整个功课 */
  onDeleteTask(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    const task = (this.data.tasks || []).find(item => item.id === id);
    const archiveText = task && task.comboId ? '存档整组组合' : '存档功课';
    wx.showActionSheet({
      itemList: [archiveText, '彻底删除'],
      success: (sheetRes) => {
        if (sheetRes.tapIndex === 0) {
          chant.archiveTask(id);
          this.loadData();
          wx.showToast({ title: '已存档', icon: 'success' });
          return;
        }
        wx.showModal({
          title: '删除功课',
          content: '确定删除「' + name + '」？所有记录将被清除',
          confirmColor: '#FF3B30',
          confirmText: '删除',
          success: (res) => {
            if (res.confirm) {
              chant.deleteTask(id);
              this.loadData();
              wx.showToast({ title: '已删除', icon: 'success' });
            }
          }
        });
      }
    });
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/chanting-add/chanting-add' });
  },

  onQuickAddTask(e) {
    const id = e.currentTarget.dataset.id;
    const item = chant.BUILTIN.find(task => task.id === id);
    if (!item) return;

    const task = chant.addTask(item.name, item.unit, 0, 0, false, item.id);
    wx.showToast({ title: '已添加', icon: 'success' });
    this.loadData();
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/chanting-detail/chanting-detail?id=' + e.currentTarget.dataset.id });
  },
  goSupplement() {
    const first = this.data.yesterdayIncomplete && this.data.yesterdayIncomplete[0];
    if (!first || !first.id) {
      wx.showToast({ title: '暂无可补录功课', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/chanting-detail/chanting-detail?id=' + first.id + '&mode=supplement' });
  },

  goSetTarget() {
    const tasks = this.data.tasks || [];
    if (!tasks.length) {
      wx.showToast({ title: '请先添加功课', icon: 'none' });
      return;
    }

    const openDetail = (taskId) => {
      wx.navigateTo({ url: '/pages/chanting-detail/chanting-detail?id=' + taskId + '&mode=target' });
    };

    if (tasks.length === 1) {
      openDetail(tasks[0].id);
      return;
    }

    wx.showActionSheet({
      itemList: tasks.slice(0, 6).map(task => task.name.length > 12 ? task.name.slice(0, 12) + '...' : task.name),
      success: (res) => {
        const task = tasks[res.tapIndex];
        if (task) openDetail(task.id);
      }
    });
  },

  // ==================== 通用计数器 ====================

  /** 通用计数器 +1 */
  onQcIncrement() {
    const newVal = this.data.quickCount + 1;
    this.setData({ quickCount: newVal });
    wx.setStorageSync('quick_count', newVal);
    cloud.set(cloud.TABLES.QUICK_COUNTER, 'main', newVal);
    wx.vibrateShort({ type: 'light' });
  },

  /** 通用计数器 -1 */
  onQcDecrement() {
    const newVal = this.data.quickCount - 1;
    this.setData({ quickCount: newVal });
    wx.setStorageSync('quick_count', newVal);
    cloud.set(cloud.TABLES.QUICK_COUNTER, 'main', newVal);
  },

  /** 通用计数器重置 */
  onQcReset() {
    wx.showModal({
      title: '重置确认',
      content: '确定将通用计数器归零？',
      confirmColor: '#FF9500',
      success: (res) => {
        if (res.confirm) {
          this.setData({ quickCount: 0 });
          wx.setStorageSync('quick_count', 0);
          cloud.set(cloud.TABLES.QUICK_COUNTER, 'main', 0);
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },

  // ==================== 备忘录 ====================

  onMemoInput(e) {
    this.setData({ memoContent: e.detail.value });
  },

  saveMemo() {
    const content = this.data.memoContent;
    wx.setStorageSync('chanting_memo', content);
    cloud.set(cloud.TABLES.MEMO, 'main', content || '');
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  // ==================== 拖拽排序（长按触发） ====================

  _dragState: null,   // { dragIndex, startY, cardRects, cardHeight }
  _longPressTimer: null,
  _cardPositions: [], // 缓存卡片位置信息

  /** 长按进入拖拽模式 */
  onLongPress(e) {
    if (this._dragState) return; // 已在拖拽中
    const index = parseInt(e.currentTarget.dataset.index);
    if (isNaN(index)) return;

    // 获取所有卡片的位置
    this._cacheCardPositions(() => {
      if (this._cardPositions.length === 0) return;
      const taskData = this.data.taskData;

      // 标记当前项为拖拽中，原位置显示占位符
      const updates = { isDragging: true };
      taskData.forEach((t, i) => {
        updates[`taskData[${i}].isDragging`] = (i === index);
        updates[`taskData[${i}].isPlaceholder`] = (i === index);
      });
      this.setData(updates);

      this._dragState = {
        dragIndex: index,
        startY: e.changedTouches[0].clientY,
        cardHeight: this._cardPositions[0] ? this._cardPositions[0].height : 120
      };
      wx.vibrateShort({ type: 'medium' });
    });
  },

  /** 缓存卡片位置 */
  _cacheCardPositions(callback) {
    const query = wx.createSelectorQuery().in(this);
    query.selectAll('.task-card').boundingClientRect(rects => {
      this._cardPositions = rects || [];
      if (callback) callback();
    }).exec();
  },

  onDragStart(e) {
    // 仅在拖拽模式下处理
    if (!this._dragState) return;
    this._dragState.startY = e.touches[0].clientY;
  },

  onDragMove(e) {
    if (!this._dragState) return;
    const { dragIndex } = this._dragState;
    const taskData = this.data.taskData;
    if (!taskData || taskData.length <= 1) return;

    const touchY = e.touches[0].clientY;
    const moveY = touchY - this._dragState.startY;

    // 用卡片高度估算目标位置
    const cardH = this._dragState.cardHeight || 120;
    const offsetIndex = Math.round(moveY / cardH);
    let targetIndex = dragIndex + offsetIndex;

    targetIndex = Math.max(0, Math.min(taskData.length - 1, targetIndex));
    if (targetIndex === dragIndex) return;

    // 重新排列数组
    const newTaskData = [...taskData];
    const [dragItem] = newTaskData.splice(dragIndex, 1);
    newTaskData.splice(targetIndex, 0, dragItem);

    // 更新状态：保持拖拽项的 isDragging，占位符跟随原 dragIndex 移到 targetIndex
    const updates = { taskData: newTaskData };
    newTaskData.forEach((t, i) => {
      updates[`taskData[${i}].isDragging`] = false;
      updates[`taskData[${i}].isPlaceholder`] = false;
    });
    // 找到被拖拽的项目，重新标记
    const newDragIdx = newTaskData.findIndex(t => t.id === taskData[dragIndex].id);
    if (newDragIdx >= 0) {
      updates[`taskData[${newDragIdx}].isDragging`] = true;
      updates[`taskData[${newDragIdx}].isPlaceholder`] = true;
    }
    this.setData(updates);

    this._dragState.dragIndex = newDragIdx;
    this._dragState.startY = touchY;
  },

  onDragEnd(e) {
    if (!this._dragState) return;

    // 保存新的排序
    const orderedIds = this.data.taskData.map(t => t.id);
    chant.reorderTasks(orderedIds);

    // 重置所有拖拽状态
    const taskData = this.data.taskData;
    const updates = { isDragging: false };
    taskData.forEach((t, i) => {
      updates[`taskData[${i}].isDragging`] = false;
      updates[`taskData[${i}].isPlaceholder`] = false;
    });
    this.setData(updates);
    this._dragState = null;
    this._cardPositions = [];

    wx.showToast({ title: '顺序已调整', icon: 'success' });
  },

  // ==================== 数字排序弹窗 ====================

  showSortModal() {
    // 初始化排序值（sortOrder + 1 显示为从1开始），写入 taskData 每项的 sortDisplay
    const updates = { showSort: true };
    this.data.taskData.forEach((t, i) => {
      updates[`taskData[${i}].sortDisplay`] = (t.sortOrder || 0) + 1;
    });
    this.setData(updates);
  },

  hideSortModal() {
    this.setData({ showSort: false });
  },

  stopPropagation() {
    // 阻止事件冒泡到 mask，防止点击弹窗内容时关闭弹窗
  },

  onSortInput(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const val = e.detail.value; // 保持字符串，不转数字，避免输入中被截断
    this.setData({
      [`taskData[${index}].sortDisplay`]: val
    });
  },

  saveSort() {
    const { taskData } = this.data;

    // 按 sortDisplay（用户输入的1-based数字）排序
    const sorted = [...taskData].sort((a, b) => {
      const valA = parseInt(a.sortDisplay) || 999;
      const valB = parseInt(b.sortDisplay) || 999;
      return valA - valB;
    });

    // 重新分配 sortOrder（0-based），按用户输入的顺序
    const orderedIds = sorted.map(t => t.id);
    chant.reorderTasks(orderedIds);

    this.setData({ showSort: false });
    this.loadData(); // 刷新列表（getTasks 现在会按 sortOrder 排序）
    wx.showToast({ title: '顺序已保存', icon: 'success' });
  },

  // ==================== 朋友圈分享图 ====================

  /** 分享到朋友圈（生成海报图片） */
  shareToMoments() {
    this.generateShareImage((res) => {
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
  saveShareImage() {
    const that = this;
    this.generateShareImage((res) => {
      if (res.success) {
        privacy.ensurePrivacyAuthorized({
          success: () => {
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
      success: () => { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
      fail: (err) => {
        if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册权限',
            confirmText: '去设置',
            success: (modalRes) => { if (modalRes.confirm) wx.openSetting(); }
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

  /** 生成朋友圈分享图（大字优化版 + 自定义二维码） */
  generateShareImage(callback) {
    const that = this;
    const tasks = that.data.tasks;
    const taskData = that.data.taskData;
    const summary = that.data.todaySummary;

    // 计算今日总计数
    let todayTotalCount = 0;
    taskData.forEach(item => { todayTotalCount += item.todayCount; });

    // 获取连续天数
    const streakDays = chant.getGlobalStreakDays();

    // 获取随机金句
    const quote = chant.getRandomQuote();

    // 格式化日期
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekNames[now.getDay()];
    const dateStr = year + '年' + month + '月' + day + '日 ' + weekDay;

    wx.showLoading({ title: '正在生成...' });

    const query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec(function(res) {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading();
        callback({ success: false });
        return;
      }

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;

      const W = 500;
      const H = 760;  // 紧凑高度，减少底部空白
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      try {
        // ===== 背景：渐变暖色 =====
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#FFF8E7');
        bgGrad.addColorStop(0.3, '#FFFBF0');
        bgGrad.addColorStop(0.7, '#FFF3D6');
        bgGrad.addColorStop(1, '#FFE8B5');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // ===== 外边框（金色装饰） =====
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, W - 30, H - 30);

        // ===== 内框装饰线 =====
        ctx.strokeStyle = 'rgba(218,165,32,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(22, 22, W - 44, H - 44);

        // ===== 标题区域 =====
        ctx.fillStyle = '#8B6914';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('今日修行打卡', W / 2, 62);

        // ===== 日期 =====
        ctx.fillStyle = '#A0824A';
        ctx.font = '26px sans-serif';
        ctx.fillText(dateStr, W / 2, 100);

        // ===== 主数据卡片 =====
        const cardY = 128;
        const cardH = 200;

        // 卡片背景（白色圆角）
        ctx.fillStyle = '#FFFFFF';
        roundRect(ctx, 28, cardY, W - 56, cardH, 22);
        ctx.fill();

        // 卡片边框
        ctx.strokeStyle = 'rgba(218,165,32,0.18)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, 28, cardY, W - 56, cardH, 22);
        ctx.stroke();

        // 今日行善数
        ctx.fillStyle = '#FF8F00';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        const countStr = '+' + todayTotalCount;
        ctx.fillText(countStr, W / 2, cardY + 75);

        ctx.fillStyle = '#AEAEB2';
        ctx.font = '22px sans-serif';
        ctx.fillText('今日行善', W / 2, cardY + 105);

        // 分割线
        ctx.beginPath();
        ctx.moveTo(55, cardY + 126);
        ctx.lineTo(W - 55, cardY + 126);
        ctx.strokeStyle = 'rgba(0,0,0,0.07)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 底部两列数据：连续天数 | 完成情况
        const bottomY = cardY + 164;

        // 连续天数
        ctx.fillStyle = '#5D4037';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(streakDays + '天', W / 4, bottomY);
        ctx.fillStyle = '#AEAEB2';
        ctx.font = '18px sans-serif';
        ctx.fillText('已连续修行', W / 4, bottomY + 24);

        // 完成情况
        ctx.fillStyle = '#2E7D32';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(summary.completed + '/' + summary.total, W * 3 / 4, bottomY);
        ctx.fillStyle = '#AEAEB2';
        ctx.font = '18px sans-serif';
        ctx.fillText('今日达标', W * 3 / 4, bottomY + 24);

        // ===== 金句卡片（居中绘制，防止溢出） =====
        const quoteY = cardY + cardH + 18;
        const quoteText = quote.text ? ('「' + quote.text + '」') : '';
        // 根据文字长度动态计算所需行数和高度
        var quoteLines = 1;
        if (quoteText.length > 14) quoteLines = 2;
        if (quoteText.length > 28) quoteLines = 3;
        const quoteH = Math.max(60, 24 + quoteLines * 31);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        roundRect(ctx, 30, quoteY, W - 60, quoteH, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(218,165,32,0.12)';
        ctx.lineWidth = 1;
        roundRect(ctx, 30, quoteY, W - 60, quoteH, 14);
        ctx.stroke();

        // 金句文字（居中换行绘制，防止溢出）
        if (quoteText) {
          ctx.fillStyle = '#6D5A2E';
          ctx.font = '23px sans-serif';
          ctx.textAlign = 'center';
          that._wrapTextCenter(ctx, quoteText, W / 2, quoteY + 34, W - 90, 31);
        }

        // ===== 功课列表摘要 =====
        const listY = quoteY + quoteH + 16;
        ctx.fillStyle = '#5D4037';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('今日功课', 35, listY);

        let listOffsetY = listY + 30;
        const maxShow = 5;
        const showTasks = taskData.slice(0, maxShow);

        showTasks.forEach((item, idx) => {
          // 功课名
          let name = item.name;
          if (name.length > 14) name = name.substring(0, 13) + '…';

          ctx.fillStyle = '#333';
          ctx.font = '19px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(name, 48, listOffsetY);

          // 计数（金色醒目）
          ctx.fillStyle = '#FF8F00';
          ctx.font = 'bold 19px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(item.todayCount + item.unit, W - 48, listOffsetY);

          // 进度条（如果有目标）
          if (item.dailyTarget > 0) {
            const barX = 48;
            const barY2 = listOffsetY + 8;
            const barW = W - 96;
            const barH = 5;
            const pct = Math.min(1, item.todayCount / item.dailyTarget);

            ctx.fillStyle = '#F0F0F0';
            roundRect(ctx, barX, barY2, barW, barH, 3);
            ctx.fill();

            if (pct > 0) {
              ctx.fillStyle = '#FFB300';
              roundRect(ctx, barX, barY2, barW * pct, barH, 3);
              ctx.fill();
            }
          }

          listOffsetY += 36;
        });

        // 如果有更多功课
        if (taskData.length > maxShow) {
          ctx.fillStyle = '#AEAEB2';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('等 ' + taskData.length + ' 项功课...', W / 2, listOffsetY + 4);
        }

        // ===== 底部品牌区 =====
        ctx.fillStyle = '#B09A68';
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('— 岁时记 · 计数器 —', W / 2, H - 50);

        ctx.fillStyle = '#AEAEB2';
        ctx.font = '12px sans-serif';
        ctx.fillText('长按识别小程序码，一起修行打卡', W / 2, H - 28);

        // 使用自定义二维码图片（右下角位置）
        poster.drawPromotionCode(canvas, ctx, {
          x: W - 110, y: H - 135, size: 72,
          src: '/images/PQ_chanting.png'
        }, function() {
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
                analytics.track('poster_generate', {
                  page: 'chanting'
                });
                wx.hideLoading();
                callback({ success: true, tempFilePath: saveRes.tempFilePath });
              },
              fail: function(err) {
                console.error('canvasToTempFilePath 失败:', err);
                wx.hideLoading();
                callback({ success: false });
              }
            });
          }, 150);
        });

      } catch (e) {
        console.error('绘制朋友圈图出错:', e);
        wx.hideLoading();
        callback({ success: false });
      }
    });
  },

  /** 文字自动换行绘制（左对齐，优化：避免中文词语被拆开） */
  _wrapText: function(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return y;
    var breakChars = ' ，。！？、；：""\'\'（）【】《》…—\n\t\r';
    var chars = text.split('');
    var line = '';
    var curY = y;
    var lastBreakPos = -1;
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      var testLine = line + ch;
      var metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line.length > 0) {
        if (lastBreakPos >= 0 && lastBreakPos < line.length) {
          ctx.fillText(line.substring(0, lastBreakPos + 1), x, curY);
          line = line.substring(lastBreakPos + 1) + ch;
        } else {
          ctx.fillText(line, x, curY);
          line = ch;
        }
        curY += lineHeight;
        lastBreakPos = -1;
      } else {
        line = testLine;
        if (breakChars.indexOf(ch) >= 0) lastBreakPos = line.length - 1;
      }
    }
    if (line) { ctx.fillText(line, x, curY); curY += lineHeight; }
    return curY;
  },

  /** 文字自动换行 + 居中绘制（每行居中于 centerX，优化：避免中文词语被拆开） */
  _wrapTextCenter: function(ctx, text, centerX, y, maxWidth, lineHeight) {
    if (!text) return y;
    var breakChars = ' ，。！？、；：""\'\'（）【】《》…—\n\t\r';
    var chars = text.split('');
    var line = '';
    var curY = y;
    var lastBreakPos = -1;
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      var testLine = line + ch;
      var metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line.length > 0) {
        if (lastBreakPos >= 0 && lastBreakPos < line.length) {
          ctx.fillText(line.substring(0, lastBreakPos + 1), centerX, curY);
          line = line.substring(lastBreakPos + 1) + ch;
        } else {
          ctx.fillText(line, centerX, curY);
          line = ch;
        }
        curY += lineHeight;
        lastBreakPos = -1;
      } else {
        line = testLine;
        if (breakChars.indexOf(ch) >= 0) lastBreakPos = line.length - 1;
      }
    }
    if (line) { ctx.fillText(line, centerX, curY); curY += lineHeight; }
    return curY;
  }
});

/** 绘制圆角矩形辅助函数 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function buildDuplicateWarmClassMap(tasks) {
  const warmClasses = ['task-warm-1', 'task-warm-2', 'task-warm-3', 'task-warm-4'];
  const result = {};

  const comboIds = [];
  const comboSeen = {};
  tasks.forEach(task => {
    if (!task.comboId) return;
    if (!comboSeen[task.comboId]) {
      comboSeen[task.comboId] = true;
      comboIds.push(task.comboId);
    }
  });
  if (comboIds.length > 1) {
    comboIds.forEach((comboId, index) => {
      const className = warmClasses[index % warmClasses.length];
      tasks.forEach(task => {
        if (task.comboId === comboId) result[task.id] = className;
      });
    });
  }

  const regularGroups = {};
  tasks.forEach(task => {
    if (task.comboId) return;
    const key = task.builtinId || task.name;
    if (!regularGroups[key]) regularGroups[key] = [];
    regularGroups[key].push(task);
  });
  Object.keys(regularGroups).forEach(key => {
    const group = regularGroups[key];
    if (group.length <= 1) return;
    group.forEach((task, index) => {
      result[task.id] = warmClasses[index % warmClasses.length];
    });
  });

  return result;
}
