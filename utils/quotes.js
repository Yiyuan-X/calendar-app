/**
 * 金句系统
 * 内置治愈系金句，按类型分类，随机展示
 */

const quotes = {
  // ===== 生日金句 =====
  birthday: [
    '又长大了一岁，愿你依然热爱这个世界',
    '每一岁都珍贵，每一步都算数',
    '愿你的新一年，有光、有爱、有期待',
    '生日快乐，愿你成为自己的太阳',
    '今天是你来到这个世界的日子，值得被好好记住',
    '岁月不是偷走青春的小偷，它是见证成长的记录者',
    '愿你往后余生，眼里是阳光，笑里是坦荡',
    '新的一岁，请继续兴致盎然地与世界交手',
    '今天的你，比昨天更值得被爱',
    '生日这天，宇宙都在为你庆祝'
  ],

  // ===== 纪念日金句 =====
  anniversary: [
    '时间会证明一切，也会留下最好的',
    '一起走过的每一天，都是值得的',
    '有些事不需要太多言语，时间就是答案',
    '感谢那些陪伴，让平凡的日子有了光',
    '在一起的日子，就是最好的纪念',
    '时光不老，我们不散',
    '每一个纪念日，都是爱的续篇',
    '走过的路，都算数；相伴的人，都值得',
    '平凡的日子里，藏着最珍贵的记忆',
    '这一路走来，谢谢你还在'
  ],

  // ===== 节日金句 =====
  festival: {
    // 春节
    spring: ['新年快乐，万事胜意', '旧年已去，新年可期', '愿新的一年，所有美好如期而至'],
    // 元旦
    newYear: ['新的一年，新的开始', '愿你的2026，闪闪发光', '凡是过往，皆为序章'],
    // 中秋
    midAutumn: ['月圆人团圆，心安即归处', '但愿人长久，千里共婵娟', '今晚的月亮，替我说了想念'],
    // 国庆
    nationalDay: ['山河远阔，人间烟火', '愿祖国繁荣，愿你我安好', '生在红旗下，长在春风里'],
    // 情人节
    valentine: ['爱在日常，才不寻常', '遇见你，是最好的运气', '世界很大，有你刚好'],
    // 清明
    qingming: ['春风已解千层雪，后人难忘先人恩', '思念不因距离而淡，怀念不随时间而减', '记住来处，才能走得更远'],
    // 端午
    duanwu: ['粽叶飘香，端午安康', '生活像粽子一样，甜咸皆宜', '愿你安康，不止端午'],
    // 七夕
    qixi: ['银河虽远，心意相连', '爱在朝夕，不在七夕', '最好的浪漫，是日常的陪伴'],
    // 圣诞
    christmas: ['Merry Christmas，愿温暖常伴', '圣诞快乐，愿你被这个世界温柔以待', '冬天的浪漫，从圣诞开始']
  },

  // ===== 佛教节日金句（人生感悟风格） =====
  buddhist: {
    '佛诞日': ['愿你心中有光', '每一个生命都值得被温柔对待', '觉醒的那一刻，世界从此不同'],
    '盂兰盆节': ['记得那些来处', '感恩是生命最美的姿态', '所有的相遇，都是久别重逢'],
    '腊八': ['慢一点，生活会更清楚', '一碗粥的温度，足以抵御整个寒冬', '温暖自己，也能照亮别人'],
    '佛陀涅槃日': ['无常才是常态，当下即是永恒', '放下执念，轻装前行', '结束也是另一种开始'],
    '卫塞节': ['觉知此刻，便是永恒', '内心的平静，是最珍贵的财富', '智慧如灯，照亮前路'],
    '观音成道日': ['慈悲不是软弱，是力量', '心怀善意，自有回响', '柔软的心，最能承载世界'],
    '地藏菩萨诞辰': ['愿力所至，金石为开', '坚持本身就是一种力量', '承诺过的，就一定要做到'],
    '观音出家日': ['放下，是为了更好地前行', '每一次选择，都是成长', '离开舒适区，才能看见更广阔的天空'],
    '阿弥陀佛诞辰': ['愿力所至，无所不及', '相信美好，美好就会发生', '心存善念，必有后福'],
    '佛陀成道日': ['慢一点，生活会更清楚', '真正的收获，来自内心的沉淀', '安静下来，答案自然浮现'],
    '中元节': ['记得那些来处', '感恩过去，珍惜现在', '生命的意义在于传承与延续']
  },

  // ===== 成长类金句 =====
  growth: [
    '成长就是不断与自己和解的过程',
    '不必追赶别人的节奏，你有自己的时区',
    '所有的努力都不会白费，只是时机未到',
    '允许自己慢慢来，也是一种勇气',
    '你不必完美，但你必须真实',
    '每一次跌倒，都是为了更好地站起',
    '不要害怕改变，那是成长的开始',
    '你已经做得很好了，真的',
    '今天的努力，是明天的底气',
    '相信自己，你比自己想象的更强大'
  ],

  // ===== 平静治愈类金句 =====
  calm: [
    '深呼吸，一切都会好的',
    '今天也辛苦了，好好休息吧',
    '不用着急，花会开的',
    '允许自己偶尔停下来',
    '你值得被这世界温柔以待',
    '安静下来，听听心里的声音',
    '没有什么是过不去的坎',
    '此刻的宁静，就是最好的礼物',
    '给自己一个微笑，开始新的一天',
    '生活本就不易，对自己好一点',
    '慢下来的时光，往往最有味道',
    '不必向任何人证明什么，做就好',
    '今天的风很温柔，适合发呆',
    '你很好，只是你自己还不知道',
    '把烦恼交给时间，把快乐留给自己',
    '每个平凡的日子，都值得认真度过',
    '累了就歇一歇，没关系的',
    '阳光正好，微风不噪，一切都刚刚好',
    '愿你内心安宁，万物可爱',
    '保持热爱，奔赴山海'
  ],

  // ===== 早晨金句 =====
  morning: [
    '早安，新的一天开始了',
    '今天也要元气满满哦',
    '醒来就是赚到的一天',
    '阳光已经准备好了，你呢',
    '每一个清晨，都是一次新生'
  ],

  // ===== 傍晚金句 =====
  evening: [
    '辛苦了一天，好好放松吧',
    '今晚的月色很美，适合早点休息',
    '把今天的疲惫留在门外，明天又是新的一天',
    '晚安，愿你有个好梦',
    '今日事毕，明日可期'
  ]
};

