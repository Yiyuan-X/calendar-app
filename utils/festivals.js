/**
 * 节日数据管理
 * 包含：法定节日、传统节日、纪念日、佛教纪念日
 */

const { solarToLunar } = require('./lunar');

// ===== 固定日期节日 =====
const fixedFestivals = {
  // 法定节日 - 红色高亮
  '1-1': { name: '元旦', type: 'legal', color: 'red', category: 'holiday' },
  '2-14': { name: '情人节', type: 'common', color: 'pink', category: 'commemorate' },
  '3-8': { name: '妇女节', type: 'legal', color: 'red', category: 'holiday' },
  '3-12': { name: '植树节', type: 'legal', color: 'green', category: 'holiday' },
  '4-1': { name: '愚人节', type: 'common', color: 'gray', category: 'other' },
  '5-1': { name: '劳动节', type: 'legal', color: 'red', category: 'holiday' },
  '5-4': { name: '青年节', type: 'legal', color: 'blue', category: 'holiday' },
  '6-1': { name: '儿童节', type: 'legal', color: 'red', category: 'holiday' },
  '7-1': { name: '建党节', type: 'legal', color: 'red', category: 'holiday' },
  '8-1': { name: '建军节', type: 'legal', color: 'red', category: 'holiday' },
  '9-10': { name: '教师节', type: 'common', color: 'orange', category: 'commemorate' },
  '10-1': { name: '国庆节', type: 'legal', color: 'red', category: 'holiday' },
  '12-24': { name: '平安夜', type: 'common', color: 'pink', category: 'commemorate' },
  '12-25': { name: '圣诞节', type: 'common', color: 'pink', category: 'commemorate' }
};

// ===== 农历节日（需要转换） =====
const lunarFestivals = {
  // 传统节日
  '1-1': { name: '春节', type: 'legal', color: 'red', category: 'holiday', weight: 5 },
  '1-15': { name: '元宵节', type: 'traditional', color: 'red', category: 'holiday', weight: 3 },
  '2-2': { name: '龙抬头', type: 'traditional', color: 'gold', category: 'traditional', weight: 2 },
  '5-5': { name: '端午节', type: 'legal', color: 'red', category: 'holiday', weight: 4 },
  '7-7': { name: '七夕', type: 'traditional', color: 'pink', category: 'commemorate', weight: 3 },
  '7-15': { name: '中元节', type: 'traditional', color: 'gold', category: 'traditional', weight: 2 },
  '8-15': { name: '中秋节', type: 'legal', color: 'red', category: 'holiday', weight: 5 },
  '9-9': { name: '重阳节', type: 'traditional', color: 'gold', category: 'traditional', weight: 3 },
  '12-8': { name: '腊八节', type: 'traditional', color: 'gold', category: 'traditional', weight: 3 },
  '12-23': { name: '小年', type: 'traditional', color: 'gold', category: 'traditional', weight: 2 },
  '12-30': { name: '除夕', type: 'legal', color: 'red', category: 'holiday', weight: 5 }
};

// ===== 佛教纪念日（农历） =====
const buddhistFestivals = {
  '2-8': {
    name: '释迦牟尼佛涅槃日',
    shortName: '佛陀涅槃日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '释迦牟尼佛于拘尸那迦罗林中入灭，示现无常，令众生珍惜当下。',
    quote: '每一刻都是新的开始'
  },
  '2-15': {
    name: '释迦牟尼佛涅盘纪念日',
    shortName: '涅槃纪念日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念佛陀最后的教诲：当自求解脱，以智慧为灯。',
    quote: '光在心中，路在脚下'
  },
  '4-8': {
    name: '佛诞日（浴佛节）',
    shortName: '佛诞日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '释迦牟尼佛诞生于蓝毗尼园，九龙吐水沐浴太子。象征新生与希望。',
    quote: '愿你心中有光'
  },
  '4-15': {
    name: '佛吉祥日（卫塞节）',
    shortName: '卫塞节',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '同时纪念佛陀的诞生、成道与涅槃，是佛教最重要的节日之一。',
    quote: '觉知此刻，便是永恒'
  },
  '4-18': {
    name: '文殊菩萨圣诞',
    shortName: '文殊菩萨诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '大智文殊师利菩萨圣诞，象征智慧与觉悟。',
    quote: '智慧如灯，照亮前路'
  },
  '6-19': {
    name: '观音菩萨成道日',
    shortName: '观音成道日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '观世音菩萨修证菩提，成就无上正等正觉。',
    quote: '慈悲不是软弱，是力量'
  },
  '7-13': {
    name: '大势至菩萨圣诞',
    shortName: '大势至菩萨诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '以智慧之光摄受众生，象征智慧之光遍照一切。',
    quote: '光明总在不远处'
  },
  '7-15': {
    name: '盂兰盆节（佛欢喜日）',
    shortName: '盂兰盆节',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '目连救母之日，也是僧众自恣结束、诸佛欢喜的日子。提醒我们感恩来处。',
    quote: '记得那些来处'
  },
  '7-30': {
    name: '地藏王菩萨圣诞',
    shortName: '地藏菩萨诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '地藏菩萨誓愿"地狱不空，誓不成佛"，代表无尽的慈悲与坚持。',
    quote: '愿力所至，金石为开'
  },
  '8-22': {
    name: '燃灯佛圣诞',
    shortName: '燃灯佛诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '燃灯佛为过去庄严劫中所出世的千佛之一，曾授记释迦牟尼佛未来成佛。',
    quote: '点亮自己，也照亮别人'
  },
  '9-9': {
    name: '药师佛圣诞',
    shortName: '药师佛诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '药师琉璃光如来圣诞，能除一切苦，消灾延寿。',
    quote: '身心安顿，万物皆春'
  },
  '9-19': {
    name: '观世音菩萨出家日',
    shortName: '观音出家日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '观世音菩萨出家修道之日，象征放下与追寻。',
    quote: '放下，是为了更好地前行'
  },
  '11-17': {
    name: '阿弥陀佛圣诞',
    shortName: '阿弥陀佛诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '西方极乐世界教主阿弥陀佛圣诞，代表无量光、无量寿。',
    quote: '愿力所至，无所不及'
  },
  '12-8': {
    name: '腊八节（释迦牟尼佛成道日）',
    shortName: '腊八·佛陀成道日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '释迦牟尼佛于菩提树下悟道成佛之日。喝腊八粥的习俗由此而来，寓意觉悟与滋养。',
    quote: '慢一点，生活会更清楚'
  }
};

