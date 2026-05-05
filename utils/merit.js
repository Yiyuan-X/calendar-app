/**
 * 积善记录模块 — 基于《积善的方法》
 *
 * 核心理念：
 * - 记录单位为“善”
 * - 过失按“削善”扣减
 * - 十个善业折算一个功德
 */

// ==================== 功过分类体系 ====================

/**
 * 善行分类。
 * 字段名仍使用 merit 以兼容现有记录结构，数值含义为“善”。
 */
const GOOD_CATEGORIES = [
  {
    id: 'speech_guard',
    name: '护口劝善',
    icon: 'speech',
    color: '#4CAF50',
    desc: '不随恶语，劝止是非',
    items: [
      { id: 'g1', text: '人家讲别人不好，自己不讲别人不好', merit: 1 },
      { id: 'g2', text: '人家传播别人不好，你去劝他', merit: 5 },
      { id: 'g3', text: '见到伪经劝人不要学', merit: 1 },
      { id: 'g4', text: '见到别人骂善人，劝他不要这样做', merit: 5 },
      { id: 'g5', text: '别人骂你，你不骂他', merit: 1 },
      { id: 'g6', text: '别人伤害你，你不伤害别人', merit: 1 },
      { id: 'g7', text: '宣扬他人的善行', merit: 1 },
      { id: 'g8', text: '发善贤大德向善的话语给大家看', merit: 10 },
      { id: 'g9', text: '随喜赞叹他人善言善行', merit: 1 },
      { id: 'g10', text: '以正能量语言鼓励懈怠者精进', merit: 1 }
    ]
  },
  {
    id: 'filial_duty',
    name: '孝敬尽责',
    icon: 'filial',
    color: '#FF9800',
    desc: '尊亲敬长，尽心做事',
    items: [
      { id: 'g20', text: '对父母亲一天尊敬不顶撞', merit: 1 },
      { id: 'g21', text: '工作一天非常努力', merit: 1 },
      { id: 'g22', text: '尊敬长辈、尊敬领导一天', merit: 1 },
      { id: 'g23', text: '借人财富如期而还，不过期限', merit: 1 },
      { id: 'g24', text: '向老板上司说别人的优点，推荐有能力的人', merit: 10 },
      { id: 'g25', text: '自己承担过错', merit: 2 },
      { id: 'g26', text: '把功劳推给别人', merit: 2 },
      { id: 'g27', text: '为父母送一张组合', merit: 5 },
      { id: 'g28', text: '给人方便，让老人优先', merit: 1 }
    ]
  },
  {
    id: 'life_release',
    name: '护生施食',
    icon: 'benevolence',
    color: '#E91E63',
    desc: '慈悲护生，随缘施食',
    items: [
      { id: 'g40', text: '放生一命', merit: 1 },
      { id: 'g41', text: '放生小命十命', merit: 1 },
      { id: 'g42', text: '放生大命，如狗、牛', merit: 10 },
      { id: 'g43', text: '放生一条大鱼或黑鱼', merit: 1 },
      { id: 'g44', text: '把死掉的小动物埋葬，一条命', merit: 5 },
      { id: 'g45', text: '埋葬小的亡故生命五条', merit: 1 },
      { id: 'g46', text: '用米饭喂小鸟、蚂蚁、小虫子等两次', merit: 1 },
      { id: 'g47', text: '每天放生一条，发心真实', merit: 1 },
      { id: 'g48', text: '一次放生很多生命，记为一件大好事', merit: 1 }
    ]
  },
  {
    id: 'practice',
    name: '修行',
    icon: 'cultivation',
    color: '#9C27B0',
    desc: '诵经礼佛，闻法修心',
    items: [
      { id: 'g60', text: '为亲友、父母、善知识诵经一卷', merit: 2 },
      { id: 'g61', text: '念佛号千声', merit: 2 },
      { id: 'g62', text: '礼佛百拜，为别人拜', merit: 2 },
      { id: 'g63', text: '礼佛百拜，为自己拜', merit: 1 },
      { id: 'g64', text: '讲大乘佛经，五个人浏览', merit: 1 },
      { id: 'g65', text: '参与设佛台', merit: 2 },
      { id: 'g66', text: '念一张组合给人家', merit: 5 },
      { id: 'g67', text: '听闻开示后发心学习', merit: 1 },
      { id: 'g68', text: '把好的开示分享给别人听', merit: 1 },
      { id: 'g69', text: '法布施一条，法喜充满并利益他人', merit: 1 }
    ]
  },
  {
    id: 'wake_help',
    name: '改过助缘',
    icon: 'integrity',
    color: '#2196F3',
    desc: '知错即改，助人向善',
    items: [
      { id: 'g80', text: '见善必行', merit: 1 },
      { id: 'g81', text: '知错必改，一事一善', merit: 1 },
      { id: 'g82', text: '安慰有烦恼忧愁的人', merit: 1 },
      { id: 'g83', text: '正确解答佛友问题，使其明白', merit: 1 },
      { id: 'g84', text: '用佛法或正念救起想不开的人', merit: 10 },
      { id: 'g85', text: '度人学佛修心，使其命运改变', merit: 10 },
      { id: 'g86', text: '随缘帮助别人解决困难', merit: 1 },
      { id: 'g87', text: '把脏乱处顺手清理干净', merit: 1 },
      { id: 'g88', text: '发愿做一百件好事并记下一件', merit: 1 }
    ]
  }
];

