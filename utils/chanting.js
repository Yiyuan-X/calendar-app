/**
 * 功课计数器 — 数据模型与存储
 * 支持云端同步 + 本地缓存 + 离线兜底
 */
const cloud = require('./cloud');

const STORAGE_KEY = 'chanting_tasks';       // 用户功课列表
const RECORDS_KEY = 'chanting_records';     // 每日记录 { '2026-04-23': { taskId: count, ... } }
const DAILY_KEY = 'chanting_daily';         // 每日详情 { dateStr: { taskId:{ count,wish,note } } }
const RECORDS_BACKUP_KEY = 'chanting_records_backup';

const CLASSIC_COMBO_ID = 'classic_combo';
const CLASSIC_COMBO_NAME = '经典组合';
const CLASSIC_COMBO_ITEMS = [
  { key: 'great_compassion', name: '大悲咒', builtinId: 'b2', unit: '遍', perGroup: 27 },
  { key: 'heart_sutra', name: '心经', builtinId: 'b3', unit: '遍', perGroup: 49 },
  { key: 'rebirth', name: '往生咒', builtinId: 'b46', unit: '遍', perGroup: 84 },
  { key: 'seven_buddhas', name: '七佛灭罪真言', builtinId: 'b10', unit: '遍', perGroup: 87 }
];

