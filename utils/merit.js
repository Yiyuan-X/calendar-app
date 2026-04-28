/**
 * 功德记录模块 — 基于《了凡四训》功过格
 *
 * 核心理念：
 * - 善行积累功德，恶行折损功德
 * - 每日反省，积微成著
 * - 功过相抵，净功德为真
 */

// ==================== 功德分类体系 ====================

/**
 * 善行分类（了凡四训：立命之学、改过之法、积善之方、谦德之效）
 */
const GOOD_CATEGORIES = [
  {
    id: 'benevolence',
    name: '慈悲利他',
    icon: 'benevolence',
    color: '#E91E63',
    desc: '救人之急，济人之困',
    items: [
      { id: 'g1', text: '帮助他人解决困难', merit: 10 },
      { id: 'g2', text: '布施财物（随力随分）', merit: 10 },
      { id: 'g3', text: '安慰失意或悲伤的人', merit: 5 },
      { id: 'g4', text: '为他人提供便利', merit: 3 },
      { id: 'g5', text: '保护弱小/动物', merit: 5 },
      { id: 'g6', text: '参与公益/志愿服务', merit: 15 },
      { id: 'g7', text: '献血/器官捐献登记', merit: 30 },
      { id: 'g8', text: '拾金不昧', merit: 10 }
    ]
  },
  {
    id: 'filial',
    name: '孝亲敬长',
    icon: 'filial',
    color: '#FF9800',
    desc: '孝养父母，尊敬师长',
    items: [
      { id: 'g9', text: '陪伴父母/长辈聊天', merit: 5 },
      { id: 'g10', text: '为父母做一顿饭', merit: 5 },
      { id: 'g11', text: '关心父母身体健康', merit: 5 },
      { id: 'g12', text: '恭敬师长/前辈', merit: 3 },
      { id: 'g13', text: '铭记父母教诲并践行', merit: 8 },
      { id: 'g14', text: '主动承担家务', merit: 3 }
    ]
  },
  {
    id: 'integrity',
    name: '诚实守信',
    icon: 'integrity',
    color: '#2196F3',
    desc: '言而有信，行而不欺',
    items: [
      { id: 'g15', text: '信守承诺，说到做到', merit: 8 },
      { id: 'g16', text: '承认错误不推诿', merit: 5 },
      { id: 'g17', text: '拾到物品归还失主', merit: 10 },
      { id: 'g18', text: '工作中尽职尽责', merit: 5 },
      { id: 'g19', text: '不占小便宜', merit: 3 },
      { id: 'g20', text: '传播真实信息', merit: 3 }
    ]
  },
  {
    id: 'cultivation',
    name: '修身养性',
    icon: 'cultivation',
    color: '#9C27B0',
    desc: '反省自省，克己复礼',
    items: [
      { id: 'g21', text: '读诵经典（佛经/善书）', merit: 10 },
      { id: 'g22', text: '早晚课诵/念佛/持咒', merit: 10 },
      { id: 'g23', text: '静坐（15分钟+）', merit: 5 },
      { id: 'g24', text: '深刻反省今日过失', merit: 8 },
      { id: 'g25', text: '控制脾气不发火', merit: 5 },
      { id: 'g26', text: '戒除一项不良习惯', merit: 10 },
      { id: 'g27', text: '早睡早起（23点前睡）', merit: 3 },
      { id: 'g28', text: '素食一餐', merit: 3 },
      { id: 'g29', text: '放生（如法放生）', merit: 15 },
      { id: 'g30', text: '礼佛/拜忏', merit: 10 }
    ]
  },
  {
    id: 'kindness_speech',
    name: '善语爱语',
    icon: 'speech',
    color: '#4CAF50',
    desc: '言语温和，不伤人心',
    items: [
      { id: 'g31', text: '真诚赞美他人', merit: 3 },
      { id: 'g32', text: '耐心倾听他人倾诉', merit: 3 },
      { id: 'g33', text: '化解他人的矛盾', merit: 8 },
      { id: 'g34', text: '说鼓励的话给人力量', merit: 5 },
      { id: 'g35', text: '不说是非不传谣', merit: 5 },
      { id: 'g36', text: '道歉并求得原谅', merit: 5 }
    ]
  }
];

/**
 * 恶行分类（需警惕和改正）
 */