// ===== 按规则变化的节日 =====

/**
 * 计算母亲节（5月第2个星期日）
 */
function getMothersDay(year) {
  return getNthWeekDayOfMonth(year, 5, 0, 2); // 日=0, 第2个
}

/**
 * 计算父亲节（6月第3个星期日）
 */
function getFathersDay(year) {
  return getNthWeekDayOfMonth(year, 6, 0, 3);
}

/**
 * 计算感恩节（11月第4个星期四）
 */
function getThanksgivingDay(year) {
  return getNthWeekDayOfMonth(year, 11, 4, 4); // 四=4
}

/**
 * 获取某月第n个星期几 (0=日, 1=一, ..., 6=六)
 */
function getNthWeekDayOfMonth(year, month, weekDay, n) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  let diff = weekDay - firstDay;
  if (diff < 0) diff += 7;
  const day = 1 + diff + (n - 1) * 7;
  
  // 确保不超过该月天数
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth ? day : null;
}

/**
 * 获取动态节日列表
 */
function getDynamicFestivals(year) {
  const festivals = [];

  const mothersDay = getMothersDay(year);
  if (mothersDay) {
    festivals.push({
      month: 5,
      day: mothersDay,
      data: {
        name: '母亲节',
        type: 'common',
        color: 'pink',
        category: 'commemorate',
        isDynamic: true
      }
    });
  }

  const fathersDay = getFathersDay(year);
  if (fathersDay) {
    festivals.push({
      month: 6,
      day: fathersDay,
      data: {
        name: '父亲节',
        type: 'common',
        color: 'blue',
        category: 'commemorate',
        isDynamic: true
      }
    });
  }

  const thanksgiving = getThanksgivingDay(year);
  if (thanksgiving) {
    festivals.push({
      month: 11,
      day: thanksgiving,
      data: {
        name: '感恩节',
        type: 'common',
        color: 'orange',
        category: 'commemorate',
        isDynamic: true
      }
    });
  }

  return festivals;
}

// ===== 六斋日（农历初八、十四、十五、二十三、二十九及三十日；小月则为二十八、二十九日） =====
const LIUZHAI_DAYS = [8, 14, 15, 23, 29, 30];

/**
 * 判断某农历日期是否为六斋日
 * @param {number} lunarDay 农历日
 * @param {number} lunarMonthDays 该农历月份的天数（用于判断小月）
 */
function isLiuZhaiDay(lunarDay, lunarMonthDays) {
  if (lunarDay === 8 || lunarDay === 14 || lunarDay === 15 || lunarDay === 23) return true;
  if (lunarDay === 29) return true; // 二十九总是六斋日
  if (lunarDay === 30 && lunarMonthDays >= 30) return true; // 三十（仅大月）
  if (lunarDay === 28 && lunarMonthDays === 29) return true; // 小月的二十八替代三十
  return false;
}

/**
 * 获取指定日期的所有节日信息
 * @param {number} year 年
 * @param {number} month 月
 * @param {number} day 日
 * @param {object} opts 可选设置参数（不传则默认全部显示）
 * @param {boolean} opts.showLiuZhai 是否显示六斋日
 * @param {boolean} opts.showLunarFestivals 是否显示初一/十五
 * @param {boolean} opts.showBuddhistFestivals 是否显示佛诞日等佛教纪念日
 */