// ==================== 内置热门功课 ====================
const BUILTIN = [
  // ===== 常用基础咒语（默认置顶） =====
  { id:'b67', name:'净口业真言', cat:'咒语', unit:'遍' },
  { id:'b2', name:'大悲咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b3', name:'心经', cat:'经典', unit:'遍', hot:true },
  { id:'b15', name:'礼佛大忏悔文', cat:'礼忏', unit:'遍', hot:true },
  { id:'b5', name:'解结咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b4', name:'往生净土神咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b7', name:'消灾吉祥神咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b6', name:'准提神咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b9', name:'大吉祥天女咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b10', name:'七佛灭罪真言', cat:'咒语', unit:'遍', hot:true },
  { id:'b12', name:'圣无量寿决定光明王陀罗尼', cat:'咒语', unit:'遍', hot:true },
  { id:'b13', name:'如意宝轮王陀罗尼', cat:'咒语', unit:'遍', hot:true },
  { id:'b16', name:'功德宝山神咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b17', name:'观音灵感真言', cat:'咒语', unit:'遍', hot:true },
  { id:'b11', name:'药师灌顶真言', cat:'咒语', unit:'遍', hot:true },
  { id: CLASSIC_COMBO_ID, name: CLASSIC_COMBO_NAME, cat: '组合', unit: '组', hot: true, combo: true },
  { id:'b68', name:'补阙真言', cat:'咒语', unit:'遍' },

  // ===== 佛号 =====
  { id:'b1', name:'南无观世音菩萨', cat:'佛号', unit:'声', hot:true },
  { id:'b18', name:'南无阿弥陀佛', cat:'佛号', unit:'声', hot:true },
  { id:'b22', name:'南无地藏王菩萨', cat:'佛号', unit:'声' },
  { id:'b23', name:'南无文殊师利菩萨', cat:'佛号', unit:'声' },
  { id:'b24', name:'南无普贤菩萨', cat:'佛号', unit:'声' },
  { id:'b25', name:'南无大势至菩萨', cat:'佛号', unit:'声' },
  { id:'b26', name:'南无药师琉璃光如来', cat:'佛号', unit:'声' },
  { id:'b27', name:'南无弥勒菩萨', cat:'佛号', unit:'声' },
  { id:'b28', name:'南无常住十方佛法僧三宝', cat:'佛号', unit:'声' },

  // ===== 经典（大乘经典） =====
  { id:'b19', name:'金刚经（金刚般若波罗蜜经）', cat:'经典', unit:'遍', hot:true },
  { id:'b20', name:'地藏经（地藏菩萨本愿经）', cat:'经典', unit:'遍', hot:true },
  { id:'b21', name:'药师经（药师琉璃光如来本愿经）', cat:'经典', unit:'遍', hot:true },
  { id:'b14', name:'阿弥陀经（佛说阿弥陀经）', cat:'经典', unit:'遍' },
  { id:'b29', name:'普门品（观世音菩萨普门品）', cat:'经典', unit:'遍', hot:true },
  { id:'b30', name:'华严经·净行品', cat:'经典', unit:'遍' },
  { id:'b31', name:'楞严咒（大佛顶首楞严神咒）', cat:'经典', unit:'遍' },
  { id:'b32', name:'法华经·观世音菩萨普门品', cat:'经典', unit:'遍' },
  { id:'b33', name:'维摩诘经（维摩诘所说经）', cat:'经典', unit:'遍' },
  { id:'b34', name:'无量寿经（佛说无量寿经）', cat:'经典', unit:'遍' },
  { id:'b35', name:'圆觉经（大方广圆觉修多罗了义经）', cat:'经典', unit:'遍' },
  { id:'b36', name:'六祖坛经', cat:'经典', unit:'遍' },
  { id:'b37', name:'金刚般若波罗蜜经', cat:'经典', unit:'遍' },
  { id:'b38', name:'妙法莲华经', cat:'经典', unit:'卷' },

  // ===== 其他咒语 =====
  { id:'b8', name:'六字大明咒（唵嘛呢叭咪吽）', cat:'咒语', unit:'遍' },
  { id:'b39', name:'雨宝陀罗尼', cat:'咒语', unit:'遍' },
  { id:'b40', name:'宝箧印陀罗尼', cat:'咒语', unit:'遍' },
  { id:'b41', name:'尊胜陀罗尼', cat:'咒语', unit:'遍' },
  { id:'b42', name:'大白伞盖咒', cat:'咒语', unit:'遍' },
  { id:'b43', name:'秽迹金刚咒', cat:'咒语', unit:'遍' },
  { id:'b44', name:'普庵咒', cat:'咒语', unit:'遍' },
  { id:'b45', name:'十小咒合集', cat:'咒语', unit:'组' },
  { id:'b46', name:'往生咒', cat:'咒语', unit:'遍' },

  // ===== 礼忏/忏悔 =====
  { id:'b47', name:'八十八佛大忏悔文', cat:'礼忏', unit:'遍', hot:true },
  { id:'b48', name:'三十五佛忏悔文', cat:'礼忏', unit:'遍' },
  { id:'b49', name:'慈悲三昧水忏', cat:'礼忏', unit:'遍' },
  { id:'b50', name:'梁皇宝忏', cat:'礼忏', unit:'卷' },
  { id:'b51', name:'地藏忏', cat:'礼忏', unit:'遍' },
  { id:'b52', name:'观音忏', cat:'礼忏', unit:'遍' },
  { id:'b53', name:'药师忏', cat:'礼忏', unit:'遍' },

  // ===== 礼拜/供养 =====
  { id:'b54', name:'拜佛（一拜）', cat:'礼拜', unit:'拜' },
  { id:'b55', name:'八十八佛礼拜', cat:'礼拜', unit:'次' },
  { id:'b56', name:'三千佛名忏', cat:'礼拜', unit:'拜' },
  { id:'b57', name:'绕佛（一圈）', cat:'礼拜', unit:'圈' },
  { id:'b58', name:'供水（一杯）', cat:'供养', unit:'杯' },
  { id:'b59', name:'供花', cat:'供养', unit:'份' },
  { id:'b60', name:'供灯（酥油灯/蜡烛）', cat:'供养', unit:'盏' },
  { id:'b61', name:'施食（烟供/水供）', cat:'供养', unit:'次' },

  // ===== 禅修/持戒 =====
  { id:'b62', name:'打坐（一座）', cat:'禅修', unit:'座' },
  { id:'b63', name:'念佛（计数）', cat:'修行', unit:'声' },
  { id:'b64', name:'持戒（一日清净）', cat:'修行', unit:'日' },
  { id:'b65', name:'放生', cat:'功德', unit:'物' },
  { id:'b66', name:'布施', cat:'功德', unit:'次' }
];

