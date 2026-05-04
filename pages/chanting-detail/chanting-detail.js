// pages/chanting-detail/chanting-detail.js — 功课详情
const chant = require('../../utils/chanting');
const share = require('../../utils/share');

Page({
  data: {
    taskId: '',
    task: {},
    total: 0,
    streak: 0,
    todayCount: 0,
    detail: {},        // { wish, dedicate, note }
    recentRecords: [],
    manualNum: '',
    suppDate: '',
    suppNum: '',
    highlightSupplement: false,
    highlightTarget: false,
    todayStr: '',
    editDailyTarget: '',  // 编辑中的每日目标
    editTotalTarget: '',  // 编辑中的总目标
    editComboGroupTarget: '', // 编辑中的经典组合目标组数
    editComboDailyGroupTarget: '', // 编辑中的经典组合每日目标组数
    comboPreview: [],
    comboDailyPreview: [],
    isDailyDone: false,   // 今日是否达标
    isTotalDone: false,  // 总目标是否完成
    activeTab: 'count',   // 当前标签页：count / supplement / wish / note / records
    editingIndex: -1,     // 正在编辑的记录索引（-1 表示未编辑）
    editCount: '',        // 编辑中的计数值
    quickButtons: [21, 49, 108]
  },

  onLoad(opts) {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    const id = opts.id;
    if (!id) { wx.navigateBack(); return; }
    const tasks = chant.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) { wx.navigateBack(); return; }

    this.setData({
      taskId: id,
      task,
      quickButtons: getQuickButtons(task),
      todayStr: chant.getToday(),
      highlightSupplement: opts.mode === 'supplement',
      highlightTarget: opts.mode === 'target'
    });
    this.loadDetail();
  },

  onShow() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    if (!this.data.taskId) return;
    this.loadDetail();
  },

  loadDetail() {
    const { taskId } = this.data;
    const today = chant.getToday();
    const tasks = chant.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) { wx.navigateBack(); return; }

    // 统计
    const total = chant.getTaskTotal(taskId);
    const streak = chant.getStreakDays(taskId);
    const dayRec = chant.getDayRecord(today);
    const todayCount = dayRec[taskId] || 0;

    // 每日详情（按 taskId 隔离）
    const detail = chant.getDailyDetail(today, taskId) || {};

    // 最近记录（倒序，取最近30天有数据的）
    const recent = chant.getTaskRecent(taskId, 30)
      .filter(r => r.count > 0)
      .slice(-14)
      .reverse()
      .map(r => ({ date: r.date.slice(5), fullDate: r.date, count: r.count }));

    const comboGroupTarget = task.comboId ? (parseInt(task.comboGroupTarget) || 1) : 0;
    const comboDailyGroupTarget = task.comboId ? (parseInt(task.comboDailyGroupTarget) || 0) : 0;
    const comboPreview = task.comboId ? chant.getClassicComboTargets(comboGroupTarget) : [];
    const comboDailyPreview = task.comboId && comboDailyGroupTarget > 0 ? chant.getClassicComboTargets(comboDailyGroupTarget) : [];
    this.setData({ task, quickButtons: getQuickButtons(task), total, streak, todayCount, detail, recentRecords: recent });

    // 计算达标状态
    const isDailyDone = task.dailyTarget > 0 && todayCount >= task.dailyTarget;
    const isTotalDone = task.totalTarget > 0 && total >= task.totalTarget;
    this.setData({
      isDailyDone,
      isTotalDone,
      editDailyTarget: task.dailyTarget > 0 ? String(task.dailyTarget) : '',
      editTotalTarget: task.totalTarget > 0 ? String(task.totalTarget) : '',
      editComboGroupTarget: comboGroupTarget > 0 ? String(comboGroupTarget) : '',
      editComboDailyGroupTarget: comboDailyGroupTarget > 0 ? String(comboDailyGroupTarget) : '',
      comboPreview,
      comboDailyPreview
    });

    // 补录默认昨天
    if (!this.data.suppDate) {
      this.setData({ suppDate: prevDay(today) });
    }
  },

  // ===== 标签页切换 =====
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab && tab !== this.data.activeTab) {
      this.setData({ activeTab: tab });
    }
  },

  // ===== 快捷报数 =====
  onQuick(e) {
    const n = parseInt(e.currentTarget.dataset.n) || 1;
    chant.increment(this.data.taskId, chant.getToday(), n);
    wx.vibrateShort({ type: 'light' });
    this.loadDetail();
  },
  onManualInput(e) { this.setData({ manualNum: e.detail.value }); },
  onManualSubmit() {
    const n = parseInt(this.data.manualNum) || 0;
    if (n <= 0) return;
    chant.setCount(this.data.taskId, chant.getToday(), (this.data.todayCount || 0) + n);
    this.setData({ manualNum: '' });
    wx.showToast({ title: '已报数 +' + n, icon: 'success' });
    this.loadDetail();
  },

  // ===== 补录 =====
  onDatePick(e) { this.setData({ suppDate: e.detail.value }); },
  onSuppInput(e) { this.setData({ suppNum: e.detail.value }); },
  onSuppSubmit() {
    const n = parseInt(this.data.suppNum) || 0;
    if (!this.data.suppDate || n <= 0) {
      wx.showToast({ title: '请选择日期和数量', icon: 'none' }); return;
    }
    const rec = chant.getDayRecord(this.data.suppDate);
    chant.setCount(this.data.taskId, this.data.suppDate, (rec[this.data.taskId] || 0) + n);
    this.setData({ suppNum: '' });
    wx.showToast({ title: '已补录 ' + n, icon: 'success' });
    this.loadDetail();
  },

  // ===== 目标设置 =====
  onDailyTargetInput(e) { this.setData({ editDailyTarget: e.detail.value }); },
  onTotalTargetInput(e) { this.setData({ editTotalTarget: e.detail.value }); },
  onComboGroupTargetInput(e) {
    const value = e.detail.value;
    const groups = parseInt(value) || 0;
    const dailyGroups = parseInt(this.data.editComboDailyGroupTarget) || 0;
    const itemTargets = getComboItemTargets(this.data.task, groups, dailyGroups);
    this.setData({
      editComboGroupTarget: value,
      comboPreview: this.data.task.comboId ? chant.getClassicComboTargets(groups) : [],
      editTotalTarget: itemTargets.totalTarget > 0 ? String(itemTargets.totalTarget) : '',
      editDailyTarget: itemTargets.dailyTarget > 0 ? String(itemTargets.dailyTarget) : ''
    });
  },
  onComboDailyGroupTargetInput(e) {
    const value = e.detail.value;
    const groups = parseInt(value) || 0;
    const totalGroups = parseInt(this.data.editComboGroupTarget) || 0;
    const itemTargets = getComboItemTargets(this.data.task, totalGroups, groups);
    this.setData({
      editComboDailyGroupTarget: value,
      comboDailyPreview: this.data.task.comboId && groups > 0 ? chant.getClassicComboTargets(groups) : [],
      editTotalTarget: itemTargets.totalTarget > 0 ? String(itemTargets.totalTarget) : '',
      editDailyTarget: itemTargets.dailyTarget > 0 ? String(itemTargets.dailyTarget) : ''
    });
  },
  saveTargets() {
    const dailyTarget = parseInt(this.data.editDailyTarget) || 0;
    const totalTarget = parseInt(this.data.editTotalTarget) || 0;
    if (this.data.task.comboId) {
      const groupTarget = parseInt(this.data.editComboGroupTarget) || 0;
      const dailyGroupTarget = parseInt(this.data.editComboDailyGroupTarget) || 0;
      if (groupTarget <= 0) {
        wx.showToast({ title: '请输入目标组数', icon: 'none' });
        return;
      }
      chant.updateClassicComboGroupTarget(this.data.task.comboId, groupTarget, dailyGroupTarget);
    } else {
      chant.updateTask(this.data.taskId, { dailyTarget, totalTarget });
    }
    // 刷新 task 数据
    const tasks = chant.getTasks();
    const task = tasks.find(t => t.id === this.data.taskId);
    this.setData({ task });
    // 重新计算达标状态
    const isDailyDone = dailyTarget > 0 && this.data.todayCount >= dailyTarget;
    const isTotalDone = task.totalTarget > 0 && this.data.total >= task.totalTarget;
    this.setData({ isDailyDone, isTotalDone });
    wx.showToast({ title: '目标已保存', icon: 'success' });
    this.loadDetail();
  },
  saveDailyTarget() { this.saveTargets(); },
  saveTotalTarget() { this.saveTargets(); },

  // ===== 发愿 / 备注 =====
  onWishInput(e) { this.setData({ 'detail.wish': e.detail.value }); },
  saveWish() { this.saveDaily('wish'); },
  onNoteInput(e) { this.setData({ 'detail.note': e.detail.value }); },
  saveNote() { this.saveDaily('note'); },

  saveDaily(field) {
    const d = chant.getDailyDetail(chant.getToday(), this.data.taskId) || {};
    d[field] = this.data.detail[field];
    chant.saveDailyDetail(chant.getToday(), d, this.data.taskId);
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  // ===== 导航 =====
  goFocus() {
    wx.navigateTo({ url: '/pages/chanting-focus/chanting-focus?id=' + this.data.taskId });
  },
  onDelete() {
    const task = this.data.task || {};
    const archiveText = task.comboId ? '存档整组组合' : '存档功课';
    wx.showActionSheet({
      itemList: [archiveText, '彻底删除'],
      success: sheetRes => {
        if (sheetRes.tapIndex === 0) {
          chant.archiveTask(this.data.taskId);
          wx.showToast({ title: '已存档', icon: 'success' });
          setTimeout(() => { wx.navigateBack(); }, 600);
          return;
        }
        wx.showModal({
          title: '确认删除',
          content: '删除「' + this.data.task.name + '」？所有记录将清除',
          confirmColor: '#FF3B30',
          success: res => {
            if (res.confirm) {
              chant.deleteTask(this.data.taskId);
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => { wx.navigateBack(); }, 600);
            }
          }
        });
      }
    });
  },

  // ===== 记录编辑/删除 =====

  /** 点击记录项 → 进入编辑模式 */
  onRecordTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const count = parseInt(e.currentTarget.dataset.count) || 0;
    // 如果已经在编辑这一项，不重复触发
    if (this.data.editingIndex === index) return;
    this.setData({
      editingIndex: index,
      editCount: String(count)
    });
  },

  /** 编辑输入中 */
  onEditCountInput(e) {
    this.setData({ editCount: e.detail.value });
  },

  /** 保存编辑后的数量（回车或失焦时） */
  saveEditCount(e) {
    const index = this.data.editingIndex;
    if (index < 0 || !this.data.recentRecords[index]) {
      this.cancelEditing();
      return;
    }
    const newCount = parseInt(this.data.editCount) || 0;
    const record = this.data.recentRecords[index];
    const fullDate = record.fullDate;

    if (newCount <= 0) {
      // 数量为0或空，相当于删除
      wx.showModal({
        title: '提示',
        content: '数量为0将删除该日记录，确定吗？',
        confirmText: '删除',
        confirmColor: '#FF3B30',
        success: (res) => {
          if (res.confirm) {
            chant.clearCount(this.data.taskId, fullDate);
            wx.showToast({ title: '已删除', icon: 'success' });
          }
          this.cancelEditing();
          this.loadDetail();
        }
      });
      return;
    }

    // 写入新值
    chant.setCount(this.data.taskId, fullDate, newCount);
    wx.showToast({ title: '已更新为 ' + newCount, icon: 'success' });
    this.cancelEditing();
    this.loadDetail();
  },

  /** 取消编辑模式 */
  cancelEditing() {
    this.setData({ editingIndex: -1, editCount: '' });
  },

  /** 删除某天的记录 */
  onDeleteRecord(e) {
    const index = e.currentTarget.dataset.index;
    const dateStr = e.currentTarget.dataset.date;
    const record = this.data.recentRecords[index];
    if (!record) return;

    wx.showModal({
      title: '删除记录',
      content: '确定删除 ' + (record.date || dateStr) + ' 的记录？',
      confirmColor: '#FF3B30',
      confirmText: '删除',
      success: (res) => {
        if (res.confirm) {
          chant.clearCount(this.data.taskId, record.fullDate || dateStr);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadDetail();
        }
      }
    });
  },

  onShareAppMessage() {
    const taskName = this.data.task.name || '功课计数';
    return share.appMessage({
      title: `${taskName} · 岁时记计数器`,
      path: '/pages/chanting/chanting'
    });
  },

  onShareTimeline() {
    const taskName = this.data.task.name || '功课计数';
    return share.timeline({ title: `${taskName} · 岁时记计数器` });
  }
});

function prevDay(dateStr) {
  const d = new Date(dateStr.replace(/-/g,'/'));
  d.setDate(d.getDate()-1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getQuickButtons(task) {
  if (task && (task.builtinId === 'b2' || task.name === '大悲咒')) {
    return [27, 49, 108];
  }
  if (task && (task.builtinId === 'b46' || task.name === '往生咒')) {
    return [49, 84, 108];
  }
  if (task && (task.builtinId === 'b10' || task.name === '七佛灭罪真言')) {
    return [49, 87, 108];
  }
  return [21, 49, 108];
}

function getComboItemTargets(task, totalGroups, dailyGroups) {
  const comboItem = task && task.comboItemKey
    ? chant.CLASSIC_COMBO_ITEMS.find(item => item.key === task.comboItemKey)
    : null;
  const perGroup = comboItem ? comboItem.perGroup : (task && task.comboPerGroup ? parseInt(task.comboPerGroup) : 0);
  return {
    totalTarget: perGroup > 0 && totalGroups > 0 ? perGroup * totalGroups : 0,
    dailyTarget: perGroup > 0 && dailyGroups > 0 ? perGroup * dailyGroups : 0
  };
}
