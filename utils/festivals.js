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
    description: '忘记昨天、忘记明天，牢牢地把握住今天，这才是我们拥有的唯一财富。',
    quote: '把握当下、稳住今天，你就是再造生命'
  },

  '2-14': {
    name: '情人节',
    shortName: '情人节',
    type: 'common',
    color: 'pink',
    category: 'commemorate',
    description: '珍惜今天的因缘，真正的感情是靠精神上的相互鼓励与帮助。',
    quote: '珍惜现在的拥有，你才不会拥有明天的后悔'
  },

  '3-8': {
    name: '妇女节',
    shortName: '妇女节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '在世间付出慈悲的女性是伟大的，应当给予她们充分的尊重与理解。',
    quote: '慈悲的人健康，宽容的人有福'
  },

  '3-12': {
    name: '植树节',
    shortName: '植树节',
    type: 'legal',
    color: 'green',
    category: 'holiday',
    description: '只有种下一颗种子，才能收获一棵大树；人间的很多事情不需要轰轰烈烈，照样能长大结果。',
    quote: '小小的一个善念，一定会引出一大片善果'
  },

  '4-1': {
    name: '愚人节',
    shortName: '愚人节',
    type: 'common',
    color: 'gray',
    category: 'other',
    description: '人生如梦一场，不要被虚幻的执着所迷惑，要懂得借假修真。',
    quote: '看穿这个梦幻世界，才能得到真正的解脱'
  },

  '5-1': {
    name: '劳动节',
    shortName: '劳动节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '成功靠的是机会加上勤奋努力，每一步踏实的耕耘都是价值千金的积累。',
    quote: '只管耕耘，不问收获，你一定会有收获到来'
  },

  '5-4': {
    name: '青年节',
    shortName: '青年节',
    type: 'legal',
    color: 'blue',
    category: 'holiday',
    description: '不要虚度年华与青春，要确立人生的正向目标，才不会被外在现象所迷惑。',
    quote: '人的一生正朝着什么方向前进，才是最重要的'
  },

  '6-1': {
    name: '儿童节',
    shortName: '儿童节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '培养孩子最重要的是种下善良的根基，启发他们的本性良心。',
    quote: '从小种下菩提种子，将来不可限量'
  },

  '7-1': {
    name: '建党节',
    shortName: '建党节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '爱国爱民、遵纪守法是做人的根本，只有国家安定才有个人平安。',
    quote: '心底无私天地宽，顶天立地浩然正气'
  },

  '8-1': {
    name: '建军节',
    shortName: '建军节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '军人的坚强来自磨练，人要学会在逆境中成长，做一个敢于担当的人。',
    quote: '忍辱与定力是开启智慧的源泉'
  },

  '9-10': {
    name: '教师节',
    shortName: '教师节',
    type: 'common',
    color: 'orange',
    category: 'commemorate',
    description: '要尊敬老师并敬师重道，良师的指导如明灯，照亮我们前行的道路。',
    quote: '时间是最好的榜样，要在有限的生命里领悟真谛'
  },

  '10-1': {
    name: '国庆节',
    shortName: '国庆',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    description: '愿人心向善，世界更和平、人民更幸福。',
    quote: '拥有正能量与阳光，创造美好的人生'
  },

  '12-24': {
    name: '平安夜',
    shortName: '平安夜',
    type: 'common',
    color: 'pink',
    category: 'commemorate',
    description: '平安就是福，知足就是寿，能过好每一个简单的今天就是幸运。',
    quote: '把每天的平安串起来，串成一生的幸福'
  },

  '12-25': {
    name: '圣诞节',
    shortName: '圣诞',
    type: 'common',
    color: 'pink',
    category: 'commemorate',
    description: '在这个世界上，慈悲的爱是经得起时间考验的，它能温暖干枯的心灵。',
    quote: '善良的心就是黄金，能帮助我们拥有幸福'
  }
};

