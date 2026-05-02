/**
 * 功德记录模块 — 基于传统功过格
 *
 * 核心理念：
 * - 善行积累德分，过失折损德分
 * - 每日反省，积微成著
 * - 功过相抵，净德分为真
 */

// ==================== 功过分类体系 ====================

/**
 * 善行分类
 *
 * 计分参考：
 * - 1分：日常一念一行，如忍一句、敬长一天、尽责一天。
 * - 2分：主动承担、让功、诵读善书、持续照护等较完整善行。
 * - 5分：劝止是非、化解冲突、保护生命、安慰解忧等影响他人的善行。
 * - 10分：举荐贤能、公益服务、救急济困等较大善行。
 * - 20分以上：救命、献血、长期或重大公益等较大善举。
 */
const GOOD_CATEGORIES = [
  {
    id: 'benevolence',
    name: '仁爱济人',
    icon: 'benevolence',
    color: '#E91E63',
    desc: '救人之急，济人之困',
    items: [
      { id: 'g3', text: '安慰烦恼忧愁的人', merit: 1 },
      { id: 'g55', text: '发善贤大德善言一次一善', merit: 1 },
      { id: 'g1', text: '帮助他人解决实际困难一次一善', merit: 1 },
      { id: 'g2', text: '救急济困，随力资助', merit: 1 },
      { id: 'g4', text: '主动给人方便或让行', merit: 1 },
      { id: 'g5', text: '保护弱小或照护小动物', merit: 1 },
      { id: 'g6', text: '参与公益或志愿服务', merit: 1 },
      { id: 'g7', text: '无偿分享有价值技能或经验一次一善', merit: 1 },
      { id: 'g8', text: '拾金不昧并归还失主', merit: 5 },
      { id: 'g37', text: '把脏乱处顺手清理干净', merit: 1 },
      { id: 'g38', text: '喂养小动物两次一善', merit: 1 },
      { id: 'g39', text: '妥善处理受伤或亡故的小动物', merit: 1 },
      { id: 'g40', text: '救助处于危险中的人', merit: 50 }
    ]
  },
  {
    id: 'filial',
    name: '孝亲敬长',
    icon: 'filial',
    color: '#FF9800',
    desc: '孝养父母，尊敬师长',
    items: [
      { id: 'g9', text: '尊敬父母，不顶撞', merit: 1 },
      { id: 'g10', text: '陪伴父母或长辈聊天', merit: 1 },
      { id: 'g11', text: '关心父母身体健康', merit: 1 },
      { id: 'g12', text: '尊敬长辈、师长或领导', merit: 1 },
      { id: 'g13', text: '听取长辈劝告并改正', merit: 2 },
      { id: 'g14', text: '主动承担家务', merit: 1 },
      { id: 'g41', text: '为父母长辈做一件贴心事', merit: 2 },
      { id: 'g42', text: '为父母、亲友读诵善书或诚心祝愿', merit: 2 }
    ]
  },
  {
    id: 'integrity',
    name: '诚信尽责',
    icon: 'integrity',
    color: '#2196F3',
    desc: '言而有信，行而不欺',
    items: [
      { id: 'g18', text: '工作或学习尽心尽责', merit: 1 },
      { id: 'g45', text: '推荐贤能之人', merit: 10 },
      { id: 'g15', text: '信守承诺，说到做到', merit: 5 },
      { id: 'g16', text: '承认错误不推诿', merit: 2 },
      { id: 'g19', text: '不占小便宜', merit: 1 },
      { id: 'g20', text: '传播真实有益的信息', merit: 1 },
      { id: 'g43', text: '主动承担过错', merit: 2 },
      { id: 'g44', text: '把功劳让给他人', merit: 2 },
      { id: 'g17', text: '借人财物如期归还', merit: 1 },
    ]
  },
  {
    id: 'cultivation',
    name: '修身养性',
    icon: 'cultivation',
    color: '#9C27B0',
    desc: '反省自省，克己复礼',
    items: [
      { id: 'g46', text: '见善必行', merit: 1 },
      { id: 'g21', text: '读诵经典组合', merit: 5 },
      { id: 'g56', text: '诵经一卷', merit: 2 },
      { id: 'g26', text: '改正一个已知过失', merit: 1 },
      { id: 'g57', text: '读诵经典或善书一段', merit: 2 },
      { id: 'g47', text: '今日持续记录善行', merit: 1 },
      { id: 'g23', text: '静坐收心十五分钟以上', merit: 1 },
      { id: 'g24', text: '反省今日过失并写下改法', merit: 2 },
      { id: 'g25', text: '不发脾气', merit: 1 },
      { id: 'g27', text: '早睡早起，作息有度', merit: 1 },
      { id: 'g28', text: '饮食节制，不贪口腹', merit: 1 },
      { id: 'g29', text: '护生救生，方法妥当，放生一命一善', merit: 1 },
      { id: 'g30', text: '礼敬先贤或诚心自省', merit: 2 }
    ]
  },
  {
    id: 'kindness_speech',
    name: '善言和众',
    icon: 'speech',
    color: '#4CAF50',
    desc: '言语温和，不伤人心',
    items: [
      { id: 'g35', text: '别人说是非时你不讲或不附和', merit: 1 },
      { id: 'g50', text: '被人责骂时不还口', merit: 1 },
      { id: 'g51', text: '别人伤害你，你不伤害别人', merit: 1 },
      { id: 'g31', text: '真诚赞美他人的优点', merit: 1 },
      { id: 'g32', text: '耐心倾听他人倾诉', merit: 1 },
      { id: 'g33', text: '化解他人的矛盾', merit: 5 },
      { id: 'g34', text: '说鼓励的话使人振作', merit: 5 },
      { id: 'g36', text: '主动道歉并求得谅解', merit: 2 },
      { id: 'g48', text: '劝别人不要传播是非', merit: 5 },
      { id: 'g49', text: '劝人不要辱骂善良的人', merit: 5 },
      { id: 'g52', text: '宣扬他人的善行', merit: 1 },
      { id: 'g53', text: '分享有益修身的好话', merit: 1 },
      { id: 'g54', text: '以善言劝人改过向好', merit: 5 }
    ]
  }
];

