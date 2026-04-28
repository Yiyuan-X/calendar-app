/**
 * 黄历资料模块（完整版）
 *
 * 基于传统黄历算法，提供每日宜忌、五行、星宿、冲煞、财神方位、十二时辰宜忌等信息。
 * 数据基于天干地支推算 + 传统通书规则整理。
 */

var lunarMod = require('./lunar');
var tianGan = lunarMod.tianGan;
var diZhi = lunarMod.diZhi;
var animals = lunarMod.animals;

// ==================== 天干地支基础属性 ====================

/** 天干五行 */
var ganWuXing = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

/** 天干阴阳 */
var ganYinYang = {
  '甲': '阳', '乙': '阴',
  '丙': '阳', '丁': '阴',
  '戊': '阳', '己': '阴',
  '庚': '阳', '辛': '阴',
  '壬': '阳', '癸': '阴'
};

/** 地支五行 */
var zhiWuXing = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

/** 地支生肖 */
var zhiAnimal = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
  '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
  '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
};

// ==================== 二十八星宿 ====================

var XIU_NAMES = [
  '角', '亢', '氐', '房', '心', '尾', '箕',
  '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参',
  '井', '鬼', '柳', '星', '张', '翼', '轸'
];

var XIU_LUCK = {
  '吉': ['角', '房', '尾', '箕', '斗', '室', '壁', '奎', '胃', '昴', '毕', '井', '张', '翼', '轸'],
  '凶': ['亢', '氐', '心', '牛', '女', '虚', '危', '娄', '觜', '参', '鬼', '柳', '星']
};

// ==================== 十二时辰 ====================

var SHI_CHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 时辰对应的时间段 */
var SHI_CHEN_TIME = {
  '子': '23:00-00:59', '丑': '01:00-02:59', '寅': '03:00-04:59',
  '卯': '05:00-06:59', '辰': '07:00-08:59', '巳': '09:00-10:59',
  '午': '11:00-12:59', '未': '13:00-14:59', '申': '15:00-16:59',
  '酉': '17:00-18:59', '戌': '19:00-20:59', '亥': '21:00-22:59'
};

/**
 * 五鼠遁日法 — 根据日干确定时干的起始
 * 甲己日起甲子时，乙庚日起丙子时，丙辛日起戊子时，
 * 丁壬日起庚子时，戊癸日起壬子时
 */
var WU_SHU_DUN_RI = {
  '甲': '甲', '己': '甲',   // 甲己之日 — 甲子时起
  '乙': '丙', '庚': '丙',   // 乙庚之日 — 丙子时起
  '丙': '戊', '辛': '戊',   // 丙辛之日 — 戊子时起
  '丁': '庚', '壬': '庚',   // 丁壬之日 — 庚子时起
  '戊': '壬', '癸': '壬'    // 戊癸之日 — 壬子时起
};

/**
 * 获取某日某时辰的天干（五鼠遁日）
 * @param {string} dayGan - 日干
 * @param {number} zhiIdx - 时支索引 (0-11)
 * @returns {string} 时干
 */
function getShiGan(dayGan, zhiIdx) {
  var startGan = WU_SHU_DUN_RI[dayGan] || '甲';
  var startIdx = tianGan.indexOf(startGan);
  return tianGan[(startIdx + zhiIdx) % 10];
}

/**
 * 十二时辰宜忌数据（完整版）
 *
 * 基于传统通书《协纪辨方书》《玉匣记》等整理。
 * 宜忌由时辰地支的五行属性、与日干支的关系决定。
 *
 * 数据结构：按日干(10) × 时支(12) 组织
 * 每个时辰包含：宜(yi)、忌(ji)
 *
 * 注：以下为宜忌通用规则，不同流派略有差异，但核心一致。
 */