/**
 * 随机获取指定类型的金句
 */
function getRandomQuote(type) {
  if (!quotes[type]) return quotes.calm[Math.floor(Math.random() * quotes.calm.length)];

  const list = quotes[type];
  
  // 如果是对象（如 festival, buddhist），随机选一个子类别
  if (typeof list === 'object' && !Array.isArray(list)) {
    const keys = Object.keys(list);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const subList = list[randomKey];
    return subList[Math.floor(Math.random() * subList.length)];
  }

  return list[Math.floor(Math.random() * list.length)];
}

/**
 * 根据节日名称获取对应金句
 */
function getQuoteByFestival(festivalName) {
  // 先检查佛教节日
  for (const key in quotes.buddhist) {
    if (festivalName.includes(key) || key.includes(festivalName)) {
      const list = quotes.buddhist[key];
      return list[Math.floor(Math.random() * list.length)];
    }
  }

  // 检查普通节日
  const festivalMap = {
    '春节': 'spring', '元旦': 'newYear', '中秋': 'midAutumn',
    '国庆': 'nationalDay', '情人节': 'valentine', '清明': 'qingming',
    '端午': 'duanwu', '七夕': 'qixi', '圣诞': 'christmas'
  };

  for (const [key, value] of Object.entries(festivalMap)) {
    if (festivalName.includes(key) || festivalName.includes(value)) {
      const list = quotes.festival[value];
      return list[Math.floor(Math.random() * list.length)];
    }
  }

  // 默认返回治愈类
  return getRandomQuote('calm');
}

/**
 * 获取每日一句（根据时间段）
 */
function getDailyQuote() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 9) {
    return getRandomQuote('morning');
  } else if (hour >= 18 && hour < 23) {
    return getRandomQuote('evening');
  } else {
    return getRandomQuote('calm');
  }
}

module.exports = {
  quotes,
  getRandomQuote,
  getQuoteByFestival,
  getDailyQuote
};
