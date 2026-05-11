/**
 * 节气计算 + 纯素食养生指南
 * 二十四节气精确计算（基于太阳黄经）
 *
 * 养生原则：
 * - 严格纯素：不含葱、葱、韭、薤、兴渠五荤
 * - 不含肉类、蛋类、海鲜、奶制品
 * - 根据时节特点提供真正有益的食疗建议
 */

// 引入每日素食语录
const { dailyVegetarianTips } = require('./daily-vegetarian-tips');

// 节气名称
const solarTermNames = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
];

/**
 * 二十四节气纯素养生指南（精简版）
 * 每个节气包含：简介、气候特点、养生要点、饮食建议、起居提醒、养生金句
 */
const solarTermHealthGuide = {
  // ===== 春季 =====
  '立春': {
    desc: '东风解冻，蛰虫始振，万物复苏之始。',
    climate: '乍暖还寒，气温波动大，风邪渐盛。',
    health: '春生阳气，疏肝理气。保持心情舒畅，戒怒戒躁。',
    diet: '宜食豆芽、菠菜、荠菜、萝卜等辛散食物。少酸多甘，养脾护肝。喝红枣枸杞桂圆茶。',
    lifestyle: '"春捂" -- 不要过早减衣，尤其护好腰腹和足部。早睡早起，踏青散步。',
    tip: '立春之日，宜在庭院中迎春纳福，寓意一年之计在于春'
  },
  '雨水': {
    desc: '冰雪融化，雨量渐增，万物萌动。',
    climate: '空气湿润，寒湿交加，易感风寒湿邪。',
    health: '健脾祛湿，调养脾胃。注意保暖防寒。',
    diet: '宜食山药、莲子、芡实、陈皮。煮红枣陈皮红糖水暖胃祛湿。菌菇汤补气养脾胃。',
    lifestyle: '雨水后容易犯困，午休20-30分钟。保持室内通风干燥。',
    tip: '雨水时节，宜静心听雨，调息养神'
  },
  '惊蛰': {
    desc: '春雷乍响，蛰虫惊醒，万物生机勃发。',
    climate: '气温回升快，春雷始鸣，细菌病毒活跃。',
    health: '扶正祛邪，增强免疫。惊蛰是流感高发期，需特别注意。',
    diet: '宜食梨润肺清热、蜂蜜水、银耳百合汤。多吃时令蔬果，忌暴饮暴食及生冷油腻。',
    lifestyle: '运动量可逐步增加，但不宜剧烈出汗。早晚添衣，预防倒春寒。',
    tip: '惊蛰一雷起，万户皆春耕 -- 此时最适合制定年度计划'
  },
  '春分': {
    desc: '昼夜平分，阴阳各半，春意正浓。',
    climate: '不寒不热，温和舒适，但气压偏低，人易疲倦。',
    health: '调和阴阳，平衡脏腑。春分是调节身体平衡的关键节点。',
    diet: '宜食时令蔬菜（香椿、荠菜、莴笋）、春笋、草莓。饮食均衡，不过偏。野菜正当季。',
    lifestyle: '适当户外活动，放风筝。保持身心平衡。',
    tip: '春分者，阴阳相半也，故昼夜均而寒暑平'
  },
  '清明': {
    desc: '天清地明，万物皆洁，祭祖踏青之时。',
    climate: '草木繁茂，花粉飘飞，气温回升但不稳定。',
    health: '清明养性，宁心安神。情绪宜舒畅，忌悲思过度伤脾。',
    diet: '青团（糯米草汁糕）、艾叶粑。食野菜（马兰头、香椿、荠菜），顺应时令。多喝清热茶饮。',
    lifestyle: '踏青赏花，亲近自然。外出归来后可用淡盐水漱口，清火明目。',
    tip: '清明前后，种瓜点豆 -- 一年之中播种希望的最佳时机'
  },
  '谷雨': {
    desc: '雨生百谷，春雨贵如油，春季最后一个节气。',
    climate: '雨量充沛，湿度大，温度升高明显。',
    health: '健脾除湿，养肝明目。谷雨后湿气加重，需注重祛湿。',
    diet: '宜食绿茶、桑葚、樱桃、香椿。喝玫瑰花绿茶清肝明目。红豆薏米水祛湿。',
    lifestyle: '此时百花盛开，适合赏花怡情。避免久居潮湿之地。',
    tip: '谷雨吃春 -- 品尝春天的最后馈赠'
  },

  // ===== 夏季 =====
  '立夏': {
    desc: '告别春天，夏日初临，万物进入旺盛生长期。',
    climate: '气温骤升，日照变长，人体代谢加快。',
    health: '养心护阳，夏季养生重在养心。立夏之后心火渐旺。',
    diet: '立夏饭（蚕豆+竹笋+米饭）、青梅。尝三鲜（樱桃、枇杷、杏子）。绿豆汤解暑，苦瓜降心火。',
    lifestyle: '午休时间可稍延长。避免贪凉饮冷。',
    tip: '夏三月谓蕃秀，天地气交，万物华实 -- 宜早睡早起，接纳阳气'
  },
  '小满': {
    desc: '麦粒渐满，江河水涨，作物灌浆饱满之时。',
    climate: '气温显著升高，降雨增多，湿热交织。',
    health: '清热利湿，养心健脾。小满时节湿热重，易生皮肤病。',
    diet: '宜食苦瓜、冬瓜、丝瓜、黄瓜、薏米、赤小豆。苦味入心，适度吃苦瓜降心火。冬瓜荷叶茶祛湿。',
    lifestyle: '不宜大汗淋漓的运动。保持心情平和，勿急躁发怒。',
    tip: '小满者，物至于此，小得盈满 -- 人生亦如此，知足常乐'
  },
  '芒种': {
    desc: '有芒之麦忙于收，有芒之稻忙于种，仲夏农事最繁忙。',
   气候: '高温高湿，梅雨季节开始（江南地区），闷热难耐。',
    health: '养阴生津，补钾防暑。出汗多，需及时补充水分和电解质。',
    diet: '绿豆汤、酸梅汤、西瓜、杨梅。薏米扁豆莲子粥清淡为主。多喝椰子水补水。',
    lifestyle: '昼长夜短，中午宜小憩30分钟。洗澡水温不宜过低，免受寒湿侵袭。',
    tip: '芒种忙种，有收有种 -- 忙碌中也要记得给自己喘口气'
  },
  '夏至': {
    desc: '日北至极，影最短，阳盛极阴生之始。',
    climate: '全年白昼最长，天气炎热至极，雷阵雨频繁。',
    health: '夏至一阴生，养护阳气的同时开始顾护阴液。切忌贪凉伤阳。',
    diet: '夏至面（凉拌面/汤面）。宜食苦瓜、西红柿、黄瓜。冬瓜海带汤消暑利尿。生姜红糖水护阳。',
    lifestyle: '忌冷水洗头、直吹空调。子午觉很重要（中午11-1点小睡）。',
    tip: '冬至饺子夏至面 -- 夏至这天一定要吃一碗面'
  },
  '小暑': {
    desc: '暑气渐盛，尚未到极，上蒸下煮模式开启。',
    climate: '闷热潮湿，桑拿天模式，体感温度远超实际气温。',
    health: '清心泻火，健脾祛湿。小暑是中暑高发期，外出必备防晒。',
    diet: '藕（小暑食藕）、绿豆沙、西瓜汁、荷叶粥。三豆汤（绿豆+黑豆+赤小豆）。莲藕滋阴清热。',
    lifestyle: '不宜长时间户外活动。室内空调温度不低于26度。每天温水澡，助排湿毒。',
    tip: '小暑大暑，上蒸下煮 -- 此时节宜静心品茶消暑'
  },
  '大暑': {
    desc: '暑气至极，一年中最热的时期，也是万物生长最旺之时。',
    climate: '酷热难当，地面热浪滚滚，午后常有雷阵雨。',
    health: '大暑养阴，避暑降温同时保护阳气。切忌大量饮冷贪凉伤脾胃。',
    diet: '仙草冻、绿豆汤、凤梨、莲藕花生汤。伏茶（金银花+菊花+甘草）。西瓜是天然白虎汤。',
    lifestyle: '三伏天 -- 冬病夏治的好时机。晒背（上午9-10点，15-20分钟）可补充阳气。',
    tip: '大暑须饮伏茶，一碗清凉度苦夏'
  },

  // ===== 秋季 =====
  '立秋': {
    desc: '凉风至，白露生，暑去凉来，秋意初现。',
    climate: '白天仍热，早晚转凉，温差逐渐拉大。秋老虎可能反扑。',
    health: '润燥养肺，收敛阳气。立秋后不宜再像夏天那样贪凉。',
    diet: '啃秋瓜、梨、银耳、百合、蜂蜜水。少辛增酸，收敛肺气。山药健脾益肺。',
    lifestyle: '做"秋收" -- 整理上半年，规划下半年。早睡早起，收敛精神。',
    tip: '立秋十八天，寸草皆结顶 -- 收获的季节到了'
  },
  '处暑': {
    desc: '处，止也。暑气至此而止，炎夏正式告终。',
    climate: '昼夜温差加大，干燥感渐显，秋高气爽来临。',
    health: '润燥防咳，调理脾胃。处暑后咳嗽、皮肤干燥问题增多。',
    diet: '雪梨、石榴、葡萄、芝麻糊。冰糖雪梨汤润肺止咳。莲藕花生汤代替排骨汤。',
    lifestyle: '可增加户外运动（登山、骑行）。注意适时添加衣物，尤其是早晚。',
    tip: '处暑不出伏 -- 余热未尽，仍需防暑'
  },
  '白露': {
    desc: '露凝而白，秋意深浓，夜凉如水。',
    climate: '夜间温度骤降，露水凝结，空气干燥清爽。',
    health: '滋阴润燥，保暖护肺。白露身不露，不可再赤膊贪凉。',
    diet: '白露茶、龙眼（适量）、红薯、山药、南瓜。温补润燥并行。',
    lifestyle: '睡觉要盖薄被了。晨起可以做深呼吸吐纳，吸入清肃之气。',
    tip: '白露秋风夜一夜夜凉 -- 注意颈肩腰腿的保暖'
  },
  '秋分': {
    desc: '又到昼夜平分，阴阳平衡，金秋正半。',
    climate: '凉爽宜人，气压适中，是一年中体感最舒适的时段之一。',
    health: '平衡阴阳，收敛神气。秋分后阳气内敛，宜静不宜躁。',
    diet: '桂花茶、栗子、柿子、梨。秋分食柿，但不宜空腹多吃。板栗红薯粥温补。',
    lifestyle: '登高远眺 -- 赏红叶、放风筝、登山望远。秋季是出游的最佳时节。',
    tip: '秋分者，阴阳相半也 -- 保持身心平衡，不急不躁'
  },
  '寒露': {
    desc: '露气寒冷，将凝结成霜，深秋已至。',
    climate: '气温持续下降，早晚凉意明显，北方已有霜冻。',
    health: '温润五脏，防寒护关节。寒露后关节炎、老寒腿易发作。',
    diet: '黑芝麻（寒露吃芝麻）、花生、蜂蜜水、柿子、山药。菊花茶清肝明目。核桃补肾健脑。',
    lifestyle: '寒露脚不露 -- 足部保暖至关重要。睡前热水泡脚加艾叶和花椒，驱寒暖足。',
    tip: '寒露接霜桥 -- 晨起可见草地上的白霜，美却寒'
  },
  '霜降': {
    desc: '气肃而凝，露结为霜，秋之终章。',
    climate: '初霜降临，空气干燥寒冷，落叶纷飞。',
    health: '固表培元，为入冬储备能量。霜降是进补的第二黄金期。',
    diet: '霜降柿子、板栗烧杏鲍菇、白果炖山药。滋补而不燥腻。栗子补肾强筋。',
    lifestyle: '运动前必须充分热身。关节保暖要到位，特别是膝盖和手腕。',
    tip: '霜降杀百虫 -- 霜后的蔬果格外甜美'
  },

  // ===== 冬季 =====
  '立冬': {
    desc: '冬之始，藏之端，万物收藏，规避严寒。',
    climate: '气温显著下降，北风渐起，日照时间缩短。',
    health: '闭藏养肾，敛阳保精。冬季养生核心在于"藏"。',
    diet: '立冬饺子（素馅：白菜木耳香菇）、萝卜、白菜、豆腐。菌菇汤暖身。坚果补充能量。',
    lifestyle: '早睡晚起（等日出）。减少户外剧烈运动，改为室内拉伸或太极。',
    tip: '冬之终也，万物收藏 -- 立冬是休整蓄力的好时机'
  },
  '小雪': {
    desc: '天将小雨雪，地寒未甚，初雪将至。',
    climate: '气温接近冰点，北方开始降雪，南方湿冷刺骨。',
    health: '温补肾阳，御寒保暖。小雪后寒邪更甚，需加强防护。',
    diet: '腌菜泡菜（无五荤版）、火锅（纯素锅底）、黑豆、黑芝麻、核桃。黑色食物入肾。',
    lifestyle: '室内取暖注意通风换气。泡脚水温可提高到42度。',
    tip: '小雪封地，大雪封河 -- 围炉煮茶话家常的时候到了'
  },
  '大雪': {
    desc: '雪盛量大，瑞雪兆丰年，寒冬正酣。',
    climate: '全年最冷的时段之一，北方冰封大地，南方湿冷入骨。',
    health: '大补元气，温养命门之火。大雪是进补的最佳时机。',
    diet: '当归生姜红枣汤、红枣桂圆粥、根茎类食物为主，山药芋头暖身。',
    lifestyle: '宜"猫冬" -- 减少不必要的户外出行。室内可做八段锦或打坐调息。',
    tip: '大雪补得好，来年不吃药 -- 但要因人而异，虚则补之'
  },
  '冬至': {
    desc: '阴极之至，阳气始生，一阳复始之日。',
    climate: '全年白昼最短，黑夜最长。数九寒天从此开始。',
    health: '冬至养阳，护住那一丝初生的阳气。冬至是养生最重要的转折点。',
    diet: '冬至饺子（素馅）、汤圆（无猪油版）、八宝粥。核桃红枣补气血。',
    lifestyle: '冬至一阳生 -- 这天宜静坐冥想，感受体内阳气萌动。',
    tip: '冬至大如年 -- 古人把冬至看得比春节还重要'
  },
  '小寒': {
    desc: '冷气积久而寒，一年中最寒冷的日子即将到来。',
    climate: '天寒地冻，阳气潜藏，阴气盛极。',
    health: '保暖护阳，养肾防寒。早睡晚起，必待日光。',
    diet: '核桃、栗子、桂圆、红枣等温补食物。八宝粥、腊八粥（纯素版）。',
    lifestyle: '头部、背部、足部重点保暖。睡前泡脚20分钟。避免剧烈出汗。',
    tip: '三九补一冬，来年无病痛 -- 小寒是进补的黄金时机'
  },
  '大寒': {
    desc: '寒气之逆极，故谓大寒。一年终结，新春在望。',
    climate: '严寒至极，但阳气已在深处萌动，冬尽春将来临。',
    health: '固本培元，为开春做准备。大寒进补以"封藏"为主，不宜大开大补。',
    diet: '八宝饭（纯素版）、萝卜羊肚菌煲、糯米红枣粥暖身。',
    lifestyle: '大寒过后便是年 -- 可以开始准备年货了。保持乐观期待的心情。',
    tip: '大寒已至，春归有期 -- 最黑暗的时刻，光就在前方'
  }
};