var SHI_CHEN_YI_JI_FULL = [
  // ===== 日干: 甲 / 己 (甲己之日起甲子时) =====
  // 甲/己日十二时辰宜忌
  { '子': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '丑': {yi:[], ji:['诸事不宜']},
    '寅': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']},
    '卯': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']},
    '辰': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醮']},
    '巳': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]},
    '午': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '未': {yi:[], ji:['诸事不宜']},
    '申': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']},
    '酉': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']},
    '戌': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醮']},
    '亥': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]} },

  // ===== 日干: 乙 / 庚 (乙庚之日起丙子时) =====
  { '子': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']},
    '丑': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']},
    '寅': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醮']},
    '卯': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]},
    '辰': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '巳': {yi:[], ji:['诸事不宜']},
    '午': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']},
    '未': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']},
    '申': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醮']},
    '酉': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]},
    '戌': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '亥': {yi:[], ji:['诸事不宜']} },

  // ===== 日干: 丙 / 辛 (丙辛之日起戊子时) =====
  { '子': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醮']},
    '丑': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]},
    '寅': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '卯': {yi:[], ji:['诸事不宜']},
    '辰': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']},
    '巳': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']},
    '午': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醮']},
    '未': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]},
    '申': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '酉': {yi:[], ji:['诸事不宜']},
    '戌': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']},
    '亥': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']} },

  // ===== 日干: 丁 / 壬 (丁壬之日起庚子时) =====
  { '子': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']},
    '丑': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醮']},
    '寅': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]},
    '卯': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '辰': {yi:[], ji:['诸事不宜']},
    '巳': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']},
    '午': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']},
    '未': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醮']},
    '申': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]},
    '酉': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '戌': {yi:[], ji:['诸事不宜']},
    '亥': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']} },

  // ===== 日干: 戊 / 癸 (戊癸之日起壬子时) =====
  { '子': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]},
    '丑': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '寅': {yi:[], ji:['诸事不宜']},
    '卯': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']},
    '辰': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']},
    '巳': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醮']},
    '午': {yi:['结婚','搬家','搬新房','开业','安床','求子'], ji:[]},
    '未': {yi:['结婚','搬家','交易','搬新房','开业','安葬','修造'], ji:['赴任','诉讼','祈福','求子']},
    '申': {yi:[], ji:['诸事不宜']},
    '酉': {yi:['结婚','出行','祈福','安葬','求子','求财'], ji:['动土','修造']},
    '戌': {yi:['结婚','出行','交易','开业','安床','求子','求财'], ji:['祈福','祭祀','酬神','斋醮']},
    '亥': {yi:['结婚','搬家','搬新房','安葬','修造','收养子女','求财'], ji:['出行','赴任','祈福','祭祀','开光','斋醲']} }
];

// ==================== 宜忌通用库（日级） ====================

