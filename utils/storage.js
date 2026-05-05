/**
 * utils/storage.js — 统一数据存储管理
 *
 * 策略：云端优先 + 本地缓存 + 离线兜底
 * - 所有读写操作同时写云端和本地
 * - 云端不可用时自动降级为纯本地模式
 * - 原有API完全兼容，各页面无需改动
 */

const cloud = require('./cloud');

const STORAGE_KEYS = {
  EVENTS: 'events',
  NOTES: 'notes',
  REMINDERS: 'reminders',
  SETTINGS: 'settings',
  MERIT_RECORDS: 'merit_records',
  CUSTOM_MERIT_ITEMS: 'custom_merit_items',
  DELETED_BUILTIN_ITEMS: 'deleted_builtin_items',
  FAVORITE_QUOTES: 'favorite_quotes',
  INITIALIZED: 'initialized'
};

// ===== 本地存储底层（始终保留作为缓存/降级）=====

function getStorage(key) {
  try {
    const data = wx.getStorageSync(key);
    return data ? data : null;
  } catch (e) {
    return null;
  }
}

function setStorage(key, data) {
  try {
    wx.setStorageSync(key, data);
    return true;
  } catch (e) {
    return false;
  }
}

function removeStorage(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (e) {
    return false;
  }
}

function hasStorageKey(key) {
  try {
    const info = wx.getStorageInfoSync();
    return !!(info && info.keys && info.keys.includes(key));
  } catch (e) {
    return false;
  }
}

function isPlainObjectWithData(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

/**
 * 启动时补同步本地已有数据到云端。
 * 只同步本地已存在且有内容的数据，避免空本地缓存覆盖云端数据。
 */
function syncLocalDataToCloud() {
  try {
    const events = getEvents();
    if (events.length > 0) cloud.setList(cloud.TABLES.EVENTS, events);

    const notes = getNotes();
    if (isPlainObjectWithData(notes)) cloud.set(cloud.TABLES.NOTES, 'all', notes);

    const reminders = getReminders();
    if (isPlainObjectWithData(reminders)) cloud.set(cloud.TABLES.REMINDERS, 'all', reminders);

    if (hasStorageKey(STORAGE_KEYS.SETTINGS)) {
      cloud.set(cloud.TABLES.SETTINGS, 'user', getSettings());
    }

    const meritRecords = getMeritRecords();
    Object.keys(meritRecords).forEach(dateStr => {
      cloud.set(cloud.TABLES.MERIT_RECORDS, dateStr, meritRecords[dateStr]);
    });

    const customMeritItems = getCustomMeritItems();
    if (customMeritItems.length > 0) cloud.setList(cloud.TABLES.CUSTOM_MERIT_ITEMS, customMeritItems);

    const deletedBuiltinItems = getDeletedBuiltinItems();
    if (deletedBuiltinItems.length > 0) cloud.set(cloud.TABLES.DELETED_BUILTIN_ITEMS, 'list', deletedBuiltinItems);

    const favoriteQuotes = getFavoriteQuotes();
    if (favoriteQuotes.length > 0) cloud.setList(cloud.TABLES.FAVORITE_QUOTES, favoriteQuotes);

    const chantingTasks = wx.getStorageSync('chanting_tasks') || [];
    if (chantingTasks.length > 0) cloud.setList(cloud.TABLES.TASKS, chantingTasks);

    let chantingRecords = wx.getStorageSync('chanting_records') || {};
    const recordsBackup = wx.getStorageSync('chanting_records_backup') || null;
    if (!isPlainObjectWithData(chantingRecords) && recordsBackup && recordsBackup.records) {
      chantingRecords = recordsBackup.records;
    }
    Object.keys(chantingRecords || {}).forEach(dateStr => {
      cloud.set(cloud.TABLES.RECORDS, dateStr, chantingRecords[dateStr] || {});
    });

    const chantingDaily = wx.getStorageSync('chanting_daily') || {};
    Object.keys(chantingDaily || {}).forEach(dateStr => {
      cloud.set(cloud.TABLES.DAILY_DETAIL, dateStr, chantingDaily[dateStr]);
    });

    if (hasStorageKey('quick_count')) {
      cloud.set(cloud.TABLES.QUICK_COUNTER, 'main', wx.getStorageSync('quick_count') || 0);
    }

    if (hasStorageKey('chanting_memo')) {
      cloud.set(cloud.TABLES.MEMO, 'main', wx.getStorageSync('chanting_memo') || '');
    }
  } catch (e) {
    console.warn('[Storage] 本地数据补同步到云端失败:', e);
  }
}

// ==================== 事件（重要日子）管理 ====================

function getEvents() {
  return getStorage(STORAGE_KEYS.EVENTS) || [];
}

async function getEventsAsync() {
  try {
    const list = await cloud.getList(cloud.TABLES.EVENTS);
    if (list && list.length > 0) {
      setStorage(STORAGE_KEYS.EVENTS, list.map(i => i.data || i));
      return list.map(i => i.data || i);
    }
  } catch (e) {}
  return getEvents();
}

function addEvent(event) {
  const events = getEvents();
  event.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
  event.createdAt = Date.now();
  events.push(event);
  setStorage(STORAGE_KEYS.EVENTS, events);
  // 异步同步到云端
  cloud.setList(cloud.TABLES.EVENTS, events);
  return event;
}

function updateEvent(eventId, updates) {
  const events = getEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    events[index] = { ...events[index], ...updates };
    setStorage(STORAGE_KEYS.EVENTS, events);
    cloud.setList(cloud.TABLES.EVENTS, events);
    return events[index];
  }
  return null;
}

