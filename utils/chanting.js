/**
 * 功课计数器 — 数据模型与存储
 */
const STORAGE_KEY = 'chanting_tasks';       // 用户功课列表
const RECORDS_KEY = 'chanting_records';     // 每日记录 { '2026-04-23': { taskId: count, ... } }
const DAILY_KEY = 'chanting_daily';         // 每日详情 { dateStr: { taskId:{ count,wish,note,dedicate } } }

// ==================== 内置热门功课 ====================
const BUILTIN = [
  // ===== 常用基础咒语（默认置顶） =====
  { id:'b67', name:'净口业真言', cat:'咒语', unit:'遍' },
  { id:'b2', name:'大悲咒（千手千眼无碍大悲心陀罗尼）', cat:'咒语', unit:'遍', hot:true },
  { id:'b3', name:'心经（般若波罗蜜多心经）', cat:'经典', unit:'遍', hot:true },
  { id:'b15', name:'礼佛大忏悔文', cat:'礼忏', unit:'遍', hot:true },
  { id:'b5', name:'解结咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b4', name:'往生净土神咒（拔一切业障根本得生净土陀罗尼）', cat:'咒语', unit:'遍', hot:true },
  { id:'b7', name:'消灾吉祥神咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b6', name:'准提神咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b9', name:'大吉祥天女咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b10', name:'七佛灭罪真言', cat:'咒语', unit:'遍', hot:true },
  { id:'b12', name:'圣无量寿决定光明王陀罗尼', cat:'咒语', unit:'遍', hot:true },
  { id:'b13', name:'如意宝轮王陀罗尼', cat:'咒语', unit:'遍', hot:true },
  { id:'b16', name:'功德宝山神咒', cat:'咒语', unit:'遍', hot:true },
  { id:'b17', name:'观音灵感真言', cat:'咒语', unit:'遍', hot:true },
  { id:'b11', name:'药师灌顶真言', cat:'咒语', unit:'遍', hot:true },
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
  return wx.getStorageSync(STORAGE_KEY) || [];
}
function saveTasks(tasks) {
  wx.setStorageSync(STORAGE_KEY, tasks);
}

/** 添加功课（内置 or 自定义） */
function addTask(name, unit='遍', dailyTarget=0, totalTarget=0, isCustom=false, builtinId=null) {
  const tasks = getTasks();
  // 检查重名（仅警告，不阻止）
  const exist = tasks.find(t => t.name === name);
  if (exist) return null; // 已存在同名则不重复添加
  const task = {
    id: isCustom ? 'c_'+Date.now() : builtinId,
    name,
    unit,
    dailyTarget,       // 每日目标，0=不限
    totalTarget,       // 总目标，0=不限
    isCustom,
    sortOrder: tasks.length,
    createdAt: Date.now()
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}
function updateTask(id, updates) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = {...tasks[idx], ...updates};
  saveTasks(tasks);
  return tasks[idx];
}
function deleteTask(id) {
  let tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  // 同时清理相关记录
  const allRecords = wx.getStorageSync(RECORDS_KEY) || {};
  Object.keys(allRecords).forEach(d => delete allRecords[d][id]);
  wx.setStorageSync(RECORDS_KEY, allRecords);
  return true;
}
function reorderTasks(orderedIds) {
  const tasks = getTasks();
  orderedIds.forEach((id, i) => {
    const t = tasks.find(x => x.id === id);
    if (t) t.sortOrder = i;
  });
  saveTasks(tasks);
}

// ==================== 记数（核心） ====================
/** 获取某日的所有记录 { taskId: count } */
function getDayRecord(dateStr) {
  return (wx.getStorageSync(RECORDS_KEY) || {})[dateStr] || {};
}
/** 获取所有日期记录 */
function getAllRecords() {
  return wx.getStorageSync(RECORDS_KEY) || {};
}

/** +1 计数 */
function increment(taskId, dateStr, amount=1) {
  const records = getAllRecords();
  if (!records[dateStr]) records[dateStr] = {};
  records[dateStr][taskId] = (records[dateStr][taskId] || 0) + amount;
  wx.setStorageSync(RECORDS_KEY, records);
  return records[dateStr][taskId];
}

/** 设置计数值（手动输入/批量） */
function setCount(taskId, dateStr, count) {
  const records = getAllRecords();
  if (!records[dateStr]) records[dateStr] = {};
  records[dateStr][taskId] = Math.max(0, count | 0);
  wx.setStorageSync(RECORDS_KEY, records);
  return records[dateStr][taskId];
}

/** 清零某日某功课 */
function clearCount(taskId, dateStr) {
  const records = getAllRecords();
  if (records[dateStr]) {
    delete records[dateStr][taskId];
    wx.setStorageSync(RECORDS_KEY, records);
  }
}

// ==================== 每日详情（发愿/回向/备注） ====================
function getDailyDetail(dateStr) {
  return (wx.getStorageSync(DAILY_KEY) || {})[dateStr] || null;
}
function saveDailyDetail(dateStr, detail) {
  const all = wx.getStorageSync(DAILY_KEY) || {};
  all[dateStr] = { ...detail, updatedAt: Date.now() };
  wx.setStorageSync(DAILY_KEY, all);
}

// ==================== 统计 ====================
function getTaskTotal(taskId) {
  const records = getAllRecords();
  let total = 0;
  Object.values(records).forEach(day => { total += (day[taskId] || 0); });
  return total;
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

/** 获取随机金句 */
function getRandomQuote() {
  const idx = Math.floor(Math.random() * DAILY_QUOTES.length);
  return DAILY_QUOTES[idx];
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
  BUILTIN,
  getToday, getDateStr, prevDate,
  getTasks, addTask, updateTask, deleteTask, removeTask: deleteTask, reorderTasks,
  getDayRecord, getAllRecords, increment, setCount, clearCount,
  getDailyDetail, saveDailyDetail,
  getTaskTotal, getStreakDays, getTodaySummary, getTaskRecent, getYesterdayIncomplete,
  searchBuiltin,
  getRandomQuote, getGlobalStreakDays, getTodayTotal
};
