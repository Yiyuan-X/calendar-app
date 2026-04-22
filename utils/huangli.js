/**
 * 黄历资料模块
 *
 * 基于传统黄历算法，提供每日宜忌、五行、星宿、冲煞、财神方位等信息。
 * 数据基于天干地支推算 + 传统通书规则整理。
 */

const { tianGan, diZhi, animals } = require('./lunar');

// ==================== 天干地支基础属性 ====================

/** 天干五行 */
const ganWuXing = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

/** 天干阴阳 */
const ganYinYang = {
  '甲': '阳', '乙': '阴',
  '丙': '阳', '丁': '阴',
  '戊': '阳', '己': '阴',
  '庚': '阳', '辛': '阴',
  '壬': '阳', '癸': '阴'
};

/** 地支五行 */
const zhiWuXing = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

/** 地支生肖（与 animals 对应） */
const zhiAnimal = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
  '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
  '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
};

// ==================== 二十八星宿 ====================

const XIU_NAMES = [
  '角', '亢', '氐', '房', '心', '尾', '箕',
  '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参',
  '井', '鬼', '柳', '星', '张', '翼', '轸'
];

/** 星宿吉凶分类 */
const XIU_LUCK = {
  '吉': ['角', '房', '尾', '箕', '斗', '室', '壁', '奎', '胃', '昴', '毕', '井', '张', '翼', '轸'],
  '凶': ['亢', '氐', '心', '牛', '女', '虚', '危', '娄', '觜', '参', '鬼', '柳', '星']
};

// ==================== 宜忌通用库 ====================

/**
 * 根据日干支索引获取宜忌
 * 日干支从甲子开始0~59循环
 */
const YI_JI_DATA = [
  // 索引 0-9
  { yi: ['嫁娶', '祈福', '出行', '解除'], ji: ['开市', '安葬'] },
  { yi: ['祭祀', '沐浴', '求医'], ji: ['入宅', '安葬'] },
  { yi: ['交易', '立券', '纳财'], ji: ['宴会', '嫁娶'] },
  { yi: ['普渡', '捕捉'], ji: ['出行', '动土'] },
  { yi: ['祭祀', '理发'], ji: ['开仓', '出货'] },
  { yi: ['纳采', '订盟'], ji: ['移徙', '入宅'] },
  { yi: ['交易', '纳财'], ji: ['安床', '破土'] },
  { yi: ['祈福', '行丧'], ji: ['置产', '筑堤'] },
  { yi: ['嫁娶', '出行', '移徙'], ji: ['开市', '安葬'] },
  { yi: ['沐浴', '扫舍'], ji: ['诸事不宜'] },
  // 索引 10-19
  { yi: ['解除', '破屋', '坏垣'], ji: ['诸事不宜'] },
  { yi: ['祭祀', '修坟'], ji: ['嫁娶', '移徙'] },
  { yi: ['交易', '立券'], ji: ['安床', '纳采'] },
  { yi: ['普渡', '入殓'], ji: ['动土', '破土'] },
  { yi: ['嫁娶', '纳采'], ji: ['开市', '安葬'] },
  { yi: ['祈福', '斋醮'], ji: ['置产', '造屋'] },
  { yi: ['纳财', '捕获'], ji: ['开仓', '出货'] },
  { yi: ['交易', '立券'], ji: ['安床', '栽种'] },
  { yi: ['沐浴', '理发'], ji: ['入宅', '动土'] },
  { yi: ['祭祀', '修造'], ji: ['开市', '纳畜'] },
  // 索引 20-29
  { yi: ['嫁娶', '出行'], ji: ['安葬', '修造'] },
  { yi: ['纳采', '订盟'], ji: ['开市', '交易'] },
  { yi: ['祈福', '祭祀'], ji: ['安床', '开仓'] },
  { yi: ['交易', '纳财'], ji: ['宴会', '嫁娶'] },
  { yi: ['普渡', '解除'], ji: ['动土', '破土'] },
  { yi: ['扫舍', '除服'], ji: ['诸事不宜'] },
  { yi: ['理发', '整足'], ji: ['嫁娶', '安葬'] },
  { yi: ['祭祀', '祈福'], ji: ['开市', '纳财'] },
  { yi: ['交易', '立券'], ji: ['安床', '移徙'] },
  { yi: ['沐浴', '整容'], ji: ['入宅', '出行'] },
  // 索引 30-39
  { yi: ['嫁娶', '纳采'], ji: ['开仓', '出货'] },
  { yi: ['出行', '移徙'], ji: ['安葬', '破土'] },
  { yi: ['祈福', '斋醮'], ji: ['开市', '交易'] },
  { yi: ['纳财', '捕猎'], ji: ['安床', '栽种'] },
  { yi: ['普度', '祭祀'], ji: ['动土', '修造'] },
  { yi: ['解除', '破屋'], ji: ['诸事不宜'] },
  { yi: ['理发', '整手足甲'], ji: ['嫁娶', '入宅'] },
  { yi: ['交易', '纳采'], ji: ['安葬', '开仓'] },
  { yi: ['沐浴', '扫舍'], ji: ['出行', '动土'] },
  { yi: ['祭祀', '祈福'], ji: ['开市', '纳畜'] },
  // 索引 40-49
  { yi: ['嫁娶', '订盟'], ji: ['安床', '破土'] },
  { yi: ['出行', '移徙'], ji: ['开仓', '交易'] },
  { yi: ['纳采', '祈福'], ji: ['安葬', '修造'] },
  { yi: ['交易', '立券'], ji: ['宴会', '嫁娶'] },
  { yi: ['普渡', '捕捉'], ji: ['动土', '掘井'] },
  { yi: ['扫舍', '除服'], ji: ['诸事不宜'] },
  { yi: ['理发', '整容'], ji: ['入宅', '出行'] },
  { yi: ['祭祀', '斋醮'], ji: ['开市', '纳财'] },
  { yi: ['纳财', '捕获'], ji: ['安床', '栽种'] },
  { yi: ['交易', '解除'], ji: ['安葬', '破土'] },
  // 索引 50-59
  { yi: ['嫁娶', '纳采'], ji: ['开仓', '出货'] },
  { yi: ['出行', '移徙'], ji: ['诸事不宜'] },
  { yi: ['祈福', '祭祀'], ji: ['开市', '交易'] },
  { yi: ['纳财', '牧养'], ji: ['安床', '修造'] },
  { yi: ['普度', '理发'], ji: ['动土', '破土'] },
  { yi: ['解除', '坏垣'], ji: ['嫁娶', '入宅'] },
  { yi: ['沐浴', '扫舍'], ji: ['出行', '安葬'] },
  { yi: ['交易', '立券'], ji: ['开仓', '纳畜'] },
  { yi: ['祭祀', '祈福'], ji: ['安床', '栽种'] },
  { yi: ['纳采', '订盟'], ji: ['破土', '安葬'] }
];

