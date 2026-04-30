/**
 * 日历工具函数
 * 生成日历数据、日期格式化等
 */

const { solarToLunar } = require('./lunar');
const { getTodaySolarTerm, getSolarTermDate } = require('./solar-terms');
const { getFestivalsByDate } = require('./festivals');
const storage = require('./storage');

// 星期名称
const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
const fullWeekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 获取某月的完整日历数据
 * @param {number} year 年份
 * @param {number} month 月份 1-12
 * @returns {Array} 日历数据数组
 */
function getMonthCalendar(year, month) {
  const calendar = [];
  const firstDay = new Date(year, month - 1, 1).getDay(); // 当月第一天是星期几
  const daysInMonth = new Date(year, month, 0).getDate(); // 当月天数

  // 上个月的天数（用于填充）
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  // 填充上个月的日期
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    calendar.push({
      day: day,
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false,
      dateStr: `${prevYear}-${padZero(prevMonth)}-${padZero(day)}`,
      lunar: null,
      festival: [],
      solarTerm: null,
      isToday: false,
      isSelected: false
    });
  }

  // 当月日期
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${padZero(month)}-${padZero(d)}`;
    
    let lunarInfo = null;
    let festivals = [];
    let solarTerm = null;

    try {
      lunarInfo = solarToLunar(year, month, d);
      // 读取用户设置，传入节日查询
      const festOpts = {
        showLiuZhai: storage.getSetting('showLiuZhai'),
        showLunarFestivals: storage.getSetting('showLunarFestivals'),
        showBuddhistFestivals: storage.getSetting('showBuddhistFestivals')
      };
      festivals = getFestivalsByDate(year, month, d, festOpts);
      solarTerm = getTodaySolarTerm(year, month, d);
    } catch (e) {
      // 忽略错误
    }

    calendar.push({
      day: d,
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false,
      dateStr: dateStr,
      lunar: lunarInfo,
      festival: festivals,
      solarTerm: solarTerm,
      isToday: dateStr === todayStr,
      isSelected: false
    });
  }

  // 填充下个月的日期（补齐6行）
  const remainingDays = 42 - calendar.length; // 6行7列
  if (remainingDays > 0) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    for (let d = 1; d <= remainingDays; d++) {
      calendar.push({
        day: d,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true,
        dateStr: `${nextYear}-${padZero(nextMonth)}-${padZero(d)}`,
        lunar: null,
        festival: [],
        solarTerm: null,
        isToday: false,
        isSelected: false
      });
    }
  }

  return calendar;
}

/**
 * 格式化日期显示
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = date.getDay();

  return format
    .replace('YYYY', year)
    .replace('MM', padZero(month))
    .replace('DD', padZero(day))
    .replace('M', month)
    .replace('D', day)
    .replace('WW', fullWeekNames[weekDay])
    .replace('W', weekNames[weekDay]);
}

/**
 * 获取今天的日期信息
 */
function getTodayInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDay = now.getDay();

  let lunarInfo = null;
  let festivals = [];
  let solarTerm = null;

  try {
    lunarInfo = solarToLunar(year, month, day);
    const festOpts = {
      showLiuZhai: storage.getSetting('showLiuZhai'),
      showLunarFestivals: storage.getSetting('showLunarFestivals'),
      showBuddhistFestivals: storage.getSetting('showBuddhistFestivals')
    };
    festivals = getFestivalsByDate(year, month, day, festOpts);
    solarTerm = getTodaySolarTerm(year, month, day);
  } catch (e) {
    // 忽略
  }

  return {
    date: now,
    year,
    month,
    day,
    weekDay,
    weekName: fullWeekNames[weekDay],
    weekNameShort: weekNames[weekDay],
    dateStr: `${year}-${padZero(month)}-${padZero(day)}`,
    lunar: lunarInfo,
    lunarMonth: lunarInfo ? lunarInfo.monthStr + '月' : '',
    lunarDay: lunarInfo ? lunarInfo.dayStr : '',
    lunarDisplay: lunarInfo ? lunarInfo.display : '',
    ganzhiYear: lunarInfo ? lunarInfo.yearGanZhi : '',
    animalYear: lunarInfo ? lunarInfo.animal : '',
    festivals: festivals,
    solarTerm: solarTerm
  };
}

/**
 * 判断是否为闰年
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * 获取月份名称
 */
function getMonthName(month) {
  const names = ['', '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return names[month];
}

/**
 * 获取相对时间描述
 */
function getRelativeTimeDescription(daysAway) {
  if (daysAway === 0) return '今天';
  if (daysAway === 1) return '明天';
  if (daysAway === 2) return '后天';
  if (daysAway === -1) return '昨天';
  if (daysAway === -2) return '前天';
  if (daysAway > 0) return `${daysAway}天后`;
  return `${Math.abs(daysAway)}天前`;
}

/**
 * 补零
 */
function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

module.exports = {
  weekNames,
  fullWeekNames,
  getMonthCalendar,
  formatDate,
  getTodayInfo,
  isLeapYear,
  getMonthName,
  getRelativeTimeDescription,
  padZero
};
