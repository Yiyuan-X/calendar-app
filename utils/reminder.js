/**
 * 提醒计划工具。
 *
 * 微信小程序不能直接创建系统闹钟；这里使用订阅消息 + 云函数定时扫描。
 * 需要在微信公众平台申请订阅消息模板后，把模板 ID 填到 SUBSCRIBE_TEMPLATE_ID。
 */
const storage = require('./storage');

const SUBSCRIBE_TEMPLATE_ID = 'CiKp84bu0bD5S2NDLn7sSF1W0XIEi3FoE6ZlBUmcbMU';

const DEFAULT_REMINDER = {
  enabled: false,
  advanceValue: 0,
  advanceUnit: 'days', // days | hours
  time: '09:00',
  repeat: 'none' // none | yearly | monthly
};

function getCurrentTime() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function getDefaultReminder() {
  return {
    ...DEFAULT_REMINDER,
    time: getCurrentTime()
  };
}

function pad(num) {
  return String(num).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function buildTargetDate(dateStr, timeStr) {
  const parts = String(dateStr || '').split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  const timeParts = String(timeStr || '09:00').split(':').map(Number);
  const hour = Number.isFinite(timeParts[0]) ? timeParts[0] : 9;
  const minute = Number.isFinite(timeParts[1]) ? timeParts[1] : 0;
  return new Date(parts[0], parts[1] - 1, parts[2], hour, minute, 0, 0);
}

function applyRepeatDate(originalDateStr, timeStr, repeat, now) {
  let target = buildTargetDate(originalDateStr, timeStr);
  if (!target) return null;

  if (repeat === 'yearly') {
    const original = buildTargetDate(originalDateStr, timeStr);
    const month = original.getMonth();
    const day = original.getDate();
    let year = now.getFullYear();
    const lastDay = getLastDayOfMonth(year, month + 1);
    target = new Date(year, month, Math.min(day, lastDay), original.getHours(), original.getMinutes(), 0, 0);
    if (target <= now) {
      year++;
      const nextLastDay = getLastDayOfMonth(year, month + 1);
      target = new Date(year, month, Math.min(day, nextLastDay), original.getHours(), original.getMinutes(), 0, 0);
    }
  } else if (repeat === 'monthly') {
    const original = buildTargetDate(originalDateStr, timeStr);
    const day = original.getDate();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let lastDay = getLastDayOfMonth(year, month);
    target = new Date(year, month - 1, Math.min(day, lastDay), original.getHours(), original.getMinutes(), 0, 0);
    if (target <= now) {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
      lastDay = getLastDayOfMonth(year, month);
      target = new Date(year, month - 1, Math.min(day, lastDay), original.getHours(), original.getMinutes(), 0, 0);
    }
  }

  return target;
}

function subtractAdvance(target, reminder) {
  const result = new Date(target.getTime());
  const value = Math.max(0, parseInt(reminder.advanceValue) || 0);
  if (value <= 0) return result;
  if (reminder.advanceUnit === 'hours') {
    result.setHours(result.getHours() - value);
  } else {
    result.setDate(result.getDate() - value);
  }
  return result;
}

function computeNextNotifyAt(dateStr, reminder, now = new Date()) {
  const options = { ...DEFAULT_REMINDER, ...(reminder || {}) };
  if (!options.enabled) return 0;

  let guard = 0;
  let checkNow = new Date(now.getTime());
  while (guard < 36) {
    const target = applyRepeatDate(dateStr, options.time, options.repeat, checkNow);
    if (!target) return 0;
    const notifyAt = subtractAdvance(target, options);
    if (notifyAt > now) return notifyAt.getTime();

    if (options.repeat === 'yearly') {
      checkNow = new Date(target.getFullYear() + 1, target.getMonth(), target.getDate(), target.getHours(), target.getMinutes());
    } else if (options.repeat === 'monthly') {
      checkNow = new Date(target.getFullYear(), target.getMonth() + 1, 1, target.getHours(), target.getMinutes());
    } else {
      return 0;
    }
    guard++;
  }
  return 0;
}

function getReminderLabel(reminder) {
  if (!reminder || !reminder.enabled) return '不提醒';
  const advance = parseInt(reminder.advanceValue) || 0;
  const unit = reminder.advanceUnit === 'hours' ? '小时' : '天';
  const advanceText = advance > 0 ? `提前${advance}${unit}` : '当天';
  const repeatMap = { none: '一次', yearly: '每年', monthly: '每月' };
  return `${repeatMap[reminder.repeat] || '一次'} · ${advanceText} · ${reminder.time || '09:00'}`;
}

function requestSubscribe(callback) {
  if (!SUBSCRIBE_TEMPLATE_ID) {
    if (callback) callback({ ok: false, reason: 'missing_template_id' });
    return;
  }
  wx.requestSubscribeMessage({
    tmplIds: [SUBSCRIBE_TEMPLATE_ID],
    success: (res) => {
      const ok = res[SUBSCRIBE_TEMPLATE_ID] === 'accept';
      if (callback) callback({ ok, result: res });
    },
    fail: (err) => {
      if (callback) callback({ ok: false, error: err });
    }
  });
}

function runDueReminderCheck(callback) {
  if (!wx.cloud || !wx.cloud.callFunction) {
    if (callback) callback({ ok: false, reason: 'cloud_unavailable' });
    return;
  }
  wx.cloud.callFunction({
    name: 'sendDueReminders',
    data: {},
    success: (res) => {
      console.log('[Reminder] sendDueReminders result:', res.result);
      if (callback) callback({ ok: true, result: res.result });
    },
    fail: (err) => {
      console.warn('[Reminder] sendDueReminders failed:', err);
      if (callback) callback({ ok: false, error: err });
    }
  });
}

function saveReminderPlan(plan) {
  if (!plan || !plan.id) return null;
  storage.updateReminder(plan.id, plan);
  return plan;
}

function deleteReminderPlan(id) {
  storage.deleteReminder(id);
}

function consumeDueLocalReminder() {
  const reminders = storage.getReminders();
  const now = Date.now();
  const due = Object.keys(reminders || {})
    .map(id => reminders[id])
    .filter(plan => plan && plan.enabled && plan.nextNotifyAt && plan.nextNotifyAt <= now)
    .sort((a, b) => a.nextNotifyAt - b.nextNotifyAt)[0];

  if (!due || due.lastLocalAlertAt === due.nextNotifyAt) return null;

  const alertPlan = { ...due };
  due.lastLocalAlertAt = due.nextNotifyAt;
  due.lastNotifyAt = now;

  if (due.reminder && (due.reminder.repeat === 'yearly' || due.reminder.repeat === 'monthly')) {
    due.nextNotifyAt = computeNextNotifyAt(due.date, due.reminder, new Date(now + 1000));
    due.enabled = !!due.nextNotifyAt;
  } else {
    due.enabled = false;
    due.nextNotifyAt = 0;
  }
  storage.updateReminder(due.id, due);
  return alertPlan;
}

function showDueLocalReminder() {
  const due = consumeDueLocalReminder();
  if (!due) return false;
  const tabPages = ['pages/index/index', 'pages/calendar/calendar', 'pages/merit/merit', 'pages/chanting/chanting'];
  const page = String(due.page || '');
  const pagePath = page.split('?')[0];
  wx.showModal({
    title: due.title || '提醒',
    content: due.content || '有一条提醒到时间了',
    confirmText: '查看',
    cancelText: '知道了',
    success: (res) => {
      if (res.confirm && page) {
        if (tabPages.indexOf(pagePath) >= 0) {
          wx.switchTab({ url: '/' + pagePath });
        } else {
          wx.navigateTo({ url: '/' + page });
        }
      }
    }
  });
  return true;
}

module.exports = {
  SUBSCRIBE_TEMPLATE_ID,
  DEFAULT_REMINDER,
  getDefaultReminder,
  computeNextNotifyAt,
  getReminderLabel,
  requestSubscribe,
  runDueReminderCheck,
  saveReminderPlan,
  deleteReminderPlan,
  showDueLocalReminder,
  formatDate
};
