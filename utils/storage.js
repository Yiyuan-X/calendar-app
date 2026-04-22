/**
 * 本地存储管理
 */

const STORAGE_KEYS = {
  EVENTS: 'events',
  NOTES: 'notes',
  REMINDERS: 'reminders',
  SETTINGS: 'settings',
  MERIT_RECORDS: 'merit_records',   // 功德记录
  CUSTOM_MERIT_ITEMS: 'custom_merit_items', // 自定义功过条目
  INITIALIZED: 'initialized'
};

/**
 * 获取存储的数据
 */
function getStorage(key) {
  try {
    const data = wx.getStorageSync(key);
    return data ? data : null;
  } catch (e) {
    console.error('读取存储失败:', e);
    return null;
  }
}

/**
 * 设置存储数据
 */
function setStorage(key, data) {
  try {
    wx.setStorageSync(key, data);
    return true;
  } catch (e) {
    console.error('写入存储失败:', e);
    return false;
  }
}

/**
 * 删除存储数据
 */
function removeStorage(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (e) {
    console.error('删除存储失败:', e);
    return false;
  }
}

// ===== 事件（重要日子）管理 =====

/**
 * 获取所有事件
 */
function getEvents() {
  return getStorage(STORAGE_KEYS.EVENTS) || [];
}

/**
 * 添加事件
 */
function addEvent(event) {
  const events = getEvents();
  event.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
  event.createdAt = Date.now();
  events.push(event);
  setStorage(STORAGE_KEYS.EVENTS, events);
  return event;
}

/**
 * 更新事件
 */
function updateEvent(eventId, updates) {
  const events = getEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    events[index] = { ...events[index], ...updates };
    setStorage(STORAGE_KEYS.EVENTS, events);
    return events[index];
  }
  return null;
}

/**
 * 删除事件
 */
function deleteEvent(eventId) {
  let events = getEvents();
  events = events.filter(e => e.id !== eventId);
  setStorage(STORAGE_KEYS.EVENTS, events);
  return true;
}

/**
 * 计算距离某天的天数
 */
function getDaysDiff(targetDate, isCountdown = true) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (isCountdown) {
    // 倒计时模式：未来的天数
    if (diffDays >= 0) return diffDays;
    // 如果已过去，返回负数或计算到下一年的同一天
    return diffDays;
  } else {
    // 正计时模式：已经过去的绝对天数
    return Math.abs(diffDays);
  }
}

/**
 * 获取即将到来的事件列表（按天数排序）
 */
function getUpcomingEvents(limit = 10) {
  const events = getEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events.map(event => {
    const target = new Date(event.date);
    target.setHours(0, 0, 0, 0);
    let diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    // 如果日期已过且是循环事件，计算到下一年
    if (diffDays < 0 && !event.isPast) {
      target.setFullYear(today.getFullYear() + 1);
      diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    }

    return {
      ...event,
      daysAway: diffDays,
      isUpcoming: diffDays >= 0
    };
  })
  .filter(e => e.daysAway >= -365) // 排除太久以前的
  .sort((a, b) => a.daysAway - b.daysAway);

  return upcoming.slice(0, limit);
}

// ===== 备注管理 =====

/**
 * 获取所有备注
 */
function getNotes() {
  return getStorage(STORAGE_KEYS.NOTES) || {};
}

/**
 * 获取指定日期的备注
 */
function getNoteByDate(dateStr) {
  const notes = getNotes();
  return notes[dateStr] || null;
}

/**
 * 添加/更新备注
 */
function saveNote(dateStr, content) {
  const notes = getNotes();
  notes[dateStr] = {
    content: content,
    updatedAt: Date.now()
  };
  setStorage(STORAGE_KEYS.NOTES, notes);
  return notes[dateStr];
}

/**
 * 删除备注
 */
function deleteNote(dateStr) {
  const notes = getNotes();
  delete notes[dateStr];
  setStorage(STORAGE_KEYS.NOTES, notes);
  return true;
}

// ===== 提醒设置 =====

/**
 * 获取提醒设置
 */
function getReminders() {
  return getStorage(STORAGE_KEYS.REMINDERS) || {};
}

/**
 * 更新提醒设置
 */
function updateReminder(eventId, enabled) {
  const reminders = getReminders();
  reminders[eventId] = { enabled, updatedAt: Date.now() };
  setStorage(STORAGE_KEYS.REMINDERS, reminders);
  return reminders[eventId];
}

// ===== 设置管理 =====

/**
 * 默认设置
 */
const DEFAULT_SETTINGS = {
  showLiuZhai: false,        // 显示六斋日（默认关闭）
  showLunarFestivals: true,  // 显示农历初一/十五
  showBuddhistFestivals: true // 显示佛教纪念日（佛诞日等）
};

/**
 * 获取所有设置
 */