// ===== 农历节日（需要转换） =====
const lunarFestivals = {
  '1-1': {
    name: '春节',
    shortName: '春节',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    weight: 5,
    description: '大年初一最重要的就是“去旧迎新”，要开心、多说好话。这是一个重新开始的机会，要把过去不好的习惯全部去除，做一个崭新的自己。',
    quote: '从今天开始做一个新人，把过去不好的习惯全部都要去除'
  },

  '1-15': {
    name: '元宵节',
    shortName: '元宵',
    type: 'traditional',
    color: 'red',
    category: 'holiday',
    weight: 3,
    description: '元宵节讲究天地人大团圆，气场合在一起，各方面就会顺利很多。圆代表团圆与圆润，旨在通过这个圆满的日子，让生活更加圆融。',
    quote: '天地人合一，气场合在一起，各方面就会顺利很多'
  },

  '2-2': {
    name: '龙抬头',
    shortName: '龙抬头',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 2,
    description: '龙抬头象征着万物复苏与新的希望。我们要学会珍惜时间与每一段因缘，让自己的心慢慢适合这个世界，在变化中不断成长。',
    quote: '新的一年，我们要学会珍惜时间、珍惜缘分'
  },

    '5-5': {
    name: '端午节',
    shortName: '端午',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    weight: 4,
    description: '端午是一个缅怀与思念的特殊日子，应以静心和自律为本，通过自律来保护自己的元气与正能量。',
    quote: '节制欲望，恢复礼法，不仅是对天地的敬意，也是传统文明的延续'
  },

  '7-7': {
    name: '七夕',
    shortName: '七夕',
    type: 'traditional',
    color: 'pink',
    category: 'commemorate',
    weight: 3,
    description: '人间的真情在于珍惜，珍惜今天的因缘，就会拥有人间更多的慈悲爱。最好的浪漫是彼此在精神上的相互鼓励与帮助，从而爱得更深。',
    quote: '珍惜今天的因缘，珍惜人间所有的爱'
  },

  '7-15': {
    name: '中元节',
    shortName: '中元',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 2,
    description: '这是一个敬拜祭奠祖先的关键时刻。在这一天应多做功德和善事，保持肃穆，用感恩的心来化解过去的冤结。',
    quote: '感恩每一个陪伴你度过每一段旅程的人'
  },

  '8-15': {
    name: '中秋节',
    shortName: '中秋',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    weight: 5,
    description: '中秋是追求心灵圆满的日子，应利用这个吉祥日化解心中的烦恼，让心灵更美丽。珍惜现在的拥有，你才不会拥有明天的后悔。',
    quote: '中秋节是团圆的日子，心要圆'
  },

  '9-9': {
    name: '重阳节',
    shortName: '重阳',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 3,
    description: '重阳是尊师重道、孝顺长辈的日子，登高象征着境界的提高与转运。九九寓意长寿，这一天多行善事能为长辈积福积德。',
    quote: '重阳节登高就是“步步高升”，希望让我们转运，越来越好'
  },

  '12-8': {
    name: '腊八节',
    shortName: '腊八节',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 3,
    description: '腊八节是中国传统节日，也被视为释迦牟尼佛成道纪念日，缅怀他为人间带来智慧，让我们离苦得乐。',
    quote: '觉悟人生，才能拥有真正的智慧生活'
  },

  '12-23': {
    name: '小年',
    shortName: '小年',
    type: 'traditional',
    color: 'gold',
    category: 'traditional',
    weight: 2,
    description: '小年是除尘迎新的开始，旨在扫除家宅与内心的灰尘。要学会放下过去的负担，为新一年的生命再造做好准备。',
    quote: '把握当下、稳住今天，你就是再造生命'
  },

  '12-30': {
    name: '除夕',
    shortName: '除夕',
    type: 'legal',
    color: 'red',
    category: 'holiday',
    weight: 5,
    description: '除夕要守岁，守得越长，长辈越长寿。这也是除旧的关键时刻，要除掉过去不好的习惯、恨心与贪心，让心彻底清净。',
    quote: '除夕就是把过去的要除掉，不好的习惯、恨心、贪心全部都要去除'
  }
};