var YI_JI_DATA = [
  { yi: ['嫁娶','祈福','出行','解除'], ji: ['开市','安葬'] },
  { yi: ['祭祀','沐浴','求医'], ji: ['入宅','安葬'] },
  { yi: ['交易','立券','纳财'], ji: ['宴会','嫁娶'] },
  { yi: ['普渡','捕捉'], ji: ['出行','动土'] },
  { yi: ['祭祀','理发'], ji: ['开仓','出货'] },
  { yi: ['纳采','订盟'], ji: ['移徙','入宅'] },
  { yi: ['交易','纳财'], ji: ['安床','破土'] },
  { yi: ['祈福','行丧'], ji: ['置产','筑堤'] },
  { yi: ['嫁娶','出行','移徙'], ji: ['开市','安葬'] },
  { yi: ['沐浴','扫舍'], ji: ['诸事不宜'] },
  { yi: ['解除','破屋','坏垣'], ji: ['诸事不宜'] },
  { yi: ['祭祀','修坟'], ji: ['嫁娶','移徙'] },
  { yi: ['交易','立券'], ji: ['安床','纳采'] },
  { yi: ['普渡','入殓'], ji: ['动土','破土'] },
  { yi: ['嫁娶','纳采'], ji: ['开市','安葬'] },
  { yi: ['祈福','斋醮'], ji: ['置产','造屋'] },
  { yi: ['纳财','捕获'], ji: ['开仓','出货'] },
  { yi: ['交易','立券'], ji: ['安床','栽种'] },
  { yi: ['沐浴','理发'], ji: ['入宅','动土'] },
  { yi: ['祭祀','修造'], ji: ['开市','纳畜'] },
  { yi: ['嫁娶','出行'], ji: ['安葬','修造'] },
  { yi: ['纳采','订盟'], ji: ['开市','交易'] },
  { yi: ['祈福','祭祀'], ji: ['安床','开仓'] },
  { yi: ['交易','纳财'], ji: ['宴会','嫁娶'] },
  { yi: ['普渡','解除'], ji: ['动土','破土'] },
  { yi: ['扫舍','除服'], ji: ['诸事不宜'] },
  { yi: ['理发','整足'], ji: ['嫁娶','安葬'] },
  { yi: ['祭祀','祈福'], ji: ['开市','纳财'] },
  { yi: ['交易','立券'], ji: ['安床','移徙'] },
  { yi: ['沐浴','整容'], ji: ['入宅','出行'] },
  { yi: ['嫁娶','纳采'], ji: ['开仓','出货'] },
  { yi: ['出行','移徙'], ji: ['安葬','破土'] },
  { yi: ['祈福','斋醮'], ji: ['开市','交易'] },
  { yi: ['纳财','捕猎'], ji: ['安床','栽种'] },
  { yi: ['普度','祭祀'], ji: ['动土','修造'] },
  { yi: ['解除','破屋'], ji: ['诸事不宜'] },
  { yi: ['理发','整手足甲'], ji: ['嫁娶','入宅'] },
  { yi: ['交易','纳采'], ji: ['安葬','开仓'] },
  { yi: ['沐浴','扫舍'], ji: ['出行','动土'] },
  { yi: ['祭祀','祈福'], ji: ['开市','纳畜'] },
  { yi: ['嫁娶','订盟'], ji: ['安床','破土'] },
  { yi: ['出行','移徙'], ji: ['开仓','交易'] },
  { yi: ['纳采','祈福'], ji: ['安葬','修造'] },
  { yi: ['交易','立券'], ji: ['宴会','嫁娶'] },
  { yi: ['普渡','捕捉'], ji: ['动土','掘井'] },
  { yi: ['扫舍','除服'], ji: ['诸事不宜'] },
  { yi: ['理发','整容'], ji: ['入宅','出行'] },
  { yi: ['祭祀','斋醮'], ji: ['开市','纳财'] },
  { yi: ['纳财','捕获'], ji: ['安床','栽种'] },
  { yi: ['交易','解除'], ji: ['安葬','破土'] },
  { yi: ['嫁娶','纳采'], ji: ['开仓','出货'] },
  { yi: ['出行','移徙'], ji: ['诸事不宜'] },
  { yi: ['祈福','祭祀'], ji: ['开市','交易'] },
  { yi: ['纳财','牧养'], ji: ['安床','修造'] },
  { yi: ['普度','理发'], ji: ['动土','破土'] },
  { yi: ['解除','坏垣'], ji: ['嫁娶','入宅'] },
  { yi: ['沐浴','扫舍'], ji: ['出行','安葬'] },
  { yi: ['交易','立券'], ji: ['开仓','纳畜'] },
  { yi: ['祭祀','祈福'], ji: ['安床','栽种'] },
  { yi: ['纳采','订盟'], ji: ['破土','安葬'] }
];

// ==================== 财神/喜神/福神方位 ====================

var CAI_SHEN_FANG_WEI = {
  '甲': '东北', '乙': '西北', '丙': '西南', '丁': '正南',
  '戊': '正北', '己': '正北', '庚': '正东', '辛': '东南',
  '壬': '正南', '癸': '东南'
};

