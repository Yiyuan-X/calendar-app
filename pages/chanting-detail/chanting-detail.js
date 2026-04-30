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
    isDailyDone: false,   // 今日是否达标
    isTotalDone: false    // 总目标是否完成
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
    const { taskId, task } = this.data;
    const today = chant.getToday();

    // 统计
    const total = chant.getTaskTotal(taskId);
    const streak = chant.getStreakDays(taskId);
    const dayRec = chant.getDayRecord(today);
    const todayCount = dayRec[taskId] || 0;

    // 每日详情
    const detail = chant.getDailyDetail(today) || {};

    // 最近记录（倒序，取最近30天有数据的）
    const recent = chant.getTaskRecent(taskId, 30)
      .filter(r => r.count > 0)
      .slice(-14)
      .reverse()
      .map(r => ({ date: r.date.slice(5), count: r.count }));

    this.setData({ total, streak, todayCount, detail, recentRecords: recent });

    // 计算达标状态
    const isDailyDone = task.dailyTarget > 0 && todayCount >= task.dailyTarget;
    const isTotalDone = task.totalTarget > 0 && total >= task.totalTarget;
    this.setData({
      isDailyDone,
      isTotalDone,
      editDailyTarget: task.dailyTarget > 0 ? String(task.dailyTarget) : '',
      editTotalTarget: task.totalTarget > 0 ? String(task.totalTarget) : ''
    });

    // 补录默认昨天
    if (!this.data.suppDate) {
      this.setData({ suppDate: prevDay(today) });
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
  saveTargets() {
    const dailyTarget = parseInt(this.data.editDailyTarget) || 0;
    const totalTarget = parseInt(this.data.editTotalTarget) || 0;
    chant.updateTask(this.data.taskId, { dailyTarget, totalTarget });
    // 刷新 task 数据
    const tasks = chant.getTasks();
    const task = tasks.find(t => t.id === this.data.taskId);
    this.setData({ task });
    // 重新计算达标状态
    const isDailyDone = dailyTarget > 0 && this.data.todayCount >= dailyTarget;
    const isTotalDone = totalTarget > 0 && this.data.total >= totalTarget;
    this.setData({ isDailyDone, isTotalDone });
    wx.showToast({ title: '目标已保存', icon: 'success' });
  },
  saveDailyTarget() { this.saveTargets(); },
  saveTotalTarget() { this.saveTargets(); },

  // ===== 发愿 / 回向 / 备注 =====
  onWishInput(e) { this.setData({ 'detail.wish': e.detail.value }); },
  saveWish() { this.saveDaily('wish'); },
  onDedicateInput(e) { this.setData({ 'detail.dedicate': e.detail.value }); },
  saveDedicate() { this.saveDaily('dedicate'); },
  onNoteInput(e) { this.setData({ 'detail.note': e.detail.value }); },
  saveNote() { this.saveDaily('note'); },

  saveDaily(field) {
    const d = chant.getDailyDetail(chant.getToday()) || {};
    d[field] = this.data.detail[field];
    chant.saveDailyDetail(chant.getToday(), d);
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  // ===== 导航 =====
  goFocus() {
    wx.navigateTo({ url: '/pages/chanting-focus/chanting-focus?id=' + this.data.taskId });
  },
  onDelete() {
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
