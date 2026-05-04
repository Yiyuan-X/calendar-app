const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

const REMINDERS_COLLECTION = 'reminders';
const TEMPLATE_ID = 'CiKp84bu0bD5S2NDLn7sSF1W0XIEi3FoE6ZlBUmcbMU';
const TEMPLATE_FIELDS = {
  reminderPerson: 'name1',
  reminderDate: 'date2',
  reminderItem: 'thing3',
  subject: 'phrase5',
  remark: 'thing9'
};
const MINIPROGRAM_STATE = process.env.MINIPROGRAM_STATE || 'formal';

function pad(num) {
  return String(num).padStart(2, '0');
}

function formatDate(ts) {
  const date = new Date(ts);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatTime(ts) {
  const date = new Date(ts);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function truncateText(value, maxLen) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

function getReminderText(reminder) {
  if (!reminder) return '到点提醒';
  const advance = Math.max(0, parseInt(reminder.advanceValue) || 0);
  const unit = reminder.advanceUnit === 'hours' ? '小时' : '天';
  const advanceText = advance > 0 ? `提前${advance}${unit}` : '当天';
  const repeatMap = { none: '一次提醒', yearly: '每年提醒', monthly: '每月提醒' };
  return `${repeatMap[reminder.repeat] || '一次提醒'} ${advanceText}`;
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
    let lastDay = getLastDayOfMonth(year, month + 1);
    target = new Date(year, month, Math.min(day, lastDay), original.getHours(), original.getMinutes(), 0, 0);
    if (target <= now) {
      year++;
      lastDay = getLastDayOfMonth(year, month + 1);
      target = new Date(year, month, Math.min(day, lastDay), original.getHours(), original.getMinutes(), 0, 0);
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
  if (!reminder || !reminder.enabled) return 0;
  let guard = 0;
  let checkNow = new Date(now.getTime());
  while (guard < 36) {
    const target = applyRepeatDate(dateStr, reminder.time, reminder.repeat, checkNow);
    if (!target) return 0;
    const notifyAt = subtractAdvance(target, reminder);
    if (notifyAt > now) return notifyAt.getTime();
    if (reminder.repeat === 'yearly') {
      checkNow = new Date(target.getFullYear() + 1, target.getMonth(), target.getDate(), target.getHours(), target.getMinutes());
    } else if (reminder.repeat === 'monthly') {
      checkNow = new Date(target.getFullYear(), target.getMonth() + 1, 1, target.getHours(), target.getMinutes());
    } else {
      return 0;
    }
    guard++;
  }
  return 0;
}

function buildMessageData(plan) {
  return {
    [TEMPLATE_FIELDS.reminderPerson]: { value: '岁时记' },
    [TEMPLATE_FIELDS.reminderDate]: { value: formatDate(plan.nextNotifyAt || Date.now()) },
    [TEMPLATE_FIELDS.reminderItem]: { value: truncateText(`${formatTime(plan.nextNotifyAt || Date.now())} ${getReminderText(plan.reminder)}`, 20) || '到点提醒' },
    [TEMPLATE_FIELDS.subject]: { value: truncateText(plan.title || '日程提醒', 5) || '日程提醒' },
    [TEMPLATE_FIELDS.remark]: { value: truncateText(plan.content || '请查看日历提醒', 20) || '请查看日历提醒' }
  };
}

async function updateUserReminderDoc(doc, reminders) {
  await db.collection(REMINDERS_COLLECTION).doc(doc._id).update({
    data: {
      data: reminders,
      updatedAt: Date.now()
    }
  });
}

async function ensureReminderCollection() {
  try {
    await db.createCollection(REMINDERS_COLLECTION);
    return 'created';
  } catch (e) {
    const message = e.errMsg || e.message || String(e);
    if (message.indexOf('already exists') >= 0 || message.indexOf('collection exist') >= 0 || message.indexOf('DATABASE_COLLECTION_ALREADY_EXISTS') >= 0) {
      return 'exists';
    }
    return `create_failed: ${message}`;
  }
}

exports.main = async () => {
  if (!TEMPLATE_ID) {
    return { ok: false, reason: 'missing_template_id' };
  }

  const now = Date.now();
  const collectionState = await ensureReminderCollection();
  const checkedIds = [];
  const sentIds = [];
  const failedItems = [];
  const res = await db.collection(REMINDERS_COLLECTION)
    .where({ key: 'all' })
    .limit(100)
    .get();

  let sent = 0;
  let failed = 0;

  for (const doc of res.data || []) {
    const reminders = doc.data || {};
    let changed = false;

    for (const id of Object.keys(reminders)) {
      const plan = reminders[id];
      if (!plan || !plan.enabled || !plan.nextNotifyAt || plan.nextNotifyAt > now) continue;
      checkedIds.push(id);

      try {
        await cloud.openapi.subscribeMessage.send({
          touser: doc._openid,
          templateId: TEMPLATE_ID,
          page: plan.page || 'pages/index/index',
          data: buildMessageData(plan),
          miniprogramState: MINIPROGRAM_STATE
        });
        sent++;
        sentIds.push(id);
        plan.lastNotifyAt = now;

        const repeat = plan.reminder && plan.reminder.repeat;
        if (repeat === 'yearly' || repeat === 'monthly') {
          plan.nextNotifyAt = computeNextNotifyAt(plan.date, plan.reminder, new Date(now + 1000));
          plan.enabled = !!plan.nextNotifyAt;
        } else {
          plan.enabled = false;
          plan.nextNotifyAt = 0;
        }
        changed = true;
      } catch (e) {
        failed++;
        plan.lastError = e.errMsg || e.message || String(e);
        plan.lastErrorAt = now;
        failedItems.push({ id, error: plan.lastError });
        changed = true;
      }
    }

    if (changed) await updateUserReminderDoc(doc, reminders);
  }

  return {
    ok: true,
    state: MINIPROGRAM_STATE,
    collectionState,
    now,
    docs: (res.data || []).length,
    due: checkedIds.length,
    sent,
    failed,
    sentIds,
    failedItems
  };
};
