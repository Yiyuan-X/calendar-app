/**
 * 节日数据管理
 * 包含：法定节日、传统节日、纪念日、佛教纪念日
 */

const { solarToLunar } = require('./lunar');

// ===== 固定日期节日 =====
const fixedFestivals = {
  // ===== 法定 / 常见节日 =====

  '1-1': {
    name: '元旦',
    shortName: '元旦',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '新年的开始，万象更新。告别过去，迎接新的希望与可能。',
    quote: '新的一年，愿一切更好'
  },

  '2-14': {
    name: '情人节',
    shortName: '情人节',
    type: 'common',
    color: 'pink',
    category: 'commemorate',
    description: '表达爱与心意的日子，适合告白、陪伴与珍惜彼此。',
    quote: '爱是日常，也是此刻'
  },

  '3-8': {
    name: '妇女节',
    shortName: '妇女节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '致敬女性力量，赞美女性在社会与家庭中的重要价值。',
    quote: '愿每一位女性都被温柔以待'
  },

  '3-12': {
    name: '植树节',
    shortName: '植树节',
    type: 'legal',
    color: 'green',
    category: 'holiday',
    description: '播种绿色，守护自然。象征希望与生命的延续。',
    quote: '种下一棵树，也种下一份未来'
  },

  '4-1': {
    name: '愚人节',
    shortName: '愚人节',
    type: 'common',
    color: 'gray',
    category: 'other',
    description: '轻松玩笑的一天，适度幽默，让生活多一点趣味。',
    quote: '认真生活，偶尔玩笑'
  },

  '5-1': {
    name: '劳动节',
    shortName: '劳动节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '致敬劳动者，所有努力都值得被看见与尊重。',
    quote: '平凡的努力，成就不平凡的生活'
  },

  '5-4': {
    name: '青年节',
    shortName: '青年节',
    type: 'legal',
    color: 'blue',
    category: 'holiday',
    description: '属于青年的日子，象征热血、理想与无限可能。',
    quote: '青春不只是年龄，是一种状态'
  },

  '6-1': {
    name: '儿童节',
    shortName: '儿童节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '属于孩子的节日，也提醒我们保留一份纯真与快乐。',
    quote: '愿你永远有一颗童心'
  },

  '7-1': {
    name: '建党节',
    shortName: '建党节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '纪念中国共产党成立的重要日子，承载历史与信念。',
  },

  '8-1': {
    name: '建军节',
    shortName: '建军节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '致敬人民军队，守护国家与和平的力量。',
  },

  '9-10': {
    name: '教师节',
    shortName: '教师节',
    type: 'common',
    color: 'orange',
    category: 'commemorate',
    description: '感谢师恩，致敬每一位照亮他人前路的人。',
    quote: '一日为师，终身难忘'
  },

  '10-1': {
    name: '国庆节',
    shortName: '国庆',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '国家成立纪念日，举国同庆，见证时代发展。',
    quote: '山河无恙，家国安宁'
  },

  '12-24': {
    name: '平安夜',
    shortName: '平安夜',
    type: 'common',
    color: 'pink',
    category: 'commemorate',
    description: '温馨宁静的一夜，传递祝福与陪伴的时刻。',
    quote: '愿你平安喜乐'
  },

  '12-25': {
    name: '圣诞节',
    shortName: '圣诞',
    type: 'common',
    color: 'pink',
    category: 'commemorate',
    description: '充满温暖与祝福的节日，象征爱、给予与希望。',
    quote: '世界因爱而温暖'
  }
};
// ===== 农历节日（需要转换） =====
// ===== 农历节日（需要转换） =====
const lunarFestivals = {
  '1-1': {
    name: '春节',
    shortName: '春节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    weight: 5,
    description: '农历新年，一年之始。辞旧迎新，阖家团圆，祈愿来年平安顺遂。'
  },

  '1-15': {
    name: '元宵节',
    shortName: '元宵',
    type: 'traditional',
    color: 'red',
    category: 'holiday',
    weight: 3,
    description: '正月十五，张灯结彩，赏灯吃元宵，象征团圆美满与光明希望。'
  },

  '2-2': {
    name: '龙抬头',
    shortName: '龙抬头',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 2,
    description: '二月二龙抬头，象征万物复苏。民间有理发、祭龙、祈求风调雨顺的习俗。'
  },

  '5-5': {
    name: '端午节',
    shortName: '端午',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    weight: 4,
    description: '纪念屈原，赛龙舟、吃粽子、挂艾草，寓意驱邪避疫、安康顺遂。'
  },

  '7-7': {
    name: '七夕',
    shortName: '七夕',
    type: 'traditional',
    color: 'pink',
    category: 'commemorate',
    weight: 3,
    description: '牛郎织女相会之日，中国传统情人节，象征爱情与美好相守。'
  },

  '7-15': {
    name: '中元节',
    shortName: '中元',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 2,
    description: '祭祖追思之日，民间称鬼节。慎终追远，表达对先人的缅怀与敬意。'
  },

  '8-15': {
    name: '中秋节',
    shortName: '中秋',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    weight: 5,
    description: '月圆人团圆之夜，赏月吃月饼，寄托思念与团聚之情。'
  },

  '9-9': {
    name: '重阳节',
    shortName: '重阳',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 3,
    description: '登高望远、敬老孝亲之日。九九重阳，寓意长寿与吉祥。'
  },

  '12-8': {
    name: '腊八节',
    shortName: '腊八',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 3,
    description: '喝腊八粥，寓意丰收与团圆。亦与佛陀成道日相关，象征觉悟与积福。'
  },

  '12-23': {
    name: '小年',
    shortName: '小年',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 2,
    description: '祭灶神、扫尘迎新，为春节做准备，寓意辞旧迎新、家宅清净。'
  },

  '12-30': {
    name: '除夕',
    shortName: '除夕',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    weight: 5,
    description: '岁末之夜，守岁团圆，辞旧迎新，迎接新一年的开始。'
  }
};