// ==================== 财神/喜神/福神方位 ====================

/**
 * 日干对应的财神方位
 */
const CAI_SHEN_FANG_WEI = {
  '甲': '东北', '乙': '西北',
  '丙': '西南', '丁': '正南',
  '戊': '正北', '己': '正北',
  '庚': '正东', '辛': '东南',
  '壬': '正南', '癸': '东南'
};

/**
 * 日干对应的喜神方位
 */
const XI_SHEN_FANG_WEI = {
  '甲': '西北', '乙': '西南',
  '丙': '正南', '丁': '正南',
  '戊': '东南', '己': '东南',
  '庚': '正南', '辛': '东南',
  '壬': '正南', '癸': '东南'
};

/**
 * 日干对应的福神方位
 */
const FU_SHEN_FANG_WEI = {
  '甲': '正北', '乙': '正北',
  '丙': '正东', '丁': '正东',
  '戊': '正北', '己': '正北',
  '庚': '西南', '辛': '西南',
  '壬': '正南', '癸': '东南'
};

// ==================== 冲煞计算 ====================

/** 地支相冲对 */
const CHONG_MAP = {
  '子': '午', '丑': '未', '寅': '申', '卯': '酉',
  '辰': '戌', '巳': '亥', '午': '子', '未': '丑',
  '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳'
};

/** 冲煞生肖对应的属相（用于显示"冲XX"） */
const CHONG_ANIMAL = {
  '子': '马', '丑': '羊', '寅': '猴', '卯': '鸡',
  '辰': '狗', '巳': '猪', '午': '鼠', '未': '牛',
  '申': '虎', '酉': '兔', '戌': '龙', '亥': '蛇'
};

