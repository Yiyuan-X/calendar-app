// pages/add-event/add-event.js — 添加/编辑重要日子
const storage = require('../../utils/storage');
const share = require('../../utils/share');
const reminderUtil = require('../../utils/reminder');
const analytics = require('../../utils/analytics');

Page({
  data: {
    isEdit: false,
    editId: '',
    formData: {
      name: '',
      date: '',
      category: 'birthday',
      isCountdown: true,
      remark: '',
      remind: false,
      reminder: reminderUtil.getDefaultReminder()
    },
    reminderLabel: '不提醒',
    reminderAdvanceLabel: '当天提醒',
    reminderRepeatLabel: '仅一次',
    reminderAdvanceOptions: ['当天提醒', '提前1天', '提前3天', '提前7天', '提前1小时', '提前3小时'],
    reminderRepeatOptions: ['仅一次', '每年', '每月'],
    categories: [
      { key: 'birthday', name: '生日', icon: 'cake' },
      { key: 'anniversary', name: '纪念日', icon: 'heart' },
      { key: 'custom', name: '自定义', icon: 'star' }
    ],
    canSave: false,
    previewDays: 0
  },

  onLoad(options) {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    if (options.id) {
      this.loadEventForEdit(options.id);
    } else {
      const updates = {};

      // 预填日期（从日历页跳转）
      if (options.date) {
        updates['formData.date'] = options.date;
      }

      // 预填名称（从节日详情跳转）
      if (options.name) {
        updates['formData.name'] = decodeURIComponent(options.name);
        updates['formData.category'] = 'custom';
      }
      // 兼容旧参数 title
      if (options.title) {
        updates['formData.name'] = decodeURIComponent(options.title);
        updates['formData.category'] = 'custom';
      }

      if (Object.keys(updates).length > 0) {
        this.setData(updates);
        this.updateCanSave();
        this.updatePreview();
      }
    }
  },

  /** 加载事件数据用于编辑 */
  loadEventForEdit(id) {
    const events = storage.getEvents();
    const event = events.find(e => e.id === id);

    if (event) {
      this.setData({
        isEdit: true,
        editId: id,
        formData: {
          name: event.name || event.title || '',
          date: event.date || '',
          category: event.category || 'birthday',
          isCountdown: event.isCountdown !== undefined ? event.isCountdown : true,
          remark: event.remark || '',
          remind: event.remind || false,
          reminder: {
            ...reminderUtil.getDefaultReminder(),
            ...(event.reminder || {}),
            enabled: event.reminder ? !!event.reminder.enabled : !!event.remind
          }
        }
      });

      this.updateReminderLabel();
      wx.setNavigationBarTitle({ title: '编辑重要日子' });
      this.updateCanSave();
      this.updatePreview();
    }
  },

  /** 名称输入 */
  onNameInput(e) {
    this.setData({ 'formData.name': e.detail.value });
    this.updateCanSave();
    this.updatePreview();
  },

  /** 日期选择 */
  onDateChange(e) {
    this.setData({ 'formData.date': e.detail.value });
    this.updateCanSave();
    this.updatePreview();
  },

  /** 分类选择 */
  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ 'formData.category': key });
  },

  /** 计时模式切换 */
  onModeSwitch(e) {
    const mode = e.currentTarget.dataset.mode === 'true';
    this.setData({ 'formData.isCountdown': mode });
    this.updatePreview();
  },

  /** 备注输入 */
  onRemarkInput(e) {
    this.setData({ 'formData.remark': e.detail.value });
  },

  /** 提醒开关 */
  onRemindSwitch(e) {
    const enabled = e.detail.value;
    const updates = {
      'formData.remind': enabled,
      'formData.reminder.enabled': enabled
    };
    if (enabled && !this.data.isEdit) {
      updates['formData.reminder.time'] = reminderUtil.getDefaultReminder().time;
    }
    this.setData(updates, () => this.updateReminderLabel());
  },

  onReminderTimeChange(e) {
    this.setData({ 'formData.reminder.time': e.detail.value }, () => this.updateReminderLabel());
  },

  onReminderAdvanceChange(e) {
    const index = parseInt(e.detail.value) || 0;
    const configs = [
      { advanceValue: 0, advanceUnit: 'days' },
      { advanceValue: 1, advanceUnit: 'days' },
      { advanceValue: 3, advanceUnit: 'days' },
      { advanceValue: 7, advanceUnit: 'days' },
      { advanceValue: 1, advanceUnit: 'hours' },
      { advanceValue: 3, advanceUnit: 'hours' }
    ];
    const config = configs[index] || configs[0];
    this.setData({
      'formData.reminder.advanceValue': config.advanceValue,
      'formData.reminder.advanceUnit': config.advanceUnit
    }, () => this.updateReminderLabel());
  },

  onReminderRepeatChange(e) {
    const index = parseInt(e.detail.value) || 0;
    const repeats = ['none', 'yearly', 'monthly'];
    this.setData({ 'formData.reminder.repeat': repeats[index] || 'none' }, () => this.updateReminderLabel());
  },

  updateReminderLabel() {
    const reminder = this.data.formData.reminder || {};
    const advanceValue = parseInt(reminder.advanceValue) || 0;
    const advanceUnit = reminder.advanceUnit === 'hours' ? '小时' : '天';
    const advanceLabel = advanceValue > 0 ? `提前${advanceValue}${advanceUnit}` : '当天提醒';
    const repeatMap = { none: '仅一次', yearly: '每年', monthly: '每月' };
    this.setData({
      reminderLabel: reminderUtil.getReminderLabel(reminder),
      reminderAdvanceLabel: advanceLabel,
      reminderRepeatLabel: repeatMap[reminder.repeat] || '仅一次'
    });
  },

  /** 更新保存按钮状态 */
  updateCanSave() {
    const { name, date } = this.data.formData;
    this.setData({ canSave: name.trim() !== '' && date !== '' });
  },

  /** 更新预览天数 */
  updatePreview() {
    const { date, isCountdown } = this.data.formData;
    if (!date) return;
    const days = storage.getDaysDiff(date, isCountdown);
    this.setData({ previewDays: days });
  },

  /** 获取分类对应的颜色类名 */
  getCategoryColor(category) {
    const colorMap = {
      birthday: 'dot-pink',
      anniversary: 'dot-red',
      salary: 'dot-green',
      custom: 'dot-blue'
    };
    return colorMap[category] || 'dot-blue';
  },

  /** 保存 */
  onSave() {
    const { formData, isEdit, editId } = this.data;

    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }

    if (!formData.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }

    // 统一使用 name 字段存储（同时兼容写入 title，保证旧数据可读）
    const saveData = {
      name: formData.name.trim(),
      title: formData.name.trim(), // 双写兼容
      date: formData.date,
      category: formData.category,
      isCountdown: formData.isCountdown,
      remark: formData.remark,
      remind: formData.remind,
      reminder: { ...reminderUtil.getDefaultReminder(), ...(formData.reminder || {}), enabled: !!formData.remind }
    };

    let savedEvent = null;
    if (isEdit) {
      savedEvent = storage.updateEvent(editId, saveData);
      wx.showToast({ title: '已更新', icon: 'success' });
    } else {
      savedEvent = storage.addEvent(saveData);
      analytics.track('event_add', {
        category: saveData.category,
        remind: !!saveData.remind
      });
      wx.showToast({ title: '已创建', icon: 'success' });
    }

    this.saveEventReminder(savedEvent);

    setTimeout(() => { wx.navigateBack(); }, 800);
  },

  saveEventReminder(event) {
    if (!event || !event.id) return;
    const reminder = { ...reminderUtil.getDefaultReminder(), ...(event.reminder || {}) };
    if (!reminder.enabled) {
      reminderUtil.deleteReminderPlan('event_' + event.id);
      return;
    }

    const nextNotifyAt = reminderUtil.computeNextNotifyAt(event.date, reminder);
    const plan = {
      id: 'event_' + event.id,
      sourceType: 'event',
      sourceId: event.id,
      title: event.name || event.title || '重要日子',
      content: event.remark || '',
      date: event.date,
      page: 'pages/index/index',
      reminder,
      nextNotifyAt,
      lastNotifyAt: 0,
      enabled: !!nextNotifyAt
    };
    reminderUtil.saveReminderPlan(plan);
    analytics.track('reminder_set', {
      sourceType: 'event',
      sourceId: event.id,
      repeat: reminder.repeat || 'none',
      advanceValue: reminder.advanceValue || 0,
      advanceUnit: reminder.advanceUnit || 'days'
    });
    reminderUtil.requestSubscribe((res) => {
      if (res && res.reason === 'missing_template_id') {
        console.warn('订阅消息模板 ID 未配置，提醒计划已保存但不会发送微信订阅消息');
      }
    });
  },

  /** 删除 */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个重要日子吗？此操作不可恢复。',
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          storage.deleteEvent(this.data.editId);
          reminderUtil.deleteReminderPlan('event_' + this.data.editId);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => { wx.navigateBack(); }, 800);
        }
      }
    });
  },

  onShareAppMessage() {
    const name = this.data.formData.name || '重要日子';
    return share.appMessage({
      title: `${name} · 岁时记`,
      path: '/pages/index/index'
    });
  },

  onShareTimeline() {
    const name = this.data.formData.name || '重要日子';
    return share.timeline({
      title: `${name} · 岁时记`
    });
  }
});