/**
 * 恶行分类（需警惕和改正）
 */
const BAD_CATEGORIES = [
  {
    id: 'anger',
    name: '怨怒暴躁',
    icon: 'anger',
    desc: '怒气伤人，怨怼损己',
    items: [
      { id: 'b1', text: '对家人或亲近的人发脾气', demerit: 5 },
      { id: 'b2', text: '对陌生人发怒或路怒', demerit: 5 },
      { id: 'b3', text: '怨天尤人，开口埋怨', demerit: 3 },
      { id: 'b4', text: '说伤人的话', demerit: 5 },
      { id: 'b5', text: '摔东西或有暴力行为', demerit: 10 },
      { id: 'b26', text: '心怀怨恨，久久不放', demerit: 10 }
    ]
  },
  {
    id: 'greed',
    name: '贪占浪费',
    icon: 'greed',
    desc: '贪得无厌，奢侈浪费',
    items: [
      { id: 'b6', text: '过度消费/浪费', demerit: 5 },
      { id: 'b7', text: '嫉妒他人的成就', demerit: 8 },
      { id: 'b8', text: '占别人便宜', demerit: 10 },
      { id: 'b9', text: '沉迷娱乐/游戏荒废正事', demerit: 5 },
      { id: 'b10', text: '攀比虚荣心作祟', demerit: 5 },
      { id: 'b27', text: '借人财物逾期不还', demerit: 5 },
      { id: 'b28', text: '见利忘义，损人利己', demerit: 15 }
    ]
  },
  {
    id: 'dishonesty',
    name: '欺妄是非',
    icon: 'dishonesty',
    desc: '欺骗失信，是非伤人',
    items: [
      { id: 'b11', text: '说谎/隐瞒事实', demerit: 10 },
      { id: 'b12', text: '违背承诺', demerit: 8 },
      { id: 'b13', text: '背后说人坏话', demerit: 8 },
      { id: 'b14', text: '传播未经证实的信息', demerit: 5 },
      { id: 'b15', text: '抄袭/作弊', demerit: 15 },
      { id: 'b29', text: '挑拨离间，制造矛盾', demerit: 10 },
      { id: 'b30', text: '讥讽他人并以此为乐', demerit: 10 },
      { id: 'b31', text: '明知有害仍劝人去做', demerit: 10 }
    ]
  },
  {
    id: 'laziness',
    name: '懈怠失度',
    icon: 'laziness',
    desc: '因循苟且，虚度光阴',
    items: [
      { id: 'b18', text: '沉迷手机浪费时间', demerit: 3 },
      { id: 'b19', text: '不完成当日计划', demerit: 3 },
      { id: 'b20', text: '暴饮暴食/饮食无度', demerit: 5 },
      { id: 'b32', text: '明知有错却不改', demerit: 5 },
      { id: 'b33', text: '能帮而故意不帮', demerit: 3 }
    ]
  },
  {
    id: 'cruelty',
    name: '伤生损物',
    icon: 'harm',
    desc: '伤害生命，损坏公物',
    items: [
      { id: 'b21', text: '故意伤害动物', demerit: 20 },
      { id: 'b22', text: '杀伤生命', demerit: 20 },
      { id: 'b23', text: '浪费食物', demerit: 5 },
      { id: 'b24', text: '破坏环境/公物', demerit: 8 },
      { id: 'b25', text: '幸灾乐祸', demerit: 10 },
      { id: 'b34', text: '烹杀活鱼活物', demerit: 20 },
      { id: 'b35', text: '见人遇险而冷漠旁观', demerit: 20 }
    ]
  }
];