function deleteEvent(eventId) {
  let events = getEvents();
  events = events.filter(e => e.id !== eventId);
  setStorage(STORAGE_KEYS.EVENTS, events);
  cloud.setList(cloud.TABLES.EVENTS, events);
  return true;
}

function getDaysDiff(targetDate, isCountdown = true) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (isCountdown) return diffDays;
  return Math.abs(diffDays);
}

function getUpcomingEvents(limit = 10) {
  const events = getEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events.map(event => {
    const target = new Date(event.date);
    target.setHours(0, 0, 0, 0);
    let diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 && !event.isPast) {
      target.setFullYear(today.getFullYear() + 1);
      diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    }
    return { ...event, daysAway: diffDays, isUpcoming: diffDays >= 0 };
  })
  .filter(e => e.daysAway >= -365)
  .sort((a, b) => a.daysAway - b.daysAway);

  return upcoming.slice(0, limit);
}

// ==================== 备注管理 ====================

function getNotes() {
  return getStorage(STORAGE_KEYS.NOTES) || {};
}

function getNoteByDate(dateStr) {
  const notes = getNotes();
  return notes[dateStr] || null;
}

function saveNote(dateStr, content, reminder) {
  const notes = getNotes();
  notes[dateStr] = { content: content, updatedAt: Date.now() };
  if (reminder) notes[dateStr].reminder = reminder;
  setStorage(STORAGE_KEYS.NOTES, notes);
  cloud.set(cloud.TABLES.NOTES, 'all', notes);
  return notes[dateStr];
}

function deleteNote(dateStr) {
  const notes = getNotes();
  delete notes[dateStr];
  setStorage(STORAGE_KEYS.NOTES, notes);
  cloud.set(cloud.TABLES.NOTES, 'all', notes);
  return true;
}

// ==================== 提醒设置 ====================

function getReminders() {
  return getStorage(STORAGE_KEYS.REMINDERS) || {};
}

function updateReminder(eventId, reminder) {
  const reminders = getReminders();
  const updates = typeof reminder === 'object' ? reminder : { enabled: !!reminder };
  reminders[eventId] = { ...(reminders[eventId] || {}), ...updates, updatedAt: Date.now() };
  setStorage(STORAGE_KEYS.REMINDERS, reminders);
  cloud.set(cloud.TABLES.REMINDERS, 'all', reminders);
  return reminders[eventId];
}

function deleteReminder(eventId) {
  const reminders = getReminders();
  delete reminders[eventId];
  setStorage(STORAGE_KEYS.REMINDERS, reminders);
  cloud.set(cloud.TABLES.REMINDERS, 'all', reminders);
  return true;
}

// ==================== 设置管理 ====================

const DEFAULT_SETTINGS = {
  showLiuZhai: false,
  showLunarFestivals: true,
  showBuddhistFestivals: true,
  elderMode: false
};

function getSettings() {
  const saved = getStorage(STORAGE_KEYS.SETTINGS);
  if (!saved) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...saved };
}

function getSetting(key) {
  const settings = getSettings();
  return settings[key] !== undefined ? settings[key] : DEFAULT_SETTINGS[key];
}

function updateSettings(updates) {
  const settings = getSettings();
  const newSettings = { ...settings, ...updates };
  setStorage(STORAGE_KEYS.SETTINGS, newSettings);
  cloud.set(cloud.TABLES.SETTINGS, 'user', newSettings);
  return newSettings;
}

// ==================== 功德记录管理 ====================

function getMeritRecords() {
  return getStorage(STORAGE_KEYS.MERIT_RECORDS) || {};
}

function getMeritRecordByDate(dateStr) {
  const records = getMeritRecords();
  return records[dateStr] || null;
}

function saveMeritRecord(dateStr, items, note = '') {
  const records = getMeritRecords();
  records[dateStr] = { items: items, note: note, updatedAt: Date.now() };
  setStorage(STORAGE_KEYS.MERIT_RECORDS, records);
  cloud.set(cloud.TABLES.MERIT_RECORDS, dateStr, records[dateStr]);
  return records[dateStr];
}