// ===== 佛教纪念日（农历） =====
const buddhistFestivals = {
  // ===== 正月 =====
  '1-1': {
    name: '弥勒菩萨圣诞',
    shortName: '弥勒菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '弥勒菩萨圣诞，又称布袋和尚纪念日。弥勒菩萨代表慈悲与宽容，笑口常开。'
  },
  '1-6': {
    name: '定光佛圣诞',
    shortName: '定光佛诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '定光佛（燃灯古佛之前一佛）圣诞，象征光明与智慧。'
  },

  // ===== 二月 =====
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
    name: '释迦牟尼佛涅槃纪念日',
    shortName: '佛陀涅槃日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念佛陀最后的教诲：当自求解脱，以智慧为灯。',
    quote: '光在心中，路在脚下'
  },
  '2-19': {
    name: '观世音菩萨圣诞日',
    shortName: '观音诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '大慈大悲观世音菩萨圣诞，闻声救苦，有求必应。民间最广受崇敬的菩萨之一。',
    quote: '千处祈求千处应，苦海常作渡人舟'
  },
  '2-21': {
    name: '普贤菩萨圣诞日',
    shortName: '普贤菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '大行普贤菩萨圣诞，象征实践与愿力，十大愿王导归极乐。',
    quote: '愿以此功德，庄严佛净土'
  },

  // ===== 三月 =====
  '3-3': {
    name: '六祖慧能大师圣诞',
    shortName: '六祖诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '禅宗六祖惠能大师圣诞，"菩提本无树，明镜亦非台"，禅宗集大成者。'
  },
  '3-16': {
    name: '准提菩萨圣诞日',
    shortName: '准提菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '准提佛母/准提菩萨圣诞，显密圆通，满众生愿，消灾延寿。'
  },
  '3-23': {
    name: '妈祖圣诞',
    shortName: '妈祖诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '妈祖（天后圣母）圣诞，海上保护神，慈悲护佑航海之人。'
  },

  // ===== 四月 =====
  '4-4': {
    name: '文殊菩萨圣诞',
    shortName: '文殊菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '大智文殊师利菩萨圣诞，七佛之师，诸佛之母，象征无上智慧。',
    quote: '智慧如灯，照亮前路'
  },
  '4-8': {
    name: '释迦牟尼佛圣诞（浴佛节）',
    shortName: '佛诞日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    weight: 5,
    description: '释迦牟尼佛诞生于蓝毗尼园，九龙吐水沐浴太子。佛教最重要的节日之一。',
    quote: '愿你心中有光'
  },
  '4-15': {
    name: '佛吉祥日（卫塞节）',
    shortName: '卫塞节',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    weight: 5,
    description: '同时纪念佛陀的诞生、成道与涅槃，联合国认可的国际佛教节日。',
    quote: '觉知此刻，便是永恒'
  },
  '4-17': {
    name: '金粟如来（维摩诘居士）圣诞',
    shortName: '维摩诘圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '维摩诘居士（金粟如来化身）圣诞，示现在家修行的典范，不二法门。'
  },
  '4-28': {
    name: '药王菩萨圣诞',
    shortName: '药王菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '药王菩萨圣诞，施医赠药，救度众生身心之苦。'
  },

  // ===== 五月 =====
  '5-5': {
    name: '目连尊者（盂兰盆会）',
    shortName: '目连孝亲日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念目连尊者救母之孝心，提醒世人报答父母恩德。'
  },
  '5-13': {
    name: '伽蓝菩萨圣诞',
    shortName: '伽蓝菩萨诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '伽蓝菩萨（关圣帝君/关公）圣诞，佛教护法神，忠义勇武的象征。'
  },

  // ===== 六月 =====
  '6-3': {
    name: '韦驮菩萨圣诞',
    shortName: '韦驮菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '韦驮尊天菩萨圣诞，佛教护法神，守护寺院三宝，护持修行人。'
  },
  '6-10': {
    name: '济公活佛（道济禅师）纪念日',
    shortName: '济公活佛纪念日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '济公活佛（道济禅师）圆寂纪念日。不守戒律而心怀慈悲，扶危济困，游戏人间。',
    quote: '酒肉穿肠过，佛祖心中留'
  },
  '6-18': {
    name: '寒山拾得和合二仙圣诞',
    shortName: '和合二仙诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '寒山、拾得二位大士圣诞，象征和谐美满，主婚姻姻缘。'
  },
  '6-19': {
    name: '观世音菩萨成道日',
    shortName: '观音成道日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '观世音菩萨修证菩提，成就无上正等正觉之日。',
    quote: '慈悲不是软弱，是力量'
  },

  // ===== 七月 =====
  '7-7': {
    name: '龙树菩萨圣诞 / 骑龙观音成道',
    shortName: '龙树菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '龙树菩萨（八宗共祖）圣诞，大乘佛教中观学派创始人，空性智慧的阐扬者。'
  },
  '7-13': {
    name: '大势至菩萨圣诞',
    shortName: '大势至菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '大势至菩萨圣诞，以智慧之光摄受众生，西方三圣之一。',
    quote: '光明总在不远处'
  },
  '7-15': {
    name: '盂兰盆节（佛欢喜日）',
    shortName: '盂兰盆节',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    weight: 4,
    description: '目连救母之日，也是僧众自恣结束、诸佛欢喜的日子。供僧报恩，超度先亡。',
    quote: '记得那些来处'
  },
  '7-21': {
    name: '普庵祖师圣诞',
    shortName: '普庵祖师诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '普庵祖师（普庵印肃禅师）圣诞，创普庵咒，驱邪护正，利益众生。'
  },
  '7-30': {
    name: '地藏王菩萨圣诞',
    shortName: '地藏菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '地藏菩萨圣诞，誓愿"地狱不空，誓不成佛"，无尽慈悲与坚持的代表。',
    quote: '愿力所至，金石为开'
  },

  // ===== 八月 =====
  '8-15': {
    name: '月光菩萨圣诞 / 中秋节',
    shortName: '月光菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '月光菩萨圣诞，象征清凉与光明，与中秋赏月习俗相融合。'
  },
  '8-22': {
    name: '燃灯佛圣诞',
    shortName: '燃灯佛诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '燃灯佛（过去庄严劫千佛之一）圣诞，曾授记释迦牟尼佛未来成佛。',
    quote: '点亮自己，也照亮别人'
  },
  '8-24': {
    name: '龙五爷财神圣诞',
    shortName: '龙五爷诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '广济龙王菩萨（五台山龙五爷）圣诞，广受信众供奉，有求必应。'
  },

  // ===== 九月 =====
  '9-9': {
    name: '药师琉璃光如来圣诞 / 重阳节',
    shortName: '药师佛诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '东方净琉璃世界教主药师佛圣诞，能除一切苦，消灾延寿。',
    quote: '身心安顿，万物皆春'
  },
  '9-12': {
    name: '飞天女神（飞天菩萨）吉祥日',
    shortName: '飞天吉日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念敦煌壁画中的飞天菩萨，象征自由、美好与艺术之美。'
  },
  '9-16': {
    name: '弘一法师（李叔同）纪念日',
    shortName: '弘一法师纪念日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '弘一法师（李叔同）圆寂纪念日。"悲欣交集"，一代高僧的艺术人生。'
  },
  '9-19': {
    name: '观世音菩萨出家日',
    shortName: '观音出家日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '观世音菩萨出家修道之日，象征放下世俗、追寻觉悟。',
    quote: '放下，是为了更好地前行'
  },
  '9-23': {
    name: '虚空藏菩萨圣诞',
    shortName: '虚空藏菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '虚空藏菩萨圣诞，福德与智慧无量如虚空，主财宝与记忆。'
  },
  '9-30': {
    name: '药师琉璃光如来涅盘日',
    shortName: '药师佛涅盘日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '药师佛示现涅盘之日，提醒众生珍惜佛法，精进修行。'
  },

  // ===== 十月 =====
  '10-5': {
    name: '达摩祖师圣诞',
    shortName: '达摩祖师诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '禅宗初祖达摩祖师圣诞，面壁九年，传法东土，开创中国禅宗。'
  },
  '10-20': {
    name: '文殊菩萨出家日',
    shortName: '文殊菩萨出家日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '文殊菩萨出家修道之日，舍离家业，追求无上智慧。'
  },

  // ===== 十一月 =====
  '11-3': {
    name: '阿弥陀佛圣诞（另一说）',
    shortName: '阿弥陀佛诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '西方极乐世界教主阿弥陀佛圣诞（部分传承），代表无量光、无量寿。'
  },
  '11-11': {
    name: '日光菩萨圣诞',
    shortName: '日光菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '日光菩萨圣诞，取除日轮暗暝之义，与月光菩萨同为药师佛左右胁侍。'
  },
  '11-14': {
    name: '慧能大师（六祖）圆寂日',
    shortName: '六祖圆寂日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '禅宗六祖惠能大师圆寂纪念日，"本来无一物，何处惹尘埃"。'
  },
  '11-17': {
    name: '阿弥陀佛圣诞',
    shortName: '阿弥陀佛诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '西方极乐世界教主阿弥陀佛圣诞，四十八愿度众生，念佛往生西方。',
    quote: '愿力所至，无所不及'
  },
  '11-19': {
    name: '日光菩萨圣诞（另一说）/ 日光如来纪念日',
    shortName: '日光菩萨',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '日光菩萨圣诞，太阳般的光明遍照一切处，破除黑暗无明。'
  },

  // ===== 十二月 =====
  '12-8': {
    name: '腊八节（释迦牟尼佛成道日）',
    shortName: '腊八·佛陀成道日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    weight: 4,
    description: '释迦牟尼佛于菩提树下悟道成佛之日。喝腊八粥的习俗由此而来，寓意觉悟与滋养。',
    quote: '慢一点，生活会更清楚'
  },
  '12-11': {
    name: '大兴善寺（唐密祖庭）护法日',
    shortName: '唐密护法日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念唐密祖庭大兴善寺诸位护法菩萨，祈请加持护佑。'
  },
  '12-20': {
    name: '鲁班先师（工匠祖师）圣诞',
    shortName: '鲁班诞辰',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '鲁班先师（公输班）圣诞，被奉为工匠祖师，亦为佛教护法之一。'
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