const BAD_CATEGORIES = [
  {
    id: 'anger',
    name: '嗔恚暴躁',
    icon: 'anger',
    desc: '发怒伤人，火烧功德林',
    items: [
      { id: 'b1', text: '对家人/亲近的人发脾气', demerit: 10 },
      { id: 'b2', text: '对陌生人发怒/路怒', demerit: 8 },
      { id: 'b3', text: '心怀怨恨不放下', demerit: 10 },
      { id: 'b4', text: '说伤人的话', demerit: 5 },
      { id: 'b5', text: '摔东西/暴力行为', demerit: 20 }
    ]
  },
  {
    id: 'greed',
    name: '贪欲执着',
    icon: 'greed',
    desc: '贪得无厌，患得患失',
    items: [
      { id: 'b6', text: '过度消费/浪费', demerit: 5 },
      { id: 'b7', text: '嫉妒他人的成就', demerit: 8 },
      { id: 'b8', text: '占别人便宜', demerit: 10 },
      { id: 'b9', text: '沉迷娱乐/游戏荒废正事', demerit: 5 },
      { id: 'b10', text: '攀比虚荣心作祟', demerit: 5 }
    ]
  },
  {
    id: 'dishonesty',
    name: '欺妄不实',
    icon: 'dishonesty',
    desc: '欺骗妄语，失信于人',
    items: [
      { id: 'b11', text: '说谎/隐瞒事实', demerit: 10 },
      { id: 'b12', text: '违背承诺', demerit: 8 },
      { id: 'b13', text: '背后说人坏话', demerit: 8 },
      { id: 'b14', text: '传播未经证实的信息', demerit: 5 },
      { id: 'b15', text: '抄袭/作弊', demerit: 15 }
    ]
  },
  {
    id: 'laziness',
    name: '懈怠懒惰',
    icon: 'laziness',
    desc: '因循苟且，虚度光阴',
    items: [
      { id: 'b16', text: '熬夜超过零点', demerit: 5 },
      { id: 'b17', text: '拖延重要的事', demerit: 5 },
      { id: 'b18', text: '沉迷手机浪费时间', demerit: 5 },
      { id: 'b19', text: '不完成当日计划', demerit: 3 },
      { id: 'b20', text: '暴饮暴食/饮食无度', demerit: 5 }
    ]
  },
  {
    id: 'cruelty',
    name: '残忍伤害',
    icon: 'harm',
    desc: '伤害生命，造下恶业',
    items: [
      { id: 'b21', text: '故意伤害动物', demerit: 20 },
      { id: 'b22', text: '杀生', demerit: 15 },
      { id: 'b23', text: '浪费食物', demerit: 5 },
      { id: 'b24', text: '破坏环境/公物', demerit: 8 },
      { id: 'b25', text: '幸灾乐祸', demerit: 10 }
    ]
  }
];

// ==================== 了凡四训引文 ====================

const LIAOFAN_QUOTES = [
  { text: '命由我作，福自己求。', source: '第一篇·立命之学' },
  { text: '一切福田，不离方寸；从心而觅，感无不通。', source: '第一篇·立命之学' },
  { text: '从前种种，譬如昨日死；从后种种，譬如今日生。', source: '第二篇·改过之法' },
  { text: '要发耻心、畏心、勇心，方能改过。', source: '第二篇·改过之法' },
  { text: '改过者，当从心而改，不在外表。', source: '第二篇·改过之法' },
  { text: '善有真假，有端曲，有阴阳，有是非，有偏正，有半满，有大小，有难易。', source: '第三篇·积善之方' },
  { text: '与人方便，自己方便。', source: '第三篇·积善之方' },
  { text: '随缘济众，其类至繁。约言其纲，大约有十：与人为善、爱敬存心、成人之美、劝人为善、救人危急、兴建大利、舍财作福、护持正法、敬重尊长、爱惜物命。', source: '第三篇·积善之方' },
  { text: '满招损，谦受益。', source: '第四篇·谦德之效' },
  { text: '惟谦受福，天道亏盈而益谦。', source: '第四篇·谦德之效' },
  { text: '每日不知非，即一日安于自是；一日无过可改，即一日无步可进。', source: '第二篇·改过之法' },
  { text: '须先振刷精神，勿自暴自弃。', source: '第二篇·改过之法' }
];

// ==================== 工具方法 ====================

/**
 * 获取随机一条了凡四训引文
 */
function getRandomQuote() {
  const idx = Math.floor(Math.random() * LIAOFAN_QUOTES.length);
  return LIAOFAN_QUOTES[idx];
}

/**
 * 获取指定日期的引文（基于日期种子，同一天固定）
 */
function getDailyQuote() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const idx = seed % LIAOFAN_QUOTES.length;
  return LIAOFAN_QUOTES[idx];
}

/**
 * 计算某条记录的净功德值
 * @param {object} record - 单日功德记录
 * @returns {number} 净功德值
 */
