const FONT_ASSET_BASE = '/assets/fonts';
const FONT_CDN = 'https://cdn.jsdelivr.net/fontsource/fonts';

const FONT_LICENSE = {
  OPEN_COMMERCIAL: 'open-commercial',
  LICENSED_LOCAL: 'licensed-local'
};

const FONT_CATEGORIES = {
  BODY: 'body',
  ZEN: 'zen',
  HEALING: 'healing',
  LATIN: 'latin'
};

// Unified font registry.
// licenseNote values:
// - open-commercial: open source / free commercial use, still keep original license file with the font.
// - licensed-local: user/project must provide a licensed local font file; no third-party URL is bundled.
// Authorization rule: fonts with unclear or unverified distribution rights must not enter this registry.
const FONT_REGISTRY = [
  {
    id: 'source-han-sans',
    name: '思源黑体',
    sourceName: 'Source Han Sans SC',
    family: 'CardSourceHanSansSC',
    previewFamily: 'CardSourceHanSansSC, "Source Han Sans SC", "Noto Sans SC", "PingFang SC", sans-serif',
    fileName: 'source-han-sans-sc.woff2',
    fontUrl: `${FONT_CDN}/noto-sans-sc@latest/chinese-simplified-400-normal.woff2`,
    localFontUrl: `${FONT_ASSET_BASE}/source-han-sans-sc.woff2`,
    category: FONT_CATEGORIES.BODY,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '清晰克制',
    scene: '正文、说明、信息层级'
  },
  {
    id: 'source-han-serif',
    name: '思源宋体',
    sourceName: 'Source Han Serif SC',
    family: 'CardSourceHanSerifSCManaged',
    previewFamily: 'CardSourceHanSerifSCManaged, "Source Han Serif SC", Songti SC, serif',
    fileName: 'source-han-serif-sc.woff2',
    fontUrl: `${FONT_CDN}/noto-serif-sc@latest/chinese-simplified-400-normal.woff2`,
    localFontUrl: `${FONT_ASSET_BASE}/source-han-serif-sc.woff2`,
    category: FONT_CATEGORIES.ZEN,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '端正典雅',
    scene: '长文、节气、东方高级正文'
  },
  {
    id: 'alibaba-puhuiti',
    name: '阿里普惠',
    sourceName: 'Alibaba PuHuiTi',
    family: 'CardAlibabaPuHuiTi',
    previewFamily: 'CardAlibabaPuHuiTi, "Alibaba PuHuiTi", "Source Han Sans SC", "PingFang SC", sans-serif',
    fileName: 'alibaba-puhuiti-regular.ttf',
    fontUrl: 'https://static.cdn.sunmi.com/assets/fonts/Alibaba-PuHuiTi-Regular.ttf',
    localFontUrl: `${FONT_ASSET_BASE}/alibaba-puhuiti-regular.ttf`,
    category: FONT_CATEGORIES.BODY,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '现代温和',
    scene: '正文、按钮、轻量标题'
  },
  {
    id: 'line-seed-tw',
    name: 'LINE Seed TW',
    sourceName: 'LINE Seed Sans TW',
    family: 'CardLINESeedTW',
    previewFamily: 'CardLINESeedTW, "LINE Seed Sans TW", "Source Han Sans SC", "PingFang SC", sans-serif',
    fileName: 'line-seed-tw.woff2',
    fontUrl: 'https://fontsapi.zeoseven.com/741/main/result.css',
    localFontUrl: `${FONT_ASSET_BASE}/line-seed-tw.woff2`,
    category: FONT_CATEGORIES.BODY,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '干净亲和',
    scene: '正文、界面、数字信息'
  },
  {
    id: 'lxgw-wenkai',
    name: '文楷',
    sourceName: 'LXGW WenKai',
    family: 'CardLXGWWenKai',
    previewFamily: 'CardLXGWWenKai, "LXGW WenKai", "Source Han Sans SC", "PingFang SC", serif',
    fileName: 'lxgw-wenkai.woff2',
    fontUrl: 'https://cdn.jsdelivr.net/gh/lxgw/LxgwWenKai@latest/fonts/TTF/LXGWWenKai-Regular.ttf',
    localFontUrl: `${FONT_ASSET_BASE}/lxgw-wenkai.woff2`,
    category: FONT_CATEGORIES.ZEN,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '温润克制',
    scene: '禅意正文、日签、国风短句'
  },
  {
    id: 'feibai-caoshu',
    name: '飞白草书',
    sourceName: 'Zhi Mang Xing',
    family: 'CardFeibaiCaoshu',
    previewFamily: 'CardFeibaiCaoshu, CardLXGWWenKai, Kaiti SC, cursive',
    fileName: 'zhi-mang-xing.woff2',
    fontUrl: `${FONT_CDN}/zhi-mang-xing@latest/chinese-simplified-400-normal.woff2`,
    localFontUrl: `${FONT_ASSET_BASE}/zhi-mang-xing.woff2`,
    category: FONT_CATEGORIES.ZEN,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '江湖飞白',
    scene: '题签、行章、国风标题'
  },
  {
    id: 'langya-guji',
    name: '琅琊古籍',
    sourceName: 'Long Cang',
    family: 'CardLangyaGuji',
    previewFamily: 'CardLangyaGuji, CardLXGWWenKai, Kaiti SC, cursive',
    fileName: 'long-cang.woff2',
    fontUrl: `${FONT_CDN}/long-cang@latest/chinese-simplified-400-normal.woff2`,
    localFontUrl: `${FONT_ASSET_BASE}/long-cang.woff2`,
    category: FONT_CATEGORIES.ZEN,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '碑帖古雅',
    scene: '封面、落款、古风标题'
  },
  {
    id: 'verdana',
    name: 'Verdana',
    sourceName: 'Verdana',
    family: 'Verdana, Geneva, sans-serif',
    previewFamily: 'Verdana, Geneva, sans-serif',
    category: FONT_CATEGORIES.LATIN,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '清晰稳重',
    scene: '英文正文、数字信息'
  },
  {
    id: 'trebuchet',
    name: 'Trebuchet',
    sourceName: 'Trebuchet MS',
    family: '"Trebuchet MS", Trebuchet, sans-serif',
    previewFamily: '"Trebuchet MS", Trebuchet, sans-serif',
    category: FONT_CATEGORIES.LATIN,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '轻松现代',
    scene: '英文短句、辅助标题'
  },
  {
    id: 'courier',
    name: 'Courier',
    sourceName: 'Courier New',
    family: '"Courier New", Courier, monospace',
    previewFamily: '"Courier New", Courier, monospace',
    category: FONT_CATEGORIES.LATIN,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '朴素等宽',
    scene: '编号、英文注记、日期'
  },
  {
    id: 'times-new-roman',
    name: 'Times',
    sourceName: 'Times New Roman',
    family: '"Times New Roman", Times, serif',
    previewFamily: '"Times New Roman", Times, serif',
    category: FONT_CATEGORIES.LATIN,
    licenseNote: FONT_LICENSE.OPEN_COMMERCIAL,
    mood: '经典克制',
    scene: '英文日签、落款、长句'
  }
];

function getManagedFonts() {
  return FONT_REGISTRY.map(font => ({ ...font }));
}

function mergeFontCatalog(existingFonts) {
  const seen = {};
  const result = [];
  FONT_REGISTRY.forEach(font => {
    const key = `${font.id || ''}|${font.family || ''}|${font.sourceName || font.name || ''}`;
    if (seen[key]) return;
    seen[key] = true;
    result.push({ ...font, managed: true });
  });
  (existingFonts || []).forEach(font => {
    const key = `${font.id || ''}|${font.family || ''}|${font.sourceName || font.name || ''}`;
    if (seen[key]) return;
    seen[key] = true;
    result.push(font);
  });
  return result;
}

module.exports = {
  FONT_LICENSE,
  FONT_CATEGORIES,
  FONT_REGISTRY,
  getManagedFonts,
  mergeFontCatalog
};