/** 煞方（根据日支） */
const SHA_FANG = {
  '子': '南', '丑': '东', '寅': '北', '卯': '西',
  '辰': '南', '巳': '西', '午': '北', '未': '东',
  '申': '南', '酉': '东', '戌': '北', '亥': '西'
};

// ==================== 五行纳音 ====================

/** 六十甲子纳音 */
const NA_YIN = [
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

/** 建除十二星：建、除、满、平、定、执、破、危、成、收、开、闭 */
const JIAN_CHU_NAMES = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];

/** 建星吉凶说明 */
const JIAN_CHU_DESC = {
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

/** 天干禁忌 */
const PENG_ZU_GAN = {
  '甲': '甲不开仓财物耗散',
  '乙': '乙不栽植千株不长',
  '丙': '丙不修灶必见灾殃',
  '丁': '丁不剃头头必生疮',
  '戊': '戊不受田田主不祥',
  '己': '己不破券二比并亡',
  '庚': '庚不经络织机虚张',
  '辛': '辛不合酱主人不尝',
  '壬': '壬不泱水更难提防',
  '癸': '癸不词讼理弱敌强'
};

/** 地支禁忌 */
const PENG_ZU_ZHI = {
  '子': '子不问卜自惹祸殃',
  '丑': '丑不冠带主不还乡',
  '寅': '寅不祭祀神鬼不尝',
  '卯': '卯不穿井水泉不香',
  '辰': '辰不哭泣必主重丧',
  '巳': '巳不远行财物伏藏',
  '午': '午不苫盖屋主更张',
  '未': '未不服药毒气入肠',
  '申': '申不安床鬼祟入房',
  '酉': '酉不会宴醉坐颠狂',
  '戌': '不吃犬作怪上床',
  '亥': '亥不嫁娶不利新郎'
};

// ==================== 核心计算函数 ====================

/**
 * 获取斋日名称
 * @param {number} lunarDay 农历日期 (1-30)
 * @returns {string|null} 斋日名称
 */
function getZhaiDayName(lunarDay) {
  const zhaiMap = {
    1: '朔旦（初一）',
    8: '八关斋日',
    14: '望前斋日',
    15: '望日（十五）',
    23: '晦后斋日',
    29: '晦前斋日',
    30: '晦日（三十）'
  };
  return zhaiMap[lunarDay] || null;
}

/**
 * 计算某日的干支
 * @param {number} y 年
 * @param {number} m 月 (1-12)
 * @param {number} d 日
 * @returns {{gan: string, zhi: string, ganZhi: string, index: number}}
 */
function getDayGanZhi(y, m, d) {
  const baseDate = new Date(1900, 0, 1); // 甲戌日
  const targetDate = new Date(y, m - 1, d);
  const offset = Math.floor((targetDate - baseDate) / 86400000);
  // 1900.1.1 是甲戌日(索引10)，所以偏移+10
  const ganZhiIndex = ((offset + 10) % 60 + 60) % 60;
  const ganIdx = ganZhiIndex % 10;
  const zhiIdx = ganZhiIndex % 12;
  return {
    gan: tianGan[ganIdx],
    zhi: diZhi[zhiIdx],
    ganZhi: tianGan[ganIdx] + diZhi[zhiIdx],
    index: ganZhiIndex
  };
}

/**
 * 计算某月的干支（以节气月为准，简化版用农历月）
 * @param {number} lunarYear 农历年
 * @param {number} lunarMonth 农历月
 * @returns {{gan: string, zhi: string, ganZhi: string}}
 */
function getMonthGanZhi(lunarYear, lunarMonth) {
  // 年干决定月干：年干x2 + 月数 -1
  const yearGanIdx = (lunarYear - 4) % 10;
  const monthGanIdx = (yearGanIdx * 2 + lunarMonth) % 10;
  const monthZhiIdx = (lunarMonth + 1) % 12; // 正月建寅
  return {
    gan: tianGan[monthGanIdx],
    zhi: diZhi[monthZhiIdx],
    ganZhi: tianGan[monthGanIdx] + diZhi[monthZhiIdx]
  };
}

/**
 * 计算建除十二星
 * @param {number} monthZhiIdx 月支索引 (寅=0, 卯=1, ...)
 * @param {number} dayZhiIdx 日支索引
 * @returns {string} 建星名称
 */
function getJianChu(monthZhiIdx, dayZhiIdx) {
  // 正月起建寅，即月支为寅时，寅日为"建"
  // 建星 = (日支索引 - 月支索引 + 12) % 12
  const jianIdx = (dayZhiIdx - monthZhiIdx + 12) % 12;
  return JIAN_CHU_NAMES[jianIdx];
}

/**
 * 计算二十八星宿
 * @param {number} dayIndex 从甲子起算的日序（0-based）
 * @returns {string} 星宿名
 */
function getXiu(dayIndex) {
  return XIU_NAMES[dayIndex % 28];
}

/**
 * 获取完整的黄历资料
 * @param {number} y 公历年
 * @param {number} m 公历月 (1-12)
 * @param {number} d 公历日
 * @param {object} lunarInfo 已有的农历信息（可选）
 * @returns {object} 黄历数据
 */
function getHuangLiData(y, m, d, lunarInfo) {
  // 获取日干支
  const dayGZ = getDayGanZhi(y, m, d);

  // 如果没有传入农历信息，需要计算
  let lunar = lunarInfo;
  if (!lunar) {
    // 延迟引用避免循环依赖
    const lunarUtil = require('./lunar');
    lunar = lunarUtil.solarToLunar(y, m, d);
  }

  // 月干支
  const monthGZ = getMonthGanZhi(lunar.year, lunar.month);

  // 日支索引
  const dayZhiIdx = diZhi.indexOf(dayGZ.zhi);
  const monthZhiIdx = diZhi.indexOf(monthGZ.zhi);

  // 建除十二星
  const jianChu = getJianChu(monthZhiIdx, dayZhiIdx);

  // 二十八星宿
  const xiu = getXiu(dayGZ.index);

  // 星宿吉凶
  let xiuLuck = '平';
  if (XIU_LUCK['吉'].includes(xiu)) xiuLuck = '吉';
  if (XIU_LUCK['凶'].includes(xiu)) xiuLuck = '凶';

  // 冲煞
  const chongZhi = CHONG_MAP[dayGZ.zhi] || '';
  const chongAnimal = CHONG_ANIMAL[dayGZ.zhi] || '';
  const shaFangValue = SHA_FANG[dayGZ.zhi] || '';

  // 纳音
  const naYin = NA_YIN[dayGZ.index] || '';

  // 宜忌
  const yiJi = YI_JI_DATA[dayGZ.index] || YI_JI_DATA[0];

  // 彭祖百忌
  const pengZuGan = PENG_ZU_GAN[dayGZ.gan] || '';
  const pengZuZhi = PENG_ZU_ZHI[dayGZ.zhi] || '';

  // 方位神
  const caiShen = CAI_SHEN_FANG_WEI[dayGZ.gan] || '';
  const xiShen = XI_SHEN_FANG_WEI[dayGZ.gan] || '';
  const fuShen = FU_SHEN_FANG_WEI[dayGZ.gan] || '';

  // 日干五行
  const dayWuXing = ganWuXing[dayGZ.gan] || '';
  const dayYinYang = ganYinYang[dayGZ.gan] || '';

  // === 佛历（佛教纪年） ===
  // 佛历以佛陀涅槃年（约公元前543年）为起点，佛历 = 公元 + 543
  const foLiYear = y + 543;

  // === 斋日判断 ===
  const lunarDay = lunar.day;
  const isLiuZhai = [1, 8, 14, 15, 23, 29].includes(lunarDay);  // 六斋日
  const isShiZhai = [1, 15].includes(lunarDay) || (lunarDay >= 28 && lunarDay <= 30);  // 十斋日（含晦日）
  const isFoHuiRi = isLiuZhai;  // 佛会日即六斋日

  // 组装返回数据
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

    // === 宜忌 ===
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
    fuShen: fuShen
  };
}

module.exports = {
  getHuangLiData,
  getDayGanZhi,
  getJianChu,
  getXiu,
  // 导出常量供其他模块使用
  tianGan,
  diZhi,
  ganWuXing,
  zhiWuXing,
  NA_YIN,
  JIAN_CHU_NAMES,
  JIAN_CHU_DESC,
  XIU_NAMES,
  XIU_LUCK,
  PENG_ZU_GAN,
  PENG_ZU_ZHI,
  CAI_SHEN_FANG_WEI,
  XI_SHEN_FANG_WEI,
  FU_SHEN_FANG_WEI,
  CHONG_MAP,
  CHONG_ANIMAL,
  SHA_FANG
};
