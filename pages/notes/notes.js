// pages/notes/notes.js
const calendarUtil = require('../../utils/calendar');
const storage = require('../../utils/storage');
const share = require('../../utils/share');
const reminderUtil = require('../../utils/reminder');
const analytics = require('../../utils/analytics');

Page({
  data: {
    dateStr: '',
    displayDate: '',
    weekdayText: '',
    noteContent: '',
    canSave: false,
    hasExistingNote: false,
    autoFocus: true,
    placeholder: '今天有什么想记录的？',
    remind: false,
    reminder: reminderUtil.getDefaultReminder(),
    reminderLabel: '不提醒',
    reminderAdvanceLabel: '当天提醒',
    reminderRepeatLabel: '仅一次',
    reminderAdvanceOptions: ['当天提醒', '提前1天', '提前3天', '提前7天', '提前1小时', '提前3小时'],
    reminderRepeatOptions: ['仅一次', '每年', '每月']
  },

  onLoad(options) {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    const dateStr = options.date || '';

    if (!dateStr) {
      // 如果没有日期参数，使用今天
      const today = calendarUtil.getTodayInfo();
      this.setData({
        dateStr: today.dateStr
      });
    } else {
      this.setData({ dateStr });
    }

    this.initData();
  },

  /**
   * 初始化数据
   */
  initData() {
    const { dateStr } = this.data;

    // 格式化显示日期
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      this.setData({
        displayDate: `${parseInt(parts[0])}年${parseInt(parts[1])}月${parseInt(parts[2])}日`,
        weekdayText: weekNames[dateObj.getDay()]
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: `${parts[0]}年${parts[1]}月${parts[2]}日 · 备注`
      });
    }

    // 加载已有备注
    const existingNote = storage.getNoteByDate(dateStr);
    if (existingNote && existingNote.content) {
      this.setData({
        noteContent: existingNote.content,
        canSave: !!existingNote.content.trim(),
        hasExistingNote: true,
        remind: !!(existingNote.reminder && existingNote.reminder.enabled),
        reminder: { ...reminderUtil.getDefaultReminder(), ...(existingNote.reminder || {}) }
      });
    }
    this.updateReminderLabel();

    // 根据日期设置不同的 placeholder
    this.setDatePlaceholder();
  },

  /**
   * 根据日期设置提示文字
   */
  setDatePlaceholder() {
    const placeholders = [
      '今天有什么想记录的？',
      '此刻的心情，值得被记住',
      '写下今天的回忆或期待',
      '一句话，记录这个特别的日子',
      '今天的你，在想什么？',
      '这一刻，留给未来的自己',
      '记录一下，此刻的温度',
      '日子很普通，但值得被写下',
      '留下些什么，让时间慢一点',

      '有没有一句话，属于今天',
      '把这一刻轻轻放进时间里',
      '今天的光，是什么颜色',
      '为今天写一个小注脚',
      '这一页，只属于今天',

      '记下一个瞬间，就够了',
      '今天，有没有一点点不同',
      '用一句话，收藏这一天',
      '时间会走，但文字会留下',
      '写给未来的自己一行字',

      '今天的故事，从这里开始',
      '把心情，交给这一行字',
      '今天的你，想说点什么',
      '记录一点真实的自己',
      '这一刻，不需要完美',

      '写点什么，让今天不只是今天',
      '有些日子，需要被认真对待',
      '把今天折叠进一段文字',
      '让记忆有个落脚的地方',
      '这一刻，值得被温柔记录'
    ];

    const randomIndex = Math.floor(Math.random() * placeholders.length);
    this.setData({ placeholder: placeholders[randomIndex] });
  },

  /**
   * 备注输入
   */
  onNoteInput(e) {
    const noteContent = e.detail.value;
    this.setData({
      noteContent,
      canSave: !!noteContent.trim()
    });
  },

  onRemindSwitch(e) {
    const enabled = e.detail.value;
    const updates = {
      remind: enabled,
      'reminder.enabled': enabled
    };
    if (enabled && !this.data.hasExistingNote) {
      updates['reminder.time'] = reminderUtil.getDefaultReminder().time;
    }
    this.setData(updates, () => this.updateReminderLabel());
  },

  onReminderTimeChange(e) {
    this.setData({ 'reminder.time': e.detail.value }, () => this.updateReminderLabel());
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
      'reminder.advanceValue': config.advanceValue,
      'reminder.advanceUnit': config.advanceUnit
    }, () => this.updateReminderLabel());
  },

  onReminderRepeatChange(e) {
    const index = parseInt(e.detail.value) || 0;
    const repeats = ['none', 'yearly', 'monthly'];
    this.setData({ 'reminder.repeat': repeats[index] || 'none' }, () => this.updateReminderLabel());
  },

  updateReminderLabel() {
    const reminder = this.data.reminder || {};
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

  /**
   * 保存备注
   */
  onSave() {
    const { dateStr, noteContent, reminder, remind } = this.data;

    if (!noteContent.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    const noteReminder = { ...reminderUtil.getDefaultReminder(), ...(reminder || {}), enabled: !!remind };
    storage.saveNote(dateStr, noteContent.trim(), noteReminder);
    this.saveNoteReminder(noteContent.trim(), noteReminder);

    wx.showToast({
      title: this.data.hasExistingNote ? '已更新' : '已保存',
      icon: 'success'
    });

    this.setData({ hasExistingNote: true });

    setTimeout(() => {
      wx.navigateBack();
    }, 800);
  },

  saveNoteReminder(content, reminder) {
    const { dateStr, displayDate } = this.data;
    const reminderId = 'note_' + dateStr;
    if (!reminder || !reminder.enabled) {
      reminderUtil.deleteReminderPlan(reminderId);
      return;
    }
    const nextNotifyAt = reminderUtil.computeNextNotifyAt(dateStr, reminder);
    const plan = {
      id: reminderId,
      sourceType: 'note',
      sourceId: dateStr,
      title: displayDate + ' 备注',
      content,
      date: dateStr,
      page: 'pages/notes/notes?date=' + dateStr,
      reminder,
      nextNotifyAt,
      lastNotifyAt: 0,
      enabled: !!nextNotifyAt
    };
    reminderUtil.saveReminderPlan(plan);
    analytics.track('reminder_set', {
      sourceType: 'note',
      sourceId: dateStr,
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

  /**
   * 清除备注
   */
  onClear() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除这条备注吗？',
      confirmText: '清除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          storage.deleteNote(this.data.dateStr);
          reminderUtil.deleteReminderPlan('note_' + this.data.dateStr);
          this.setData({
            noteContent: '',
            canSave: false,
            hasExistingNote: false,
            remind: false,
            reminder: reminderUtil.getDefaultReminder()
          });
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  },

  onShareAppMessage() {
    const title = this.data.displayDate ? `${this.data.displayDate} 备注 · 岁时记` : '岁时记 · 记录时光';
    return share.appMessage({
      title: title,
      path: '/pages/index/index'
    });
  },

  onShareTimeline() {
    const title = this.data.displayDate ? `${this.data.displayDate} 备注 · 岁时记` : '岁时记 · 记录时光';
    return share.timeline({ title: title });
  }
});