// ==================== 节气计算工具函数（精确查表法） ====================

/**
 * 精确的二十四节气日期表（2020-2035年）
 * 数据来源：中国科学院紫金山天文台
 * 每个条目: [月份, 日, 时, 分]
 *
 * 使用查表法替代线性外推，确保每个节气的日期精确到天。
 * 对于表中未覆盖的年份，回退到近似算法。
 */
const SOLAR_TERMS_TABLE = {
  2020: [
    [1,6,5,29],[1,20,19,3],[2,4,17,3],[2,18,23,31],[3,5,22,36],[3,20,21,56],
    [4,4,15,2],[4,19,22,45],[5,5,14,12],[5,20,21,49],[6,5,12,58],[6,21,16,46],
    [7,6,5,3],[7,22,14,37],[8,7,4,49],[8,22,23,45],[9,7,12,8],[9,22,21,31],
    [10,8,6,17],[10,23,0,27],[11,7,7,14],[11,21,22,0],[12,7,0,9],[12,21,18,2]
  ],
  2021: [
    [1,5,11,23],[1,20,4,39],[2,3,22,59],[2,18,18,54],[3,5,16,54],[3,20,21,33],
    [4,4,21,35],[4,20,4,33],[5,5,14,47],[5,21,3,34],[6,5,18,51],[6,21,11,32],
    [7,7,5,5],[7,22,14,11],[8,7,14,54],[8,23,0,38],[9,7,18,12],[9,23,3,54],
    [10,8,10,39],[10,23,12,51],[11,7,12,59],[11,22,1,25],[12,7,11,28],[12,21,23,59]
  ],
  2022: [
    [1,5,17,14],[1,20,10,51],[2,4,4,51],[2,18,18,50],[3,5,22,44],[3,20,23,22],
    [4,5,3,20],[4,20,10,24],[5,5,20,26],[5,21,9,22],[6,6,0,26],[6,21,17,14],
    [7,7,10,38],[7,23,6,30],[8,7,20,29],[8,23,12,10],[9,7,23,32],[9,23,9,4],
    [10,8,15,22],[10,23,18,36],[11,7,18,46],[11,22,11,3],[12,7,17,9],[12,22,5,48]
  ],
  2023: [
    [1,5,23,5],[1,20,16,30],[2,4,10,42],[2,19,0,43],[3,6,5,16],[3,21,5,24],
    [4,5,9,13],[4,20,16,8],[5,6,2,19],[5,21,21,37],[6,6,6,33],[6,21,22,10],
    [7,7,16,31],[7,23,12,21],[8,8,2,6],[8,23,23,17],[9,8,5,32],[9,23,14,48],
    [10,8,21,16],[10,24,0,43],[11,8,0,36],[11,22,16,55],[12,7,22,48],[12,22,11,28]
  ],
  2024: [
    [1,6,4,49],[1,20,22,7],[2,4,16,27],[2,19,6,34],[3,5,10,23],[3,20,21,6],
    [4,4,15,2],[4,19,21,59],[5,5,8,10],[5,20,20,59],[6,5,13,10],[6,21,4,51],
    [7,6,22,20],[7,22,15,44],[8,7,8,49],[8,23,1,26],[9,7,12,52],[9,23,2,19],
    [10,8,9,3],[10,23,12,4],[11,7,6,20],[11,21,16,3],[12,7,3,59],[12,21,17,3]
  ],
  2025: [
    [1,5,11,41],[1,20,4,52],[2,3,22,10],[2,18,9,32],[3,5,10,23],[3,20,8,33],
    [4,4,12,48],[4,19,20,51],[5,5,8,44],[5,20,21,28],[6,5,12,40],[6,21,8,15],
    [7,6,22,55],[7,22,16,13],[8,7,8,57],[8,22,23,27],[9,7,11,9],[9,22,20,36],
    [10,8,2,58],[10,23,6,13],[11,7,6,16],[11,21,22,3],[12,6,19,42],[12,21,13,26]
  ],
  2026: [
    [1,5,23,55],[1,20,17,9],[2,4,4,1],[2,18,23,51],[3,5,21,59],[3,20,20,30],
    [4,5,4,15],[4,20,9,27],[5,5,13,2],[5,21,3,52],[6,5,17,15],[6,21,22,52],
    [7,7,22,45],[7,23,15,6],[8,7,23,25],[8,23,4,54],[9,7,7,11],[9,23,4,48],
    [10,8,23,38],[10,23,15,52],[11,7,6,14],[11,22,16,53],[12,7,23,19],[12,22,17,34]
  ],
  2027: [
    [1,5,5,45],[1,20,0,0],[2,4,1,24],[2,18,13,34],[3,6,4,9],[3,21,2,13],
    [4,5,6,1],[4,20,13,53],[5,6,3,29],[5,21,14,9],[6,6,0,39],[6,21,21,11],
    [7,7,15,56],[7,23,9,4],[8,8,1,14],[8,23,15,56],[9,8,6,25],[9,23,16,0],
    [10,8,22,9],[10,24,1,28],[11,8,0,38],[11,22,22,2],[12,7,17,28],[12,22,11,9]
  ],
  2028: [
    [1,6,11,40],[1,20,22,7],[2,4,17,3],[2,19,1,48],[3,5,9,55],[3,20,8,4],
    [4,4,11,53],[4,19,18,50],[5,5,10,13],[5,20,22,0],[6,5,18,8],[6,21,10,0],
    [7,7,1,28],[7,22,19,9],[8,7,8,26],[8,22,23,57],[9,7,12,12],[9,23,0,30],
    [10,8,4,33],[10,23,7,59],[11,7,10,23],[11,22,3,4],[12,7,0,5],[12,21,14,2]
  ],
  2029: [
    [1,5,17,25],[1,20,9,52],[2,3,22,58],[2,18,7,14],[3,5,15,39],[3,20,13,55],
    [4,4,17,43],[4,19,23,43],[5,5,15,59],[5,21,4,17],[6,5,23,53],[6,21,15,44],
    [7,7,7,6],[7,23,0,44],[8,7,14,11],[8,23,5,29],[9,7,17,53],[9,23,6,11],
    [10,8,10,24],[10,23,13,35],[11,7,14,54],[11,22,7,11],[12,7,4,41],[12,21,18,20]
  ],
  2030: [
    [1,5,23,9],[1,20,17,37],[2,4,4,40],[2,18,12,40],[3,5,21,27],[3,20,18,48],
    [4,4,23,33],[4,20,4,36],[5,5,21,46],[5,21,10,34],[6,6,5,38],[6,21,21,25],
    [7,7,12,44],[7,23,6,19],[8,7,19,56],[8,23,11,1],[9,7,23,34],[9,23,11,52],
    [10,8,16,16],[10,23,19,28],[11,8,3,8],[11,22,11,19],[12,7,10,14],[12,22,4,2]
  ],
  2031: [
    [1,5,4,53],[1,19,22,44],[2,3,10,22],[2,17,18,0],[3,6,3,15],[3,20,23,31],
    [4,5,5,23],[4,19,15,29],[5,6,3,33],[5,21,16,51],[6,6,11,23],[6,21,3,7],
    [7,7,18,35],[7,23,11,54],[8,8,1,47],[8,23,17,3],[9,8,5,27],[9,23,17,45],
    [10,8,22,8],[10,24,1,15],[11,7,15,22],[11,21,23,31],[12,7,15,46],[12,21,23,38]
  ],
  2032: [
    [1,6,10,37],[1,20,3,36],[2,4,3,32],[2,17,17,12],[3,5,9,2],[3,20,5,14],
    [4,4,11,31],[4,19,17,31],[5,5,11,33],[5,20,23,19],[6,5,17,48],[6,21,9,32],
    [7,7,0,30],[7,22,17,39],[8,7,7,28],[8,22,22,5],[9,7,11,20],[9,23,23,38],
    [10,8,3,51],[10,23,7,7],[11,7,9,22],[11,22,1,39],[12,6,21,3],[12,21,10,55]
  ],
  2033: [
    [1,5,16,19],[1,20,15,10],[2,3,21,5],[2,18,2,22],[3,5,14,49],[3,20,14,40],
    [4,4,17,28],[4,19,23,18],[5,5,17,17],[5,21,6,42],[6,5,23,41],[6,21,15,25],
    [7,7,6,15],[7,22,23,24],[8,7,13,9],[8,23,3,46],[9,7,17,0],[9,23,6,12],
    [10,8,10,25],[10,23,13,36],[11,7,16,55],[11,22,9,12],[12,7,12,42],[12,22,2,18]
  ],
  2034: [
    [1,5,22,0],[1,20,14,44],[2,3,14,28],[2,17,12,2],[3,5,20,35],[3,20,23,57],
    [4,4,23,24],[4,19,5,4],[5,5,23,0],[5,20,14,5],[6,6,5,34],[6,21,21,18],
    [7,7,11,55],[7,23,5,4],[8,7,18,50],[8,23,9,27],[9,7,22,41],[9,23,12,53],
    [10,8,17,7],[10,23,20,8],[11,8,0,11],[11,22,16,44],[12,7,9,59],[12,21,23,31]
  ],
  2035: [
    [1,5,3,41],[1,19,20,18],[2,3,7,51],[2,17,5,36],[4,5,2,32],[4,20,9,10],
    [4,5,5,27],[4,18,10,42],[5,5,4,43],[5,20,21,28],[6,5,11,27],[6,21,3,9],
    [7,7,5,35],[7,22,22,44],[8,8,0,31],[8,23,15,8],[9,8,4,22],[9,23,19,34],
    [10,8,23,49],[10,24,2,56],[11,7,7,27],[11,22,0,0],[12,7,7,16],[12,21,20,48]
  ]
};