var XI_SHEN_FANG_WEI = {
  '甲': '西北', '乙': '西南', '丙': '正南', '丁': '正南',
  '戊': '东南', '己': '东南', '庚': '正南', '辛': '东南',
  '壬': '正南', '癸': '东南'
};

var FU_SHEN_FANG_WEI = {
  '甲': '正北', '乙': '正北', '丙': '正东', '丁': '正东',
  '戊': '正北', '己': '正北', '庚': '西南', '辛': '西南',
  '壬': '正南', '癸': '东南'
};

// ==================== 冲煞计算 ====================

var CHONG_MAP = {
  '子': '午', '丑': '未', '寅': '申', '卯': '酉',
  '辰': '戌', '巳': '亥', '午': '子', '未': '丑',
  '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳'
};

var CHONG_ANIMAL = {
  '子': '马', '丑': '羊', '寅': '猴', '卯': '鸡',
  '辰': '狗', '巳': '猪', '午': '鼠', '未': '牛',
  '申': '虎', '酉': '兔', '戌': '龙', '亥': '蛇'
};

var SHA_FANG = {
  '子': '南', '丑': '东', '寅': '北', '卯': '西',
  '辰': '南', '巳': '西', '午': '北', '未': '东',
  '申': '南', '酉': '东', '戌': '北', '亥': '西'
};

// ==================== 五行纳音 ====================

var NA_YIN = [
  '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木',
  '路旁土', '路旁土', '剑锋金', '剑锋金', '山头火', '山头火',
  '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金',
  '杨柳木', '杨柳木', '泉中水', '泉中水', '屋上土', '屋上土',
  '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
  '沙中金', '沙中金', '山下火', '山下火', '平地木', '平地木',
  '壁上土', '壁上土', '金箔金', '金箔金', '覆灯火', '覆灯火',
  '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金',
  '桑柘木', '桑柘木', '大溪水', '大溪水', '沙中土', '沙中土',
  '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水'
];

// ==================== 十二建星 ====================

var JIAN_CHU_NAMES = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];

var JIAN_CHU_DESC = {
  '建': { luck: '吉', text: '万物生育之始，宜出行、上任、见贵' },
  '除': { luck: '吉', text: '除旧布新之机，宜沐浴、扫舍、求医' },
  '满': { luck: '吉', text: '丰圆满溢之意，宜祭祀、宴请、签约' },
  '平': { luck: '平', text: '平稳无波之日，宜日常事务' },
  '定': { luck: '吉', text: '定局安稳之时，宜订盟、纳采、置业' },
  '执': { luck: '吉', text: '执守固执之意，宜修造、种植、捕捉' },
  '破': { luck: '凶', text: '冲破破坏之气，宜破土、拆卸、治病' },
  '危': { luck: '凶', text: '危险危机之象，凡事谨慎为宜' },
  '成': { luck: '吉', text: '成就完成之兆，宜嫁娶、开业、动土' },
  '收': { luck: '吉', text: '收敛聚集之时，宜纳财、买置、收账' },
  '开': { luck: '吉', text: '开放通达之象，宜开市、开学、出行' },
  '闭': { luck: '凶', text: '闭塞不通之势，宜静守、修炼、安葬' }
};

// ==================== 彭祖百忌 ====================

var PENG_ZU_GAN = {
  '甲': '甲不开仓财物耗散', '乙': '乙不栽植千株不长',
  '丙': '丙不修灶必见灾殃', '丁': '丁不剃头头必生疮',
  '戊': '戊不受田田主不祥', '己': '己不破券二比并亡',
  '庚': '庚不经络织机虚张', '辛': '辛不合酱主人不尝',
  '壬': '壬不泱水更难提防', '癸': '癸不词讼理弱敌强'
};