function getSettings() {
  const saved = getStorage(STORAGE_KEYS.SETTINGS);
  if (!saved) return { ...DEFAULT_SETTINGS };
  // 合并默认值（防止旧版本缺少新字段）
  return { ...DEFAULT_SETTINGS, ...saved };
}

/**
 * 获取某一项设置
 */
function getSetting(key) {
  const settings = getSettings();
  return settings[key] !== undefined ? settings[key] : DEFAULT_SETTINGS[key];
}

/**
 * 更新设置
 */
function updateSettings(updates) {
  const settings = getSettings();
  const newSettings = { ...settings, ...updates };
  setStorage(STORAGE_KEYS.SETTINGS, newSettings);
  return newSettings;
}

// ===== 功德记录管理（了凡四训功过格） =====

/**
 * 获取所有功德记录
 * @returns {object} { '2026-04-22': { items: [...], note: '' }, ... }
 */
function getMeritRecords() {
  return getStorage(STORAGE_KEYS.MERIT_RECORDS) || {};
}

/**
 * 获取指定日期的功德记录
 * @param {string} dateStr - YYYY-MM-DD
 */
function getMeritRecordByDate(dateStr) {
  const records = getMeritRecords();
  return records[dateStr] || null;
}

/**
 * 保存某日的功德记录
 * @param {string} dateStr - YYYY-MM-DD
 * @param {Array} items - 功过条目数组 [{ type, itemId, text, merit/demerit, categoryId }]
 * @param {string} note - 当日反省备注
 */
function saveMeritRecord(dateStr, items, note = '') {
  const records = getMeritRecords();
  records[dateStr] = {
    items: items,
    note: note,
    updatedAt: Date.now()
  };
  setStorage(STORAGE_KEYS.MERIT_RECORDS, records);
  return records[dateStr];
}

/**
 * 删除某日的功德记录
 */
function deleteMeritRecord(dateStr) {
  const records = getMeritRecords();
  delete records[dateStr];
  setStorage(STORAGE_KEYS.MERIT_RECORDS, records);
  return true;
}

/**
 * 获取最近N天的功德记录列表
 * @param {number} limit - 天数限制
 * @returns {Array} 按日期倒序的记录数组
 */
function getRecentMeritRecords(limit = 30) {
  const records = getMeritRecords();
  const dates = Object.keys(records).sort().reverse();
  return dates.slice(0, limit).map(dateStr => ({
    dateStr,
    ...records[dateStr]
  }));
}

/**
 * 获取功德记录的总天数
 */
function getMeritRecordCount() {
  const records = getMeritRecords();
  return Object.keys(records).length;
}

// ===== 自定义功过条目管理 =====

/**
 * 获取所有自定义功过条目
 * @returns {Array} [{ id, type, text, merit/demerit, createdAt }]
 */
function getCustomMeritItems() {
  return getStorage(STORAGE_KEYS.CUSTOM_MERIT_ITEMS) || [];
}

/**
 * 添加自定义功过条目
 * @param {string} type - 'good' | 'bad'
 * @param {string} text - 条目内容
 * @param {number} score - 功德/过失分数（正数）
 */
function addCustomMeritItem(type, text, score) {
  const items = getCustomMeritItems();
  const item = {
    id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    type: type,
    text: text.trim(),
    merit: type === 'good' ? score : 0,
    demerit: type === 'bad' ? score : 0,
    createdAt: Date.now()
  };
  items.push(item);
  setStorage(STORAGE_KEYS.CUSTOM_MERIT_ITEMS, items);
  return item;
}

/**
 * 更新自定义功过条目
 * @param {string} itemId - 条目ID
 * @param {object} updates - 要更新的字段 { text, merit/demerit }
 */
function updateCustomMeritItem(itemId, updates) {
  const items = getCustomMeritItems();
  const index = items.findIndex(i => i.id === itemId);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setStorage(STORAGE_KEYS.CUSTOM_MERIT_ITEMS, items);
    return items[index];
  }
  return null;
}

/**
 * 删除自定义功过条目
 * @param {string} itemId - 条目ID
 */
function deleteCustomMeritItem(itemId) {
  let items = getCustomMeritItems();
  items = items.filter(i => i.id !== itemId);
  setStorage(STORAGE_KEYS.CUSTOM_MERIT_ITEMS, items);
  return true;
}

module.exports = {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  removeStorage,
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  getDaysDiff,
  getUpcomingEvents,
  getNotes,
  getNoteByDate,
  saveNote,
  deleteNote,
  getReminders,
  updateReminder,
  // 设置
  DEFAULT_SETTINGS,
  getSettings,
  getSetting,
  updateSettings,
  // 功德记录
  getMeritRecords,
  getMeritRecordByDate,
  saveMeritRecord,
  deleteMeritRecord,
  getRecentMeritRecords,
  getMeritRecordCount,
  // 自定义功过条目
  getCustomMeritItems,
  addCustomMeritItem,
  updateCustomMeritItem,
  deleteCustomMeritItem
};