function deleteMeritRecord(dateStr) {
  const records = getMeritRecords();
  delete records[dateStr];
  setStorage(STORAGE_KEYS.MERIT_RECORDS, records);
  cloud.remove(cloud.TABLES.MERIT_RECORDS, dateStr);
  return true;
}

function getRecentMeritRecords(limit = 30) {
  const records = getMeritRecords();
  const dates = Object.keys(records).sort().reverse();
  return dates.slice(0, limit).map(dateStr => ({ dateStr, ...records[dateStr] }));
}

function getMeritRecordCount() {
  const records = getMeritRecords();
  return Object.keys(records).length;
}

// ==================== 自定义功过条目管理 ====================

function getCustomMeritItems() {
  return getStorage(STORAGE_KEYS.CUSTOM_MERIT_ITEMS) || [];
}

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
  cloud.setList(cloud.TABLES.CUSTOM_MERIT_ITEMS, items);
  return item;
}

function updateCustomMeritItem(itemId, updates) {
  const items = getCustomMeritItems();
  const index = items.findIndex(i => i.id === itemId);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setStorage(STORAGE_KEYS.CUSTOM_MERIT_ITEMS, items);
    cloud.setList(cloud.TABLES.CUSTOM_MERIT_ITEMS, items);
    return items[index];
  }
  return null;
}

function deleteCustomMeritItem(itemId) {
  let items = getCustomMeritItems();
  items = items.filter(i => i.id !== itemId);
  setStorage(STORAGE_KEYS.CUSTOM_MERIT_ITEMS, items);
  cloud.setList(cloud.TABLES.CUSTOM_MERIT_ITEMS, items);
  return true;
}

// ==================== 内置条目删除管理 ====================

function getDeletedBuiltinItems() {
  return getStorage(STORAGE_KEYS.DELETED_BUILTIN_ITEMS) || [];
}

function markBuiltinItemDeleted(itemId) {
  const deleted = getDeletedBuiltinItems();
  if (!deleted.includes(itemId)) {
    deleted.push(itemId);
    setStorage(STORAGE_KEYS.DELETED_BUILTIN_ITEMS, deleted);
    cloud.set(cloud.TABLES.DELETED_BUILTIN_ITEMS, 'list', deleted);
  }
  return true;
}

function restoreBuiltinItem(itemId) {
  let deleted = getDeletedBuiltinItems();
  deleted = deleted.filter(id => id !== itemId);
  setStorage(STORAGE_KEYS.DELETED_BUILTIN_ITEMS, deleted);
  cloud.set(cloud.TABLES.DELETED_BUILTIN_ITEMS, 'list', deleted);
  return true;
}

function isBuiltinItemDeleted(itemId) {
  const deleted = getDeletedBuiltinItems();
  return deleted.includes(itemId);
}

function clearAllDeletedBuiltinItems() {
  removeStorage(STORAGE_KEYS.DELETED_BUILTIN_ITEMS);
  cloud.remove(cloud.TABLES.DELETED_BUILTIN_ITEMS, 'list');
  return true;
}

// ==================== 金句收藏 ====================

function getFavoriteQuotes() {
  return getStorage(STORAGE_KEYS.FAVORITE_QUOTES) || [];
}

function isQuoteFavorited(text) {
  const quote = String(text || '').trim();
  if (!quote) return false;
  return getFavoriteQuotes().some(item => item.text === quote);
}

function toggleFavoriteQuote(text) {
  const quote = String(text || '').trim();
  if (!quote) return { favorited: false, item: null };

  let list = getFavoriteQuotes();
  const index = list.findIndex(item => item.text === quote);
  if (index >= 0) {
    const item = list[index];
    list.splice(index, 1);
    setStorage(STORAGE_KEYS.FAVORITE_QUOTES, list);
    cloud.setList(cloud.TABLES.FAVORITE_QUOTES, list);
    return { favorited: false, item };
  }

  const item = {
    id: 'quote_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    text: quote,
    createdAt: Date.now()
  };
  list.unshift(item);
  setStorage(STORAGE_KEYS.FAVORITE_QUOTES, list);
  cloud.setList(cloud.TABLES.FAVORITE_QUOTES, list);
  return { favorited: true, item };
}

module.exports = {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  removeStorage,
  syncLocalDataToCloud,
  getEvents,
  getEventsAsync,
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
  deleteReminder,
  DEFAULT_SETTINGS,
  getSettings,
  getSetting,
  updateSettings,
  getMeritRecords,
  getMeritRecordByDate,
  saveMeritRecord,
  deleteMeritRecord,
  getRecentMeritRecords,
  getMeritRecordCount,
  getCustomMeritItems,
  addCustomMeritItem,
  updateCustomMeritItem,
  deleteCustomMeritItem,
  getDeletedBuiltinItems,
  markBuiltinItemDeleted,
  restoreBuiltinItem,
  isBuiltinItemDeleted,
  clearAllDeletedBuiltinItems,
  getFavoriteQuotes,
  isQuoteFavorited,
  toggleFavoriteQuote
};