function getFestivalsByDate(year, month, day, opts) {
  const results = [];
  const key = `${month}-${day}`;

  // 合并默认选项（不传参时全部显示）
  const options = opts || {
    showLiuZhai: true,
    showLunarFestivals: true,
    showBuddhistFestivals: true
  };

  // 固定日期节日（始终显示：劳动节、青年节、国庆节等）
  if (fixedFestivals[key]) {
    results.push({ ...fixedFestivals[key], date: `${year}-${month}-${day}` });
  }

  // 动态节日（母亲节、父亲节等 — 始终显示）
  const dynamicFestivals = getDynamicFestivals(year);
  for (const df of dynamicFestivals) {
    if (df.month === month && df.day === day) {
      results.push({ ...df.data, date: `${year}-${month}-${day}` });
    }
  }

  // 农历相关节日（受开关控制）
  try {
    const lunar = solarToLunar(year, month, day);
    const lunarKey = `${lunar.month}-${lunar.day}`;

    // 农历初一/十五（可开关）
    if (options.showLunarFestivals) {
      if (lunar.day === 1) {
        results.push({
          name: '初一',
          shortName: '初一',
          type: 'traditional',
          color: 'gold',
          category: 'traditional',
          date: `${year}-${month}-${day}`,
          lunarDate: `农历${lunar.monthStr}月初一`
        });
      }

      if (lunar.day === 15) {
        results.push({
          name: '十五',
          shortName: '十五',
          type: 'traditional',
          color: 'gold',
          category: 'traditional',
          date: `${year}-${month}-${day}`,
          lunarDate: `农历${lunar.monthStr}月十五`
        });
      }
    }

    // 六斋日（可开关）
    if (options.showLiuZhai) {
      let lunarMonthDays = 30; // 默认大月
      try {
        const tomorrowSolar = new Date(year, month - 1, day + 1);
        const tYear = tomorrowSolar.getFullYear();
        const tMonth = tomorrowSolar.getMonth() + 1;
        const tDay = tomorrowSolar.getDate();
        const tomorrowLunar = solarToLunar(tYear, tMonth, tDay);
        if (tomorrowLunar.day === 1 && tomorrowLunar.month === lunar.month) {
          lunarMonthDays = lunar.day;
        } else if (tomorrowLunar.month !== lunar.month) {
          lunarMonthDays = lunar.day;
        }
      } catch (e2) { /* 保持默认 */ }

      if (isLiuZhaiDay(lunar.day, lunarMonthDays)) {
        results.push({
          name: '六斋日',
          shortName: '斋日',
          type: 'buddhist',
          color: 'purple',
          category: 'buddhist',
          date: `${year}-${month}-${day}`,
          lunarDate: `农历${lunar.monthStr}月${lunar.dayStr}`,
          description: '六斋日，每月的八日、十四日、十五日、二十三日、月末两日。'
        });
      }
    }

    // 原有农历节日（春节、元宵节等 — 始终显示）
    if (lunarFestivals[lunarKey]) {
      results.push({
        ...lunarFestivals[lunarKey],
        date: `${year}-${month}-${day}`,
        lunarDate: `农历${lunar.monthStr}月${lunar.dayStr}`
      });
    }

    // 佛教纪念日（佛诞日等 — 可开关）
    if (options.showBuddhistFestivals && buddhistFestivals[lunarKey]) {
      results.push({
        ...buddhistFestivals[lunarKey],
        date: `${year}-${month}-${day}`,
        lunarDate: `农历${lunar.monthStr}月${lunar.dayStr}`
      });
    }
  } catch (e) {
    // 忽略超出范围的日期
  }

  return results;
}

/**
 * 获取指定月份的所有节日
 */
function getMonthFestivals(year, month) {
  const festivals = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dayFestivals = getFestivalsByDate(year, month, d);
    if (dayFestivals.length > 0) {
      festivals.push({
        day: d,
        festivals: dayFestivals
      });
    }
  }

  return festivals;
}

/**
 * 获取即将到来的重要日子（包含今天）
 * @param {number} year 年
 * @param {number} month 月
 * @param {number} day 日
 * @param {number} days 查询天数范围
 * @param {object} opts 可选设置参数（同 getFestivalsByDate）
 */
function getUpcomingFestivals(year, month, day, days = 30, opts) {
  const upcoming = [];
  const currentDate = new Date(year, month - 1, day);

  for (let i = 0; i < days; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() + i);

    const y = checkDate.getFullYear();
    const m = checkDate.getMonth() + 1;
    const d = checkDate.getDate();

    // 传入设置参数，控制六斋日/初一/十五/佛教纪念日是否出现在近期节日列表中
    const fests = getFestivalsByDate(y, m, d, opts);
    if (fests.length > 0) {
      upcoming.push({
        date: `${y}-${padZero(m)}-${padZero(d)}`,
        dayOfWeek: checkDate.getDay(),
        daysAway: i,
        festivals: fests
      });
    }
  }

  return upcoming;
}

function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

module.exports = {
  fixedFestivals,
  lunarFestivals,
  buddhistFestivals,
  getFestivalsByDate,
  getMonthFestivals,
  getUpcomingFestivals,
  getDynamicFestivals,
  getMothersDay,
  getFathersDay
};