var PENG_ZU_ZHI = {
  '子': '子不问卜自惹祸殃', '丑': '丑不冠带主不还乡',
  '寅': '寅不祭祀神鬼不尝', '卯': '卯不穿井水泉不香',
  '辰': '辰不哭泣必主重丧', '巳': '巳不远行财物伏藏',
  '午': '午不苫盖屋主更张', '未': '未不服药毒气入肠',
  '申': '申不安床鬼祟入房', '酉': '酉不会宴醉坐颠狂',
  '戌': '不吃犬作怪上床', '亥': '亥不嫁娶不利新郎'
};

// ==================== 节气名称（用于显示当前节气时段） ====================

var JIE_QI_NAMES = [
  '小寒','大寒','立春','雨水','惊蛰','春分',
  '清明','谷雨','立夏','小满','芒种','夏至',
  '小暑','大暑','立秋','处暑','白露','秋分',
  '寒露','霜降','立冬','小雪','大雪','冬至'
];

// ==================== 核心计算函数 ====================

function getZhaiDayName(lunarDay) {
  var zhaiMap = {
    1: '朔旦（初一）', 8: '八关斋日', 14: '望前斋日',
    15: '望日（十五）', 23: '晦后斋日', 29: '晦前斋日', 30: '晦日（三十）'
  };
  return zhaiMap[lunarDay] || null;
}

function getDayGanZhi(y, m, d) {
  var baseDate = new Date(1900, 0, 1);
  var targetDate = new Date(y, m - 1, d);
  var offset = Math.floor((targetDate - baseDate) / 86400000);
  var ganZhiIndex = ((offset + 10) % 60 + 60) % 60;
  var ganIdx = ganZhiIndex % 10;
  var zhiIdx = ganZhiIndex % 12;
  return {
    gan: tianGan[ganIdx], zhi: diZhi[zhiIdx],
    ganZhi: tianGan[ganIdx] + diZhi[zhiIdx], index: ganZhiIndex
  };
}

function getMonthGanZhi(lunarYear, lunarMonth) {
  var yearGanIdx = (lunarYear - 4) % 10;
  var monthGanIdx = (yearGanIdx * 2 + lunarMonth) % 10;
  var monthZhiIdx = (lunarMonth + 1) % 12;
  return {
    gan: tianGan[monthGanIdx], zhi: diZhi[monthZhiIdx],
    ganZhi: tianGan[monthGanIdx] + diZhi[monthZhiIdx]
  };
}

function getJianChu(monthZhiIdx, dayZhiIdx) {
  var jianIdx = (dayZhiIdx - monthZhiIdx + 12) % 12;
  return JIAN_CHU_NAMES[jianIdx];
}

function getXiu(dayIndex) {
  return XIU_NAMES[dayIndex % 28];
}

/**
 * 获取十二时辰的完整信息（基于五鼠遁日法）
 * @param {string} dayGan - 日干
 * @param {string} dayZhi - 日支
 * @param {number} dayGZIndex - 日干支索引(0-59)
 * @returns {Array} 十二时辰数据数组
 */
function getShiChenData(dayGan, dayZhi, dayGZIndex) {
  // 日干索引 0-9 (甲乙丙丁戊己庚辛壬癸)
  // 甲/己→0, 乙/庚→1, 丙/辛→2, 丁/壬→3, 戊/癸→4
  var ganIdxMap = { '甲':0,'乙':1,'丙':2,'丁':3,'戊':4,'己':0,'庚':1,'辛':2,'壬':3,'癸':4 };
  var ganIdx = ganIdxMap[dayGan] || 0;
  var shiChenTable = SHI_CHEN_YI_JI_FULL[ganIdx];
  var result = [];

  for (var i = 0; i < 12; i++) {
    var zhiName = SHI_CHEN_NAMES[i];
    var timeStr = SHI_CHEN_TIME[zhiName];
    var yiji = shiChenTable[zhiName] || {yi:[],ji:[]};

    // 五鼠遁日法推算时干
    var shiGan = getShiGan(dayGan, i);
    var fullName = shiGan + zhiName + '时';  // 如 "丙子时"

    // 计算时辰冲煞：时支相冲
    var chongAni = CHONG_ANIMAL[zhiName] || '';
    var shaDir = SHA_FANG[zhiName] || '';
    var chongText = chongAni ? ('冲' + chongAni + ' 煞' + shaDir) : '';

    result.push({
      name: fullName,           // 完整时辰名：丙子时、乙丑时...
      zhi: zhiName,             // 地支：子、丑...
      gan: shiGan,              // 天干：丙、乙...
      time: timeStr,
      chongText: chongText,
      chongAnimal: chongAni,
      shaFang: shaDir,
      yi: yiji.yi || [],
      ji: yiji.ji || []
    });
  }

  return result;
}