function calculateNetMerit(record) {
  if (!record || !record.items) return 0;

  let total = 0;
  record.items.forEach(item => {
    const cnt = item.count || 1;  // 支持累计次数
    if (item.type === 'good') {
      total += (item.merit || 0) * cnt;
    } else if (item.type === 'bad') {
      total -= (item.demerit || 0) * cnt;
    }
  });
  return total;
}

/**
 * 统计一段时间内的功德数据
 * @param {Array} records - 功德记录数组
 * @returns {object} 统计结果
 */
function getMeritStats(records) {
  let totalGood = 0;
  let totalBad = 0;
  let totalNet = 0;
  let dayCount = 0;
  let goodDays = 0;   // 净功德 > 0 的天数
  let badDays = 0;    // 净功德 < 0 的天数
  let neutralDays = 0; // 净功德 == 0 的天数

  // 分类统计
  const categoryGood = {};
  const categoryBad = {};

  records.forEach(record => {
    dayCount++;
    let dayTotal = 0;

    if (record.items && record.items.length > 0) {
      record.items.forEach(item => {
        const cnt = item.count || 1;  // 支持累计次数
        if (item.type === 'good') {
          const itemMerit = (item.merit || 0) * cnt;
          totalGood += itemMerit;
          dayTotal += itemMerit;
          const cat = item.categoryId || 'other';
          categoryGood[cat] = (categoryGood[cat] || 0) + itemMerit;
        } else if (item.type === 'bad') {
          const itemDemerit = (item.demerit || 0) * cnt;
          totalBad += itemDemerit;
          dayTotal -= itemDemerit;
          const cat = item.categoryId || 'other';
          categoryBad[cat] = (categoryBad[cat] || 0) + itemDemerit;
        }
      });
    }

    totalNet += dayTotal;
    if (dayTotal > 0) goodDays++;
    else if (dayTotal < 0) badDays++;
    else neutralDays++;
  });

  return {
    totalGood,
    totalBad,
    totalNet,
    dayCount,
    goodDays,
    badDays,
    neutralDays,
    avgPerDay: dayCount > 0 ? Math.round(totalNet / dayCount * 10) / 10 : 0,
    categoryGood,
    categoryBad
  };
}

/**
 * 获取连续记录天数
 * @param {Array} records - 按日期排序的记录
 * @param {string} todayStr - 今天日期字符串
 * @returns {number} 连续天数
 */
function getStreakDays(records, todayStr) {
  if (!records || records.length === 0) return 0;

  const sortedDates = Object.keys(records).sort().reverse();
  if (sortedDates.length === 0) return 0;

  // 检查今天是否有记录
  let checkDate = todayStr;
  let streak = 0;
  const recordSet = new Set(sortedDates);

  for (let i = 0; i < 365; i++) {
    if (recordSet.has(checkDate)) {
      const rec = records[checkDate];
      if (rec && rec.items && rec.items.length > 0) {
        streak++;
      }
      // 前移一天
      const d = new Date(checkDate.replace(/-/g, '/'));
      d.setDate(d.getDate() - 1);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      checkDate = `${d.getFullYear()}-${m}-${day}`;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 获取功德等级描述
 * @param {number} netMerit - 净功德值
 * @returns {object} 等级信息
 */
function getMeritLevel(netMerit) {
  if (netMerit >= 1000) return { level: 9, title: '圣人境界', desc: '德被万物，光耀千秋', color: '#FFD700' };
  if (netMerit >= 500) return { level: 8, title: '贤达君子', desc: '厚德载物，福泽绵长', color: '#9C27B0' };
  if (netMerit >= 200) return { level: 7, title: '有德之士', desc: '积善之家，必有余庆', color: '#2196F3' };
  if (netMerit >= 100) return { level: 6, title: '向善之人', desc: '诸恶莫作，众善奉行', color: '#009688' };
  if (netMerit >= 50) return { level: 5, title: '修德初成', desc: '日行一善，功不唐捐', color: '#4CAF50' };
  if (netMerit >= 20) return { level: 4, title: '发心向善', desc: '千里之行，始于足下', color: '#8BC34A' };
  if (netMerit >= 0) return { level: 3, title: '初心未泯', desc: '但行好事，莫问前程', color: '#CDDC39' };
  if (netMerit >= -20) return { level: 2, title: '迷途知返', desc: '知过能改，善莫大焉', color: '#FF9800' };
  return { level: 1, title: '当头棒喝', desc: '苦海无边，回头是岸', color: '#F44336' };
}

module.exports = {
  // 分类数据
  GOOD_CATEGORIES,
  BAD_CATEGORIES,

  // 引文
  LIAOFAN_QUOTES,
  getRandomQuote,
  getDailyQuote,

  // 计算
  calculateNetMerit,
  getMeritStats,
  getStreakDays,
  getMeritLevel
};