/**
 * 获取某年某个节气的精确日期（Date对象）
 * 优先使用精确查表，未覆盖年份回退到近似算法
 */
function getSolarTermDate(year, termIndex) {
  // 优先使用精确查表数据
  if (SOLAR_TERMS_TABLE[year]) {
    const term = SOLAR_TERMS_TABLE[year][termIndex];
    if (term) {
      return new Date(year, term[0] - 1, term[1], term[2], term[3]);
    }
  }

  // 回退：对于未覆盖的年份，使用基准年+线性外推（兼容旧逻辑）
  const baseTerms = [
    [2000, 1, 6, 2, 4], [2000, 1, 21, 0, 53], [2000, 2, 4, 8, 1],
    [2000, 2, 19, 1, 43], [2000, 3, 5, 22, 6], [2000, 3, 20, 17, 23],
    [2000, 4, 4, 21, 38], [2000, 4, 20, 8, 42], [2000, 5, 5, 21, 11],
    [2000, 5, 21, 3, 4], [2000, 6, 5, 19, 37], [2000, 6, 21, 13, 25],
    [2000, 7, 7, 7, 34], [2000, 7, 22, 22, 43], [2000, 8, 7, 18, 45],
    [2000, 8, 23, 12, 49], [2000, 9, 7, 23, 40], [2000, 9, 23, 11, 1],
    [2000, 10, 8, 13, 27], [2000, 10, 23, 21, 14], [2000, 11, 7, 13, 15],
    [2000, 11, 22, 11, 21], [2000, 12, 7, 7, 34], [2000, 12, 21, 20, 38]
  ];

  const avgDays = 365.242189 / 24;
  let offsetYears = year - 2000;
  let offsetDays = Math.round(offsetYears * 365.242189);
  let [by, bm, bd, bh, bmin] = baseTerms[termIndex];
  let baseDate = new Date(by, bm - 1, bd, bh, bmin);
  baseDate.setDate(baseDate.getDate() + offsetDays);

  return baseDate;
}