/**
 * 获取下一个节气的日期字符串（如 "2026年05月04日"）
 */
function getNextSolarTermStr(y, m, d) {
  try {
    var solarTermsMod = require('./solar-terms');
    // 找到当前日期之后的下一个节气
    for (var i = 0; i < 24; i++) {
      var termDate = solarTermsMod.getSolarTermDate(y, i);
      if (termDate) {
        var ty = termDate.getFullYear();
        var tm = termDate.getMonth() + 1;
        var td = termDate.getDate();
        // 比较日期，找当前日之后最近的节气
        if (ty > y || (ty === y && tm > m) || (ty === y && tm === m && td > d)) {
          return ty + '年' + padZero(tm) + '月' + padZero(td) + '日';
        }
      }
    }
    // 如果今年没有更多节气了，查明年
    for (var j = 0; j < 3; j++) { // 小寒、大寒、立春
      var nextDate = solarTermsMod.getSolarTermDate(y + 1, j);
      if (nextDate) {
        var ny = nextDate.getFullYear();
        var nm = nextDate.getMonth() + 1;
        var nd = nextDate.getDate();
        return ny + '年' + padZero(nm) + '月' + padZero(nd) + '日';
      }
    }
    return '';
  } catch (e) {
    return '';
  }
}

function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

/**
 * 获取完整的黄历资料（含十二时辰）
 */