const buddhistFestivals = {
  // ===== 正月 =====
  '1-1': {
    name: '弥勒菩萨圣诞',
    shortName: '弥勒圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '这一天象征着乐观与大度，提醒我们要拥有一颗能容纳天下的心，用笑声去化解人间的苦难。',
    quote: '大肚能容，容天下难容之事；乐观的心态是战胜困难的第一步'
  },
  '1-6': {
    name: '定光佛圣诞',
    shortName: '定光佛圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '象征着照亮黑暗的永恒智慧。只有点亮内心的明灯，才能在无常的人间寻找到正确的方向。',
    quote: '一灯能破千年暗，一智能灭万年愚'
  },

  // ===== 二月 =====
  '2-8': {
    name: '释迦牟尼佛出家日',
    shortName: '出家日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '佛陀有感于人世生老病死与无常苦恼，舍弃王位与优裕生活，发心寻求离苦之道，最终成就无上正等正觉。',
    quote: '学习佛陀的智慧与慈悲，增长善念、利益众生。'
  },
  '2-15': {
    name: '释迦牟尼佛涅槃纪念日',
    shortName: '涅槃日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '缅怀伟大的觉者示现色身的消逝。肉体虽会灭度，但慈悲的精神将永留于无尽的时间与无限的空间中。',
    quote: '无常是世界的实相，只有如如不动的本性才能看到真实的生命'
  },
  '2-19': {
    name: '观世音菩萨圣诞日',
    shortName: '观音诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念大慈大悲的化身，她以最纯洁的心灵救度众生，闻声救苦，是人间慈悲与关爱的最高榜样。',
    quote: '恒常的慈悲心可以化解人间一切苦厄，慈悲能化解一切冤结'
  },
  '2-21': {
    name: '普贤菩萨圣诞日',
    shortName: '普贤圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '象征着伟大的实践与行愿。只有将善良的愿望落实在持久的行为中，才能修成正觉。',
    quote: '坚持就是加温，修行靠的是持久的力量，每一念都要契合本性'
  },

  // ===== 三月 =====
  '3-3': {
    name: '六祖慧能大师圣诞',
    shortName: '六祖圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念禅学的集大成者，他教导我们要洞悉本性的清净。当心中无物，外界的纷扰便无法染著我们的灵魂。',
    quote: '本来无一物，何处惹尘埃；自性自悟，明心见性'
  },
  '3-16': {
    name: '准提菩萨圣诞日',
    shortName: '准提圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '这一天象征着满众生愿与消灾延寿。心诚则灵，用智慧去化解生活中的各种阻碍。',
    quote: '心静则自然灵，用智慧来改变命运，用恒心来解脱烦恼'
  },
  '3-23': {
    name: '妈祖圣诞',
    shortName: '妈祖圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '作为慈悲护佑的象征，提醒我们要像保护生命一样保护内心的善良，在风雨人生中彼此扶持。',
    quote: '善良的心就是黄金，能帮助我们在逆境中创造奇迹'
  },

  // ===== 四月 =====
  '4-4': {
    name: '文殊菩萨圣诞',
    shortName: '文殊圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '大智的化身，象征着能够看破虚幻、斩断愚痴的无上智慧。',
    quote: '智慧如一盏明灯，在无常中找到解脱，在黑暗中找到光明'
  },
  '4-8': {
    name: '释迦牟尼佛圣诞',
    shortName: '浴佛节',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    weight: 5,
    description: '伟大的觉者降临人间，为众生带来离苦得乐的真理。这一天我们要洗涤内心的污垢，显现光明的本性。',
    quote: '外表的肮脏容易洗净，内心的污垢需要用智慧来改善'
  },
  '4-15': {
    name: '佛吉祥日',
    shortName: '卫塞节',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    weight: 5,
    description: '在这圆满的时刻，纪念诞生、觉悟与圆寂。觉知当下的真实，便是寻得了永恒的安宁。',
    quote: '把握当下、稳住今天，你就是在再造生命'
  },
  '4-17': {
    name: '维摩诘居士圣诞',
    shortName: '维摩诘圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '示现在家修行的典范。修行就在生活的点滴细节中，心不随境转。',
    quote: '心如镜明如水，入世间救度众生而不染尘缘罣碍'
  },
  '4-28': {
    name: '药王菩萨圣诞',
    shortName: '药王圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '象征着对身心疾苦的医治。宁静是补药，可以弥补人类的痛苦；智慧是良药，可以医治烦恼。',
    quote: '心恶则百病，生只有健康的心灵，才会拥有健康的身体。 '
  },

  // ===== 五月 =====
  '5-13': {
    name: '伽蓝菩萨圣诞',
    shortName: '伽蓝圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '正义与忠诚的守护者，提醒我们要拥有一身浩然正气，坚守正道，莫做表里不一的人。',
    quote: '心底无私天地宽，顶天立地浩然气；真修实修莫做假好人'
  },

 // ===== 六月 =====
  '6-3': {
    name: '韦驮尊天圣诞',
    shortName: '韦驮圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '这一天象征着正直与护持。提醒我们要拥有一身浩然正气，坚守正道，保护每一份精进修行的善念。',
    quote: '心底无私天地宽，顶天立地浩然气'
  },
  '6-10': {
    name: '济公活佛纪念日',
    shortName: '觉者纪念日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念一位游戏人间、惩恶扬善的智者。他教导我们看穿这个梦幻世界，在虚幻的尘世中借假修真，寻找真实的自性。',
    quote: '看穿这个梦幻世界，才能得到真正的解脱'
  },
  '6-19': {
    name: '观世音菩萨成道日',
    shortName: '观音成道日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '这是一个圆满的觉悟时刻。慈悲不是软弱，而是一种能化解冤结、度过一切苦厄的崇高能量。',
    quote: '恒常的慈悲心，可以化解人间一切苦厄'
  },

  // ===== 七月 =====
  '7-13': {
    name: '大势至菩萨圣诞',
    shortName: '大势至圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '象征着永不退转的意志与智慧之光。只有通过持久的努力与不断的自我修正，才能在无常中寻得永恒的安宁。',
    quote: '精进就是不停地烧水，火一直开着水才会开'
  },
  '7-15': {
    name: '盂兰盆节',
    shortName: '盂兰节',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    weight: 4,
    description: '这是一个感恩与缅怀的季节。教导我们记住善缘的来处，用感恩的心去化解过去的冤结，利益每一位曾经陪伴过我们的生命。',
    quote: '感恩是生命最美的姿态，它是滋养心灵的莲花'
  },
  '7-21': {
    name: '普庵师祖圣诞',
    shortName: '普庵圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '这一天象征着驱邪护正与内心的清净。提醒我们要时时守护身口意，不让外在的尘埃染著我们的本性。',
    quote: '静坐常思己过，闲谈莫论人非'
  },
  '7-24': {
    name: '龙树尊者圣诞',
    shortName: '龙树圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念空性智慧的阐扬者。他教导我们要洞悉宇宙的实相，从根本上破除无明，获得心灵的自由。',
    quote: '有了正见，才能看开世界上的一切'
  },
  '7-30': {
    name: '地藏菩萨圣诞日',
    shortName: '地藏诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念无尽誓愿的化身。教导我们要拥有一颗心系众生的悲悯之心，用坚强的愿力去逾越生命中重重罪孽的山峦。',
    quote: '愿力所至，坚强的信念能创造生命的奇迹'
  },

  // ===== 八月 =====
    '8-3': {
    name: '慧能大师圆寂纪念日',
    shortName: '六祖圆寂日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '缅怀这位洞悉本性清净的觉者。他教导我们，万物皆由心造，只有净化心灵，才能得到真实的自在。',
    quote: '本来无一物，何处惹尘埃；心净则国土净'
  },
  '8-15': {
    name: '月光菩萨圣诞',
    shortName: '中秋圆满日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '在这月圆时刻，追求心灵的圆满与和谐。提醒我们要利用这个吉祥日化解心中的烦恼，让本性像明月般清净光明。',
    quote: '中秋是表达思念的团圆节日，身若不能与家人同聚，心中也要有亲人'
  },
  '8-22': {
    name: '燃灯古佛圣诞',
    shortName: '燃灯佛诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '象征着能够照亮过去与未来的永恒智慧。只有点燃内心的心灯，才能在黑暗中看到前行的方向。',
    quote: '一灯能破千年暗，一智能灭万年愚'
  },


 // ===== 九月 =====
    '9-9': {
    name: '重阳节',
    shortName: '重阳节',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '这是一个敬老、登高并传播慈悲精神的日子。在这个时刻可以祈请大加持，清除内心的污垢，通过慈悲心度过人间一切苦厄。',
    quote: '心底无私天地宽，慈悲能化解一切冤结'
  },

  '9-19': {
    name: '观世音菩萨出家日',
    shortName: '观音出家日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '这是一个伟大的发心日，象征着舍去小我、舍去自身的人间利益，为了救度众生而提升境界的崇高时刻。',
    quote: '放下自身的小爱，成就人间的大爱；榜样的力量是无穷的'
  },


  '9-30': {
    name: '药师琉璃光如来圣诞日',
    shortName: '药师佛圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '这是一个通过内省来清除内心污垢、积聚正向能量的日子，通过忏悔过去来积聚光明，抵御外界的负能量。',
    quote: '心中长存正等正觉的菩提心，方能断除我见，去除我相'
  },

  // ===== 十月 =====
  '10-5': {
    name: '达摩祖师圣诞',
    shortName: '达摩圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '纪念禅宗的开创者。他教导我们要在寂静中观心，通过修正生命的行为和思维，找回原本清净的自性。',
    quote: '一生修行，一世改变；一朝开悟，永断轮回'
  },

  // ===== 十一月 =====

  '11-11': {
    name: '日光尊者圣诞',
    shortName: '日光圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '象征着能够破除一切黑暗与无明的太阳之光。要在正信正念中活着，感受生命中那份永恒的温暖。',
    quote: '阳光照到哪里，哪里会亮；心中有太阳，乌云终会散去'
  },

   '11-17': {
    name: '阿弥陀佛圣诞',
    shortName: '弥陀诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '这是一个关于永恒生命与深厚愿力的日子。通过大愿力来消掉自身的业障，寻求精神上的彻底解脱。',
    quote: '只要有愿力，只要肯付出，就一定能得到收获'
  },
  '11-19': {
    name: '日光菩萨圣诞日',
    shortName: '日光菩萨圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '心中有光明，你就拥有了光明心。要把人生的每一次考验都看作是提升境界的机会，让本性在光芒中升华。',
    quote: '珍惜现在的拥有，利用有限的生命去完成无限的真谛'
  },

  // ===== 十二月 =====
  '12-8': {
    name: '腊八节 / 伟大导师成道日',
    shortName: '成道日',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    weight: 4,
    description: '伟大的觉者在这个日子里豁然大悟，认识了痛苦的根源。在这一天行善、诵经、布施，功德比平时多出百千倍，消业非常迅猛。',
    quote: '觉悟人生，才能拥有真正的智慧生活；慢一点，心才更清楚'
  },
   '12-29': {
    name: '华严菩萨圣诞',
    shortName: '华严圣诞',
    type: 'buddhist',
    color: 'purple',
    category: 'buddhist',
    description: '通过觉察每一个微小的念头，我们可以领悟“一花一世界”的真谛，在寂静的修行中洗涤心灵的尘埃，从而获得真正的觉悟与自在 。',
    quote: '智入三世，悉皆平等；于微细中见广大，从一念中觉本性'
  },
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