// ==================== 工具函数 ====================
function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function prevDate(dateStr) {
  const d = new Date(dateStr.replace(/-/g,'/'));
  d.setDate(d.getDate()-1);
  return getDateStr(d);
}

// ==================== 功课管理（CRUD） ====================
function getTasks() {
  const tasks = getStoredTasks().filter(task => !task.archived);
  // 按 sortOrder 排序返回
  return tasks.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}
function getStoredTasks() {
  const tasks = wx.getStorageSync(STORAGE_KEY) || [];
  return tasks.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}
function saveTasks(tasks) {
  wx.setStorageSync(STORAGE_KEY, tasks);
  cloud.setList(cloud.TABLES.TASKS, tasks);
}

function normalizeGroupCount(value) {
  return Math.max(0, parseInt(value) || 0);
}

/** 按组数换算经典组合的四项总目标 */
function getClassicComboTargets(groupCount=1) {
  const groups = normalizeGroupCount(groupCount);
  return CLASSIC_COMBO_ITEMS.map(item => ({
    ...item,
    groups,
    target: item.perGroup * groups,
    text: `${item.name} ${item.perGroup * groups}${item.unit}`
  }));
}

/** 添加功课（内置 or 自定义） */
function addTask(name, unit='遍', dailyTarget=0, totalTarget=0, isCustom=false, builtinId=null) {
  const tasks = getStoredTasks();
  // 每个功课都生成唯一 id，避免同名内置功课 id 冲突
  const uniqueId = (isCustom ? 'c_' : 'b_') + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const task = {
    id: uniqueId,
    builtinId: isCustom ? null : builtinId, // 保留原始 builtinId 用于识别来源
    name,
    unit,
    dailyTarget,
    totalTarget,
    isCustom,
    sortOrder: tasks.length,
    createdAt: Date.now()
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

/** 添加经典组合：创建四个可单独计数的子功课，并用 totalTarget 记录每项目标 */
function addClassicComboTasks(groupTarget=1) {
  const groups = normalizeGroupCount(groupTarget);
  if (groups <= 0) return [];

  const tasks = getStoredTasks();
  const comboId = CLASSIC_COMBO_ID + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const createdAt = Date.now();
  const comboTasks = CLASSIC_COMBO_ITEMS.map((item, index) => ({
    id: 'combo_' + createdAt + '_' + index + '_' + Math.random().toString(36).substr(2, 5),
    builtinId: item.builtinId,
    name: item.name,
    unit: item.unit,
    dailyTarget: 0,
    totalTarget: item.perGroup * groups,
    isCustom: false,
    sortOrder: tasks.length + index,
    createdAt,
    comboId,
    comboName: CLASSIC_COMBO_NAME,
    comboGroupTarget: groups,
    comboDailyGroupTarget: 0,
    comboItemKey: item.key,
    comboPerGroup: item.perGroup
  }));

  saveTasks(tasks.concat(comboTasks));
  return comboTasks;
}

/** 修改经典组合目标组数：同步更新同一组合四个子功课的总目标和每日目标 */
function updateClassicComboGroupTarget(comboId, groupTarget, dailyGroupTarget) {
  const groups = normalizeGroupCount(groupTarget);
  const dailyGroups = normalizeGroupCount(dailyGroupTarget);
  if (!comboId || groups <= 0) return [];

  const itemByKey = {};
  CLASSIC_COMBO_ITEMS.forEach(item => { itemByKey[item.key] = item; });

  const tasks = getStoredTasks();
  const updated = [];
  tasks.forEach(task => {
    const comboItem = task.comboId === comboId ? itemByKey[task.comboItemKey] : null;
    if (!comboItem) return;
    task.comboGroupTarget = groups;
    task.comboDailyGroupTarget = dailyGroups;
    task.comboPerGroup = comboItem.perGroup;
    task.totalTarget = comboItem.perGroup * groups;
    task.dailyTarget = comboItem.perGroup * dailyGroups;
    updated.push(task);
  });

  saveTasks(tasks);
  return updated;
}
function updateTask(id, updates) {
  const tasks = getStoredTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = {...tasks[idx], ...updates};
  saveTasks(tasks);
  return tasks[idx];
}
function deleteTask(id) {
  const allTasks = getStoredTasks();
  const target = allTasks.find(t => t.id === id);
  const removeIds = target && target.comboId
    ? allTasks.filter(t => t.comboId === target.comboId).map(t => t.id)
    : [id];
  let tasks = allTasks.filter(t => !removeIds.includes(t.id));
  saveTasks(tasks);
  const allRecords = wx.getStorageSync(RECORDS_KEY) || {};
  Object.keys(allRecords).forEach(d => {
    removeIds.forEach(taskId => delete allRecords[d][taskId]);
  });
  saveAllRecords(allRecords);
  syncAllRecordsToCloud(allRecords);
  return true;
}
function archiveTask(id) {
  const tasks = getStoredTasks();
  const target = tasks.find(t => t.id === id);
  if (!target) return [];
  const archivedAt = Date.now();
  const archived = [];
  tasks.forEach(task => {
    if (task.id === id || (target.comboId && task.comboId === target.comboId)) {
      task.archived = true;
      task.archivedAt = archivedAt;
      archived.push(task);
    }
  });
  saveTasks(tasks);
  return archived;
}
function restoreTask(id) {
  const tasks = getStoredTasks();
  const target = tasks.find(t => t.id === id);
  if (!target) return [];
  const maxSortOrder = tasks.reduce((max, task) => Math.max(max, task.sortOrder || 0), -1);
  let nextSortOrder = maxSortOrder + 1;
  const restored = [];
  tasks.forEach(task => {
    if (task.id === id || (target.comboId && task.comboId === target.comboId)) {
      task.archived = false;
      delete task.archivedAt;
      task.sortOrder = nextSortOrder++;
      restored.push(task);
    }
  });
  saveTasks(tasks);
  return restored;
}
function reorderTasks(orderedIds) {
  const tasks = getStoredTasks();
  orderedIds.forEach((id, i) => {
    const t = tasks.find(x => x.id === id);
    if (t) t.sortOrder = i;
  });
  saveTasks(tasks);
}

// ==================== 记数（核心） ====================
/** 获取某日的所有记录 { taskId: count } */
function getDayRecord(dateStr) {
  return getAllRecords()[dateStr] || {};
}

/** 获取已存档的经典组合，供重新启用 */
function getArchivedClassicCombos() {
  const grouped = {};
  getStoredTasks()
    .filter(task => task.archived && task.comboId && task.comboName === CLASSIC_COMBO_NAME)
    .forEach(task => {
      if (!grouped[task.comboId]) grouped[task.comboId] = [];
      grouped[task.comboId].push(task);
    });

  return Object.keys(grouped).map(comboId => {
    const comboTasks = grouped[comboId];
    const first = comboTasks[0] || {};
    const groupTarget = normalizeGroupCount(first.comboGroupTarget);
    const dailyGroupTarget = normalizeGroupCount(first.comboDailyGroupTarget);
    const total = comboTasks.reduce((sum, task) => sum + getTaskTotal(task.id), 0);
    return {
      comboId,
      taskId: first.id,
      name: first.comboName || CLASSIC_COMBO_NAME,
      groupTarget,
      dailyGroupTarget,
      itemCount: comboTasks.length,
      total,
      archivedAt: first.archivedAt || 0
    };
  }).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
}
/** 获取所有日期记录 */
function getAllRecords() {
  const records = wx.getStorageSync(RECORDS_KEY);
  if (records && Object.keys(records).length > 0) return records;

  const backup = wx.getStorageSync(RECORDS_BACKUP_KEY);
  if (backup && backup.records) return backup.records;
  return {};
}

function saveAllRecords(records) {
  wx.setStorageSync(RECORDS_KEY, records);
  wx.setStorageSync(RECORDS_BACKUP_KEY, {
    updatedAt: Date.now(),
    records
  });
}

function syncAllRecordsToCloud(records) {
  Object.keys(records || {}).forEach(dateStr => {
    cloud.set(cloud.TABLES.RECORDS, dateStr, records[dateStr] || {});
  });
}

/** +1 计数 */
function increment(taskId, dateStr, amount=1) {
  const records = getAllRecords();
  if (!records[dateStr]) records[dateStr] = {};
  records[dateStr][taskId] = (records[dateStr][taskId] || 0) + amount;
  saveAllRecords(records);
  cloud.set(cloud.TABLES.RECORDS, dateStr, records[dateStr]);
  return records[dateStr][taskId];
}

/** 设置计数值（手动输入/批量） */
function setCount(taskId, dateStr, count) {
  const records = getAllRecords();
  if (!records[dateStr]) records[dateStr] = {};
  records[dateStr][taskId] = Math.max(0, count | 0);
  saveAllRecords(records);
  cloud.set(cloud.TABLES.RECORDS, dateStr, records[dateStr]);
  return records[dateStr][taskId];
}

/** 清零某日某功课 */
function clearCount(taskId, dateStr) {
  const records = getAllRecords();
  if (records[dateStr]) {
    delete records[dateStr][taskId];
    saveAllRecords(records);
    cloud.set(cloud.TABLES.RECORDS, dateStr, records[dateStr] || {});
  }
}

// ==================== 每日详情（发愿/回向/备注） ====================
function getDailyDetail(dateStr, taskId) {
  const all = wx.getStorageSync(DAILY_KEY) || {};
  const dayData = all[dateStr] || null;
  if (!dayData || !taskId) return dayData;
  // 返回该 taskId 对应的详情（兼容旧数据：无 _byTask 字段时返回全局数据）
  if (dayData._byTask && dayData._byTask[taskId]) {
    return dayData._byTask[taskId];
  }
  // 兼容旧数据：如果只有一个任务，返回全局数据
  return { wish: dayData.wish, note: dayData.note };
}
function saveDailyDetail(dateStr, detail, taskId) {
  const all = wx.getStorageSync(DAILY_KEY) || {};
  if (taskId) {
    // 按 taskId 隔离存储
    if (!all[dateStr]) all[dateStr] = { updatedAt: Date.now() };
    if (!all[dateStr]._byTask) all[dateStr]._byTask = {};
    all[dateStr]._byTask[taskId] = { ...detail, updatedAt: Date.now() };
    all[dateStr].updatedAt = Date.now();
  } else {
    all[dateStr] = { ...detail, updatedAt: Date.now() };
  }
  wx.setStorageSync(DAILY_KEY, all);
  cloud.set(cloud.TABLES.DAILY_DETAIL, dateStr, all[dateStr]);
}

// ==================== 统计 ====================
function getTaskTotal(taskId) {
  const records = getAllRecords();
  let total = 0;
  Object.values(records).forEach(day => { total += (day[taskId] || 0); });
  return total;
}

function buildClassicComboProgress(comboTasks) {
  if (!comboTasks || comboTasks.length === 0) return null;
  const first = comboTasks[0];
  const groupTarget = normalizeGroupCount(first.comboGroupTarget);
  const taskByKey = {};
  comboTasks.forEach(task => { taskByKey[task.comboItemKey] = task; });
  const itemProgress = CLASSIC_COMBO_ITEMS.map(item => {
    const task = taskByKey[item.key];
    const perGroup = item.perGroup;
    const total = task ? getTaskTotal(task.id) : 0;
    return {
      taskId: task ? task.id : '',
      name: item.name,
      unit: item.unit,
      perGroup,
      total,
      target: perGroup * groupTarget,
      completedGroups: perGroup > 0 ? Math.floor(total / perGroup) : 0
    };
  });
  const completedGroups = itemProgress.length
    ? Math.min(...itemProgress.map(item => item.completedGroups))
    : 0;
  return {
    comboId: first.comboId,
    comboName: first.comboName || CLASSIC_COMBO_NAME,
    groupTarget,
    completedGroups,
    itemProgress
  };
}

/** 获取某个经典组合的组数进度；不传 comboId 时返回全部组合 */
function getClassicComboProgress(comboId) {
  const comboTasks = getTasks().filter(task => task.comboId && task.comboName === CLASSIC_COMBO_NAME);
  const grouped = {};
  comboTasks.forEach(task => {
    if (!grouped[task.comboId]) grouped[task.comboId] = [];
    grouped[task.comboId].push(task);
  });

  if (comboId) return buildClassicComboProgress(grouped[comboId] || []);

  return Object.keys(grouped)
    .map(id => buildClassicComboProgress(grouped[id]))
    .filter(Boolean);
}

/** 获取连续天数（从今天往前算有记录的天数） */
function getStreakDays(taskId) {
  const records = getAllRecords();
  let check = getToday();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const dayRec = records[check];
    if (dayRec && dayRec[taskId] > 0) {
      streak++;
      check = prevDate(check);
    } else {
      break;
    }
  }
  return streak;
}

/** 获取今日完成情况 */
function getTodaySummary() {
  try {
    const today = getToday();
    const tasks = getTasks();
    const dayRec = getDayRecord(today);
    let completed = 0, total = 0;
    (tasks || []).forEach(t => {
      // 有每日目标或总目标的功课都参与达标统计
      if (t.dailyTarget > 0 || t.totalTarget > 0) {
        total++;
        // 每日目标：今天计数 >= 每日目标 即为达标
        const dailyDone = t.dailyTarget > 0 && (dayRec[t.id] || 0) >= t.dailyTarget;
        // 总目标：累计总数 >= 总目标 也算达标（无每日目标时用总目标判断）
        let taskTotal = 0;
        try { taskTotal = getTaskTotal(t.id); } catch(e) {}
        const totalDone = t.totalTarget > 0 && taskTotal >= t.totalTarget;
        if (dailyDone || (t.dailyTarget === 0 && totalDone)) completed++;
      }
    });
    return { completed, total, tasks: (tasks || []).length };
  } catch(e) {
    return { completed: 0, total: 0, tasks: 0 };
  }
}

/** 获取某功课最近N天的记录（用于图表） */
function getTaskRecent(taskId, days=30) {
  const records = getAllRecords();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = getDateStr(d);
    result.push({
      date: ds,
      count: (records[ds] && records[ds][taskId]) || 0
    });
  }
  return result;
}