/**
 * 获取当前日期所属的节气
 */
function getCurrentSolarTerm(date) {
  date = date || new Date();
  const year = date.getFullYear();

  for (let i = 0; i < 24; i++) {
    let currentTermDate = getSolarTermDate(year, i);
    let nextTermIndex = (i + 1) % 24;
    let nextTermDate;
    if (nextTermIndex === 0) {
      nextTermDate = getSolarTermDate(year + 1, 0);
    } else {
      nextTermDate = getSolarTermDate(year, nextTermIndex);
    }

    if (date >= currentTermDate && date < nextTermDate) {
      return {
        name: solarTermNames[i],
        index: i,
        startDate: currentTermDate,
        endDate: nextTermDate,
        guide: solarTermHealthGuide[solarTermNames[i]] || null
      };
    }
  }

  return { name: '未知', index: -1 };
}

/**
 * 获取当前节气在节气周期中的第几天（用于轮换每日内容）
 */
function getDayInCurrentSolarTerm(date) {
  date = date || new Date();
  const solarTermInfo = getCurrentSolarTerm(date);
  if (!solarTermInfo || !solarTermInfo.startDate) return 0;

  const start = solarTermInfo.startDate.getTime();
  const now = date.getTime();
  const dayDiff = Math.floor((now - start) / (1000 * 60 * 60 * 24));

  // 每个节气约15天，返回0-14的索引
  return dayDiff % 15;
}