function getHuangLiData(y, m, d, lunarInfo) {
  var dayGZ = getDayGanZhi(y, m, d);

  var lunar = lunarInfo;
  if (!lunar) {
    lunar = lunarMod.solarToLunar(y, m, d);
  }

  var monthGZ = getMonthGanZhi(lunar.year, lunar.month);

  var dayZhiIdx = diZhi.indexOf(dayGZ.zhi);
  var monthZhiIdx = diZhi.indexOf(monthGZ.zhi);

  var jianChu = getJianChu(monthZhiIdx, dayZhiIdx);
  var xiu = getXiu(dayGZ.index);

  var xiuLuck = '平';
  if (XIU_LUCK['吉'].includes(xiu)) xiuLuck = '吉';
  if (XIU_LUCK['凶'].includes(xiu)) xiuLuck = '凶';

  var chongZhi = CHONG_MAP[dayGZ.zhi] || '';
  var chongAnimal = CHONG_ANIMAL[dayGZ.zhi] || '';
  var shaFangValue = SHA_FANG[dayGZ.zhi] || '';
  var naYin = NA_YIN[dayGZ.index] || '';
  var yiJi = YI_JI_DATA[dayGZ.index] || YI_JI_DATA[0];
  var pengZuGan = PENG_ZU_GAN[dayGZ.gan] || '';
  var pengZuZhi = PENG_ZU_ZHI[dayGZ.zhi] || '';
  var caiShen = CAI_SHEN_FANG_WEI[dayGZ.gan] || '';
  var xiShen = XI_SHEN_FANG_WEI[dayGZ.gan] || '';
  var fuShen = FU_SHEN_FANG_WEI[dayGZ.gan] || '';
  var dayWuXing = ganWuXing[dayGZ.gan] || '';
  var dayYinYang = ganYinYang[dayGZ.gan] || '';

  // 佛历
  var foLiYear = y + 543;

  // 斋日判断
  var lunarDay = lunar.day;
  var isLiuZhai = [1, 8, 14, 15, 23, 29].includes(lunarDay);
  var isShiZhai = [1, 15].includes(lunarDay) || (lunarDay >= 28 && lunarDay <= 30);
  var isFoHuiRi = isLiuZhai;

  // 十二时辰数据
  var shiChenList = getShiChenData(dayGZ.gan, dayGZ.zhi, dayGZ.index);

  return {
    // === 干支 ===
    dayGan: dayGZ.gan,
    dayZhi: dayGZ.zhi,
    dayGanZhi: dayGZ.ganZhi,
    monthGanZhi: monthGZ.ganZhi,

    // === 佛历 ===
    foLiYear: foLiYear,
    foLiText: '佛历' + foLiYear + '年',
    isLiuZhai: isLiuZhai,
    isShiZhai: isShiZhai,
    isFoHuiRi: isFoHuiRi,
    zhaiDayName: getZhaiDayName(lunarDay),

    // === 五行 ===
    wuXing: dayWuXing,
    yinYang: dayYinYang,
    naYin: naYin,

    // === 建除 ===
    jianChu: jianChu,
    jianChuDesc: JIAN_CHU_DESC[jianChu] || null,
    jianChuLuck: JIAN_CHU_DESC[jianChu] ? JIAN_CHU_DESC[jianChu].luck : '平',

    // === 星宿 ===
    xiu: xiu,
    xiuLuck: xiuLuck,

    // === 宜忌（日级） ===
    yi: yiJi.yi,
    ji: yiJi.ji,

    // === 冲煞 ===
    chong: chongZhi,
    chongAnimal: chongAnimal,
    sha: shaFangValue,
    chongText: '冲' + chongAnimal + '(' + chongZhi + ') 煞' + shaFangValue,

    // === 彭祖百忌 ===
    pengZuGan: pengZuGan,
    pengZuZhi: pengZuZhi,

    // === 方位神 ===
    caiShen: caiShen,
    xiShen: xiShen,
    fuShen: fuShen,

    // === 十二时辰 ===
    shiChen: shiChenList,

    // === 辅助信息（用于时辰标题显示） ===
    dayGZIndex: dayGZ.index,
    nextSolarTerm: getNextSolarTermStr(y, m, d)
  };
}

module.exports = {
  getHuangLiData: getHuangLiData,
  getDayGanZhi: getDayGanZhi,
  getJianChu: getJianChu,
  getXiu: getXiu,
  tianGan: tianGan,
  diZhi: diZhi,
  ganWuXing: ganWuXing,
  zhiWuXing: zhiWuXing,
  NA_YIN: NA_YIN,
  JIAN_CHU_NAMES: JIAN_CHU_NAMES,
  JIAN_CHU_DESC: JIAN_CHU_DESC,
  XIU_NAMES: XIU_NAMES,
  XIU_LUCK: XIU_LUCK,
  PENG_ZU_GAN: PENG_ZU_GAN,
  PENG_ZU_ZHI: PENG_ZU_ZHI,
  CAI_SHEN_FANG_WEI: CAI_SHEN_FANG_WEI,
  XI_SHEN_FANG_WEI: XI_SHEN_FANG_WEI,
  FU_SHEN_FANG_WEI: FU_SHEN_FANG_WEI,
  CHONG_MAP: CHONG_MAP,
  CHONG_ANIMAL: CHONG_ANIMAL,
  SHA_FANG: SHA_FANG,
  SHI_CHEN_NAMES: SHI_CHEN_NAMES,
  SHI_CHEN_TIME: SHI_CHEN_TIME
};