/** 检查昨天是否有未完成的功课 */
function getYesterdayIncomplete() {
  const yesterday = prevDate(getToday());
  const tasks = getTasks().filter(t => t.dailyTarget > 0);
  const rec = getDayRecord(yesterday);
  return tasks.filter(t => (rec[t.id] || 0) < t.dailyTarget && (rec[t.id] || 0) > 0);
}

/** 搜索内置功课 */
function searchBuiltin(keyword) {
  if (!keyword) return BUILTIN.filter(b => b.hot);
  const kw = keyword.toLowerCase();
  return BUILTIN.filter(b =>
    b.name.toLowerCase().includes(kw) || b.cat.includes(kw)
  );
}

// ==================== 每日金句（修行励志） ====================
const DAILY_QUOTES = [
  { text: '念念不忘，必有回响。', source: '《弘一法师语录》' },
  { text: '一日不修，三日不安；日日精进，方得始终。', source: '修行格言' },
  { text: '发心容易，恒心难持。今日之功，即是明日之果。', source: '修行格言' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', source: '《荀子·劝学》' },
  { text: '心若菩提，步步生莲。', source: '佛教偈语' },
  { text: '修行不在形式，而在当下的一念清净。', source: '修行格言' },
  { text: '每日一课，功不唐捐。', source: '修行格言' },
  { text: '千里之行，始于足下。今天的每一遍计数，都是通往彼岸的阶梯。', source: '《道德经》' },
  { text: '愿以此功德，庄严佛净土。', source: '回向偈' },
  { text: '所有伟大的成就，都源于每天微小的坚持。', source: '修行格言' },
  { text: '莫以善小而不为，莫以恶小而为之。', source: '《三国志》' },
  { text: '种瓜得瓜，种豆得豆。今日所修，他日必获。', source: '因果偈语' },
  { text: '心安即归处，日修即道场。', source: '修行格言' },
  { text: '水滴石穿，不是力量大，而是功夫深。', source: '修行格言' },
  { text: '愿生西方净土中，九品莲花为父母。', source: '《往生咒》' },
  { text: '烦恼即菩提，生死即涅槃。', source: '佛教偈语' },
  { text: '知足常乐，随缘自在。修行从感恩开始。', source: '修行格言' },
  { text: '一念嗔心起，百万障门开。常存善念，自有福报。', source: '《六祖坛经》' },
  { text: '行善积德，福虽未至，祸已远离。', source: '了凡四训' },
  { text: '每一个当下都是新的开始，每一次计数都是新的积累。', source: '修行格言' }
];

const PAGE_MOTTOS = [
  '愿以一念之善，记录每日所行。',
  '日有所修，心有所安。',
  '一念清净，一步光明。',
  '日日精进，功不唐捐。',
  '把每一次计数，安放在当下。',
  '愿今日所行，皆向善处。',
  '心念不散，善行不息。',
  '每一遍，都是一次归心。',
  '以愿为灯，以行为路。',
  '不求一日圆满，但求日日不断。',
  '清净一念，胜过纷扰千言。',
  '善念常在，福慧渐生。',
  '今日修一分，心中明一分。',
  '把小小坚持，记成长久愿力。',
  '一声一念，皆是归途。',
  '心若安住，处处道场。',
  '愿每一次开始，都不负本心。',
  '不急不缓，念念相续。',
  '静中有光，行中有愿。',
  '今日一遍，胜过空想千回。',
  '把散乱收回，把善念种下。',
  '持之以恒，自有清凉。',
  '少一点分别，多一分慈悲。',
  '每一次坚持，都是在照见自己。',
  '愿心不退，愿行不止。',
  '从一念开始，向清净处去。',
  '心有所向，步步皆修。',
  '以平常心，做长久功。',
  '愿今日所念，化作明日之光。',
  '不争一时，但守一念。',
  '念起即觉，觉之即安。',
  '把今天过稳，把心安住。',
  '一日一修，久久为功。',
  '今日一念，亦是修行。',
  '把心安放在每一个当下。',
  '一日一修，心自渐明。',
  '功课虽小，贵在长久。',
  '今日所修，皆为来日之光。',
  '不急不躁，功课自稳。',
  '净念相续，都摄六根。',
  '功课不断，内心自定。',
  '在重复中，慢慢看见自己。',
  '今日不缺席，明日更从容。',
  '安住当下，完成这一份功课。',
  '功课如水，润物无声。',
  '每一次完成，都是一次靠近。',
  '日日一点，胜过偶尔万分。',
  '不为完成，只为安住。',
  '功课之外，是生活；功课之中，是自己。',
  '一念一修，皆在路上。',
  '今日所做，皆为积累。',
  '不怕慢，只怕停。',
  '把功课做轻，把坚持做长。',
  '在安静里，完成今天。',
  '不求多，只求真。',
  '每一次开始，都是新的修行。',
  '把今天做好，就是最大的精进。',
  '一日一课，日久见心。',
  '不必比较，只需坚持。',
  '让功课，成为一种习惯。',
  '做功课就是在还债、在修心。',
  '功课不是形式，是在改变自己的命运。',
  '每天的功课，就是在为自己积累福报。',
  '功课做得好，人生会慢慢走顺。',
  '功课最重要的是天天做。',
  '一天不做功课，容易退转。',
  '功课不能三天打鱼两天晒网。',
  '宁可少一点，也要坚持不断。',
  '坚持功课，就是在打基础。',
  '做功课要用心，不是完成任务。',
  '功课质量比数量更重要。',
  '一边做功课一边乱想，效果会打折。',
  '做功课时要专心、安静。',
  '心诚，功课才有力量。',
  '坚持做功课，气场会越来越好。',
  '功课能消业障、增福报。',
  '功课稳定，心就稳定。',
  '做好功课，很多事情自然会顺。',
  '功课是最稳的改变命运的方法。',
  '再忙也要抽时间做功课。',
  '功课是每天最重要的事情之一。',
  '做功课不是负担，是保护自己。',
  '把功课当成生活的一部分。',
  '有功课的人，人生更有方向。',
  '今日功课完成了吗？',
  '别忘了，功课是给自己的。',
  '今天再忙，也别忘了做功课。',
  '每一次功课，都是在积福。',
  '坚持功课，就是在改变人生。',
  '功课不断，福报不断。',
  '安静下来，完成今天的功课。'

];

/** 获取随机金句 */
function getRandomQuote() {
  const idx = Math.floor(Math.random() * DAILY_QUOTES.length);
  return DAILY_QUOTES[idx];
}

/** 获取计数器页顶部短句 */
function getRandomMotto() {
  const idx = Math.floor(Math.random() * PAGE_MOTTOS.length);
  return PAGE_MOTTOS[idx];
}

/** 获取全局连续修行天数（任意功课有记录即算） */
function getGlobalStreakDays() {
  try {
    const records = getAllRecords();
    const tasks = getTasks();
    if (!tasks || tasks.length === 0) return 0;
    let check = getToday();
    let streak = 0;
    for (let i = 0; i < 365 * 5; i++) {
      const dayRec = records[check];
      if (dayRec) {
        // 当天有任意功课记录
        const hasAny = tasks.some(t => dayRec[t.id] && dayRec[t.id] > 0);
        if (hasAny) {
          streak++;
          check = prevDate(check);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return streak;
  } catch(e) {
    return 0;
  }
}

/** 获取今日总计数（所有功课合计） */
function getTodayTotal() {
  const today = getToday();
  const dayRec = getDayRecord(today);
  const tasks = getTasks();
  let total = 0;
  tasks.forEach(t => { total += (dayRec[t.id] || 0); });
  return total;
}

module.exports = {
  BUILTIN, CLASSIC_COMBO_ID, CLASSIC_COMBO_NAME, CLASSIC_COMBO_ITEMS,
  getToday, getDateStr, prevDate,
  getTasks, addTask, addClassicComboTasks, updateClassicComboGroupTarget, updateTask, deleteTask, removeTask: deleteTask, archiveTask, restoreTask, getArchivedClassicCombos, reorderTasks,
  getDayRecord, getAllRecords, increment, setCount, clearCount,
  getDailyDetail, saveDailyDetail,
  getTaskTotal, getClassicComboTargets, getClassicComboProgress,
  getStreakDays, getTodaySummary, getTaskRecent, getYesterdayIncomplete,
  searchBuiltin,
  getRandomQuote, getRandomMotto, getGlobalStreakDays, getTodayTotal
};