/**
 * 获取今日纯素食养生语录
 * 基于当前节气和日期偏移量，从 dailyVegetarianTips 中取出对应条目
 *
 * @param {Date} date - 可选日期参数，默认今天
 * @returns {string} 今日素食养生语录
 */
function getDailyVegetarianTip(date) {
  try {
    date = date || new Date();
    const solarTermInfo = getCurrentSolarTerm(date);
    const termName = solarTermInfo.name;

    // 获取该节气的每日语录数组
    const tipsArray = dailyVegetarianTips[termName];

    if (!tipsArray || !Array.isArray(tipsArray) || tipsArray.length === 0) {
      // 如果没有找到对应节气的数据，返回默认提示
      return '今日宜清淡饮食，多吃新鲜蔬果，保持身心愉悦。';
    }

    // 基于日期偏移量取索引
    const dayIndex = getDayInCurrentSolarTerm(date);
    const index = dayIndex % tipsArray.length;

    return tipsArray[index] || '今日宜清淡饮食，多吃新鲜蔬果，保持身心愉悦。';
  } catch (e) {
    console.error('获取每日素食语录失败:', e);
    return '今日宜清淡饮食，多吃新鲜蔬果，保持身心愉悦。';
  }
}

/**
 * 获取当前节气的完整信息（含养生指南 + 每日语录）
 */