// ==================== 积善修身金句 ====================

const LIAOFAN_QUOTES = [
  { text: '见贤思齐焉，见不贤而内自省也。', source: '《论语》' },
  { text: '己所不欲，勿施于人。', source: '《论语》' },
  { text: '君子成人之美，不成人之恶。', source: '《论语》' },
  { text: '德不孤，必有邻。', source: '《论语》' },
  { text: '过而不改，是谓过矣。', source: '《论语》' },
  { text: '吾日三省吾身。', source: '《论语》' },
  { text: '勿以恶小而为之，勿以善小而不为。', source: '《三国志·蜀书·先主传' },
  { text: '积善之家，必有余庆。', source: '《易经》' },
  { text: '天行健，君子以自强不息。', source: '《易经》' },
  { text: '地势坤，君子以厚德载物。', source: '《易经》' },
  { text: '从善如登，从恶如崩。', source: '《国语》' },
  { text: '爱人者，人恒爱之；敬人者，人恒敬之。', source: '《孟子·离娄下》' },
  { text: '穷则独善其身，达则兼善天下。', source: '《孟子·尽心上》' },
  { text: '生于忧患，死于安乐。', source: '《孟子·告子下》' },
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
  { text: '自净其意，是诸佛教。', source: '《增一阿含经》' },
  { text: '若人欲了知，三世一切佛，应观法界性，一切唯心造。', source: '《华严经》' },
  { text: '一切有为法，如梦幻泡影。', source: '《金刚经》' },
  { text: '天下之难事，必作于易；天下之大事，必作于细。', source: '《道德经》' },
  { text: '祸兮福之所倚，福兮祸之所伏。', source: '《道德经》' },
  { text: '上善若水，水善利万物而不争。', source: '《道德经》' },
  { text: '大道至简，实干为要。', source: '《道德经》' },
  { text: '知足不辱，知止不殆。', source: '《道德经》' },
  { text: '反者道之动，弱者道之用。', source: '《道德经》' },
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
  { text: '为善必昌，为善不昌，祖上有余殃，殃尽必昌；为恶必亡，为恶不亡，祖上有余德，德尽必亡。。', source: '《目连经》' }
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
  if (netMerit >= 1000) return { level: 9, title: '厚德之人', desc: '德被日用，行稳致远', color: '#FFD700' };
  if (netMerit >= 500) return { level: 8, title: '贤达君子', desc: '厚德载物，福泽绵长', color: '#9C27B0' };
  if (netMerit >= 200) return { level: 7, title: '有德之士', desc: '积善之家，必有余庆', color: '#2196F3' };
  if (netMerit >= 100) return { level: 6, title: '向善之人', desc: '去恶从善，日有进益', color: '#009688' };
  if (netMerit >= 50) return { level: 5, title: '修德初成', desc: '日行一善，久久为功', color: '#4CAF50' };
  if (netMerit >= 20) return { level: 4, title: '发心向善', desc: '千里之行，始于足下', color: '#8BC34A' };
  if (netMerit >= 0) return { level: 3, title: '初心未泯', desc: '但行好事，莫问前程', color: '#CDDC39' };
  if (netMerit >= -20) return { level: 2, title: '迷途知返', desc: '知过能改，善莫大焉', color: '#FF9800' };
  return { level: 1, title: '当及时改', desc: '知止知改，犹未为晚', color: '#F44336' };
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