/**
 * 过失分类。
 * 字段名仍使用 demerit 以兼容现有记录结构，数值含义为“削善”。
 */
const BAD_CATEGORIES = [
  {
    id: 'speech_fault',
    name: '口业是非',
    icon: 'anger',
    desc: '乱语伤人，挑拨离间',
    items: [
      { id: 'b1', text: '怨天尤人一次', demerit: 3 },
      { id: 'b2', text: '乱讲话、嚼舌头、挑拨离间', demerit: 10 },
      { id: 'b3', text: '讽刺别人并以对方难过为开心', demerit: 10 },
      { id: 'b4', text: '帮人解答错误，导致别人退转或失误', demerit: 10 },
      { id: 'b5', text: '明知会造成不善果，仍劝别人去做', demerit: 10 },
      { id: 'b6', text: '记录并回味自己做过的坏事', demerit: 5 }
    ]
  },
  {
    id: 'life_harm',
    name: '伤生杀生',
    icon: 'harm',
    desc: '伤害生命，削损善业',
    items: [
      { id: 'b20', text: '煮死一条鱼', demerit: 20 },
      { id: 'b21', text: '烹杀活鱼活物', demerit: 20 },
      { id: 'b22', text: '杀伤一条生命', demerit: 20 },
      { id: 'b23', text: '造了较大的杀业', demerit: 50 }
    ]
  }
];

// ==================== 积善修身金句 ====================

const LIAOFAN_QUOTES = [
  { text: '见贤思齐焉，见不贤而内自省也。', source: '《论语》' },
  { text: '己所不欲，勿施于人。', source: '《论语》' },
  { text: '君子成人之美，不成人之恶。', source: '《论语》' },
  { text: '过而不改，是谓过矣。', source: '《论语》' },
  { text: '吾日三省吾身。', source: '《论语》' },
  { text: '勿以恶小而为之，勿以善小而不为。', source: '《三国志·蜀书·先主传' },
  { text: '积善之家，必有余庆。', source: '《易经》' },
  { text: '天行健，君子以自强不息。', source: '《易经》' },
  { text: '地势坤，君子以厚德载物。', source: '《易经》' },
  { text: '从善如登，从恶如崩。', source: '《国语》' },
  { text: '爱人者，人恒爱之；敬人者，人恒敬之。', source: '《孟子·离娄下》' },
  { text: '穷则独善其身，达则兼济天下。', source: '《孟子·尽心上》' },
  { text: '不迁怒，不贰过。', source: '《论语》' },
  { text: '知善知恶是良知，为善去恶是格物。', source: '《王阳明全集·语录三·钱德洪录》' },
  { text: '破山中贼易，破心中贼难。', source: '《王阳明全集·与杨仕德薛尚谦书》' },
  { text: '志不立，天下无可成之事。', source: '《教条示龙场诸生》' },
  { text: '种树者必培其根，种德者必养其心。', source: '《传习录》' },
  { text: '夫祸患常积于忽微，而智勇多困于所溺。', source: '《新五代史·伶官传序》' },
  { text: '善恶之报，如影随形。', source: '《太上感应篇》' },
  { text: '见人之得，如己之得；见人之失，如己之失。', source: '《太上感应篇》' },
  { text: '惟贤惟德，能服于人。', source: '《三国志》' },
  { text: '静以修身，俭以养德。', source: '《诫子书》' },
  { text: '非淡泊无以明志，非宁静无以致远。', source: '诸葛亮《诫子书》' },
  { text: '行有不得，反求诸己。', source: '《孟子·离娄上》' },
  { text: '诸恶莫作，众善奉行。', source: '《增一阿含经》' },
  { text: '一切有为法，如梦幻泡影。', source: '《金刚经》' },
  { text: '天下之难事，必作于易；天下之大事，必作于细。', source: '《道德经》' },
  { text: '祸兮福之所倚，福兮祸之所伏。', source: '《道德经》' },
  { text: '上善若水，水善利万物而不争。', source: '《道德经》' },
  { text: '大道至简，实干为要。', source: '《道德经》' },
  { text: '知足不辱，知止不殆。', source: '《道德经》' },
  { text: '为善最乐，为恶难逃。', source: '《增广贤文》' },
  { text: '人有善愿，天必佑之。', source: '《增广贤文》》' },
  { text: '一心之善，万善随之；一心之恶，万恶随之。', source: '《乾彰缙禅师语录》' },
  { text: '夫天道至善，四时生焉，万物育焉，各得其所。', source: '《乾彰缙禅师语录》' },
  { text: '心净则国土净。', source: '《维摩诘经》' },
  { text: '但行好事，莫问前程。', source: '《增广贤文》' },
  { text: '人无远虑，必有近忧。', source: '《论语》' },
  { text: '见利思义，见危授命。', source: '《论语》' },
  { text: '敏而好学，不耻下问。', source: '《论语》' },
  { text: '君子务本，本立而道生。', source: '《论语》' },
  { text: '和而不同，小人同而不和。', source: '《论语》' },
  { text: '得道多助，失道寡助。', source: '《孟子·公孙丑下》' },
  { text: '老吾老以及人之老，幼吾幼以及人之幼。', source: '《孟子·梁惠王上》' },
  { text: '心有所畏，言有所戒，行有所止。', source: '《礼记》' },
  { text: '凡事预则立，不预则废。', source: '《礼记》' },
  { text: '不以物喜，不以己悲。', source: '《岳阳楼记》' },
  { text: '先天下之忧而忧，后天下之乐而乐。', source: '《岳阳楼记》' },
  { text: '道虽迩，不行不至；事虽小，不为不成。', source: '《荀子•修身》' },
  { text: '锲而不舍，金石可镂。', source: '《荀子》' },
  { text: '不积跬步，无以至千里。', source: '《荀子》' },
  { text: '为善必昌，为善不昌，祖上有余殃，殃尽必昌；为恶必亡，为恶不亡，祖上有余德，德尽必亡。', source: '《目连经》' }
];