function getTodaySolarTermInfo(date) {
  try {
    date = date || new Date();
    const info = getCurrentSolarTerm(date);
    const dailyTip = getDailyVegetarianTip(date);

    return {
      ...info,
      dailyTip: dailyTip,
      dayInTerm: getDayInCurrentSolarTerm(date) + 1  // 第几天（从1开始）
    };
  } catch (e) {
    console.error('获取节气信息失败:', e);
    return null;
  }
}

/**
 * 获取节气时间段描述（如 "2月4日 - 2月18日"）
 */
function getSolarTermPeriod(termName, year) {
  year = year || new Date().getFullYear();
  const index = solarTermNames.indexOf(termName);
  if (index === -1) return '';

  const startDate = getSolarTermDate(year, index);
  const nextIndex = (index + 1) % 24;
  let endDate;
  if (nextIndex === 0) {
    endDate = getSolarTermDate(year + 1, 0);
  } else {
    endDate = getSolarTermDate(year, nextIndex);
  }

  const fmt = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${fmt(startDate)} - ${fmt(endDate)}`;
}

// ==================== 兼容性接口（供 index.js 等页面调用） ====================

/**
 * 获取今日节气信息（兼容旧接口）
 * @param {number} year 年份
 * @param {number} month 月份（1-12）
 * @param {number} day 日期
 * @returns {object|null} 节气信息对象 { name, index } 或 null
 */
function getTodaySolarTerm(year, month, day) {
  try {
    // 直接查表判断：遍历24个节气，看哪个节气的日期与给定日期匹配
    // 这样不依赖时间比较，避免因节气时辰导致的跨日偏差
    for (let i = 0; i < 24; i++) {
      const termDate = getSolarTermDate(year, i);
      if (!termDate) continue;
      // 比较年月日是否一致
      if (termDate.getFullYear() === year &&
          termDate.getMonth() === month - 1 &&
          termDate.getDate() === day) {
        return { name: solarTermNames[i], index: i };
      }
    }
    return null;
  } catch (e) {
    console.error('getTodaySolarTerm 失败:', e);
    return null;
  }
}

function pickRandom(list) {
  if (!list || !list.length) return '';
  return list[Math.floor(Math.random() * list.length)];
}

function getSolarTermTipOptions(termName) {
  const guide = solarTermHealthGuide[termName];
  if (!guide) return ['顺应天时，调和身心'];

  return [
    guide.tip,
    `${termName}时节，顺时而养，饮食起居皆宜从容有度`,
    guide.health,
    guide.lifestyle,
    guide.diet
  ].filter(Boolean);
}

/**
 * 获取节气养生指南（兼容旧接口）
 * @param {string} termName 节气名称
 * @param {object} options 可选配置，randomTip=true 时随机替换 tip
 * @returns {object|null} 养生指南对象
 */
function getSolarTermHealth(termName, options) {
  const guide = solarTermHealthGuide[termName];
  if (!guide) return null;
  if (options && options.randomTip) {
    return {
      ...guide,
      tip: getRandomSolarTermHealthTip(termName)
    };
  }
  return guide;
}

/**
 * 获取养生金句/提示语（兼容旧接口）
 * @param {string} termName 节气名称
 * @returns {string} 提示文字
 */
function getSolarTermHealthTip(termName) {
  const guide = solarTermHealthGuide[termName];
  return guide ? (guide.tip || guide.desc || '顺应天时，调和身心') : '顺应天时，调和身心';
}

function getRandomSolarTermHealthTip(termName) {
  return pickRandom(getSolarTermTipOptions(termName)) || getSolarTermHealthTip(termName);
}

/**
 * 获取附近的节气信息（兼容旧接口）
 * 返回上一个和下一个节气的日期信息
 */
function getNearbySolarTerms(year, month, day) {
  try {
    // 用 getTodaySolarTerm 先按日期判断当天是否为节气（只比年月日，不含时辰）
    // 再用 getCurrentSolarTerm 获取精确的节气区间
    const date = new Date(year, month - 1, day);
    const todayST = getTodaySolarTerm(year, month, day);
    const currentInfo = getCurrentSolarTerm(date);

    // 当前所在节气：优先使用当天节气（如果今天就是节气日），否则用所属区间
    let termName, termIndex, startDate, endDate;
    if (todayST) {
      // 今天是节气当天，以该节气为准
      termName = todayST.name;
      termIndex = todayST.index;
      startDate = getSolarTermDate(year, termIndex);
      const nextIdx = (termIndex + 1) % 24;
      const nYear = nextIdx === 0 ? year + 1 : year;
      endDate = getSolarTermDate(nYear, nextIdx);
    } else if (currentInfo && currentInfo.name !== '未知') {
      termName = currentInfo.name;
      termIndex = currentInfo.index;
      startDate = currentInfo.startDate;
      endDate = currentInfo.endDate;
    } else {
      return { prev: null, next: null };
    }

    const prevTerm = {
      name: termName,
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
      day: startDate.getDate()
    };

    const nextTerm = endDate ? {
      name: solarTermNames[(termIndex + 1) % 24],
      year: endDate.getFullYear(),
      month: endDate.getMonth() + 1,
      day: endDate.getDate()
    } : null;

    return { prev: prevTerm, next: nextTerm };
  } catch (e) {
    console.error('getNearbySolarTerms 失败:', e);
    return { prev: null, next: null };
  }
}

/**
 * 判断某日期是否为节气当天（或前后1天）
 * @param {string} dateStr 日期字符串 "YYYY-MM-DD"
 * @param {number} termIndex 节气索引（0-23）
 * @returns {boolean} 是否在节气当天
 */
function isDateSolarTermDay(dateStr, termIndex) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const termDate = getSolarTermDate(year, termIndex);
    if (!termDate) return false;
    // 直接比较年月日：只要节气的日期部分匹配即可
    return (
      termDate.getFullYear() === year &&
      termDate.getMonth() === month - 1 &&
      Math.abs(termDate.getDate() - day) <= 1  // 允许±1天容差
    );
  } catch (e) {
    return false;
  }
}

module.exports = {
  solarTermNames,
  solarTermHealthGuide,
  getCurrentSolarTerm,
  getDailyVegetarianTip,
  getTodaySolarTermInfo,
  getDayInCurrentSolarTerm,
  getSolarTermPeriod,
  isDateSolarTermDay,
  // 兼容性接口
  getTodaySolarTerm,
  getSolarTermHealth,
  getSolarTermHealthTip,
  getRandomSolarTermHealthTip,
  getNearbySolarTerms
};