// ==================== 工具方法 ====================

/**
 * 获取随机一条积善修身金句
 */
function getRandomQuote() {
  const idx = Math.floor(Math.random() * LIAOFAN_QUOTES.length);
  return LIAOFAN_QUOTES[idx];
}

/**
 * 获取引文
 */
function getDailyQuote() {
  return getRandomQuote();
}

/**
 * 善数折算功德。十个善业折算一个功德。
 * @param {number} goodCount 善数
 * @returns {number} 功德数，保留1位小数
 */
function calculateGongDe(goodCount) {
  const value = Number(goodCount) || 0;
  return Math.round((value / 10) * 10) / 10;
}

/**
 * 计算某条记录的净德分
 * @param {object} record - 单日功过记录
 * @returns {number} 净德分
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
 * 统计一段时间内的功过数据
 * @param {Array} records - 功过记录数组
 * @returns {object} 统计结果
 */
function getMeritStats(records) {
  let totalGood = 0;
  let totalBad = 0;
  let totalNet = 0;
  let dayCount = 0;
  let goodDays = 0;   // 净德分 > 0 的天数
  let badDays = 0;    // 净德分 < 0 的天数
  let neutralDays = 0; // 净德分 == 0 的天数

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
    totalGoodGongDe: calculateGongDe(totalGood),
    totalBadGongDe: calculateGongDe(totalBad),
    totalNetGongDe: calculateGongDe(totalNet),
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
 * 获取德分等级描述
 * @param {number} netMerit - 净德分
 * @returns {object} 等级信息
 */
function getMeritLevel(netMerit) {
  if (netMerit >= 1000) return { level: 9, title: '千善圆满', desc: '积善深厚，功德成林', color: '#FFD700' };
  if (netMerit >= 500) return { level: 8, title: '五百善行', desc: '善念相续，福德增长', color: '#9C27B0' };
  if (netMerit >= 200) return { level: 7, title: '二百善行', desc: '一善解百灾，久久为功', color: '#2196F3' };
  if (netMerit >= 100) return { level: 6, title: '百善愿成', desc: '做一件记一件，善业可依', color: '#009688' };
  if (netMerit >= 50) return { level: 5, title: '五十善行', desc: '见善即行，知错即改', color: '#4CAF50' };
  if (netMerit >= 20) return { level: 4, title: '善念渐稳', desc: '十善一功德，贵在真实', color: '#8BC34A' };
  if (netMerit >= 0) return { level: 3, title: '发心积善', desc: '从一善开始，日日不空过', color: '#CDDC39' };
  if (netMerit >= -20) return { level: 2, title: '及时改过', desc: '少造口业杀业，多行善事补足', color: '#FF9800' };
  return { level: 1, title: '当下止恶', desc: '先止损，再积善', color: '#F44336' };
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
  calculateGongDe,
  calculateNetMerit,
  getMeritStats,
  getStreakDays,
  getMeritLevel
};
