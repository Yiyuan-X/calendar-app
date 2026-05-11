const CDN_BASE = 'https://cdn.jsdelivr.net/gh/wechat-miniprogram-assets/poster-card';
const TEMPLATE_CONFIG_URL = `${CDN_BASE}/templates/card-templates.json`;
const DEFAULT_FONT_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-sc@latest/chinese-simplified-400-normal.woff2';
let remoteTemplates = null;

const templates = [
  {
    id: 'daily-sign-warm',
    name: '分享卡',
    scene: '日签',
    cover: '',
    size: { width: 750, height: 1000 },
    background: {
      type: 'gradient',
      colors: ['#FFF7E8', '#F5EEE1'],
      direction: 'vertical',
      blur: false
    },
    fontUrl: DEFAULT_FONT_URL,
    blocks: [
      {
        id: 'title',
        type: 'text',
        x: 92,
        y: 142,
        width: 566,
        align: 'center',
        lineHeight: 1.75,
        letterSpacing: 2,
        delta: {
          ops: [
            { insert: '把心安住在当下，\n每一步都算归途。', attributes: { size: 38, color: '#5B4636', bold: true } }
          ]
        }
      }
    ],
    decorations: [
      { type: 'line', x: 258, y: 690, width: 234, color: 'rgba(167,126,80,0.42)' }
    ],
    qrcode: { visible: false, x: 314, y: 808, size: 122, src: '' }
  },
  {
    id: 'solar-term-paper',
    name: '节气卡',
    scene: '节气',
    cover: '',
    size: { width: 750, height: 1000 },
    background: {
      type: 'gradient',
      colors: ['#F8F2E8', '#EAF1E7'],
      direction: 'diagonal',
      blur: false
    },
    fontUrl: DEFAULT_FONT_URL,
    blocks: [
      {
        id: 'title',
        type: 'text',
        x: 86,
        y: 132,
        width: 578,
        align: 'left',
        lineHeight: 1.7,
        letterSpacing: 2,
        delta: {
          ops: [
            { insert: '雨水\n', attributes: { size: 64, color: '#314538', bold: true } },
            { insert: '春雨润物，静候花开。', attributes: { size: 34, color: '#5F6F61' } }
          ]
        }
      },
      {
        id: 'note',
        type: 'text',
        x: 86,
        y: 684,
        width: 500,
        align: 'left',
        lineHeight: 1.7,
        letterSpacing: 1,
        delta: {
          ops: [{ insert: '宜早睡早起，清淡饮食，养肝护脾。', attributes: { size: 26, color: '#7B705F' } }]
        }
      }
    ],
    decorations: [
      { type: 'line', x: 86, y: 622, width: 280, color: 'rgba(49,69,56,0.35)' }
    ],
    qrcode: { visible: false, x: 580, y: 800, size: 110, src: '' }
  },
  {
    id: 'mindful-quote',
    name: '静心卡',
    scene: '静心',
    cover: '',
    size: { width: 750, height: 1000 },
    background: {
      type: 'solid',
      color: '#F7F1EA',
      blur: true
    },
    fontUrl: DEFAULT_FONT_URL,
    blocks: [
      {
        id: 'quote',
        type: 'text',
        x: 110,
        y: 238,
        width: 530,
        align: 'center',
        lineHeight: 1.9,
        letterSpacing: 3,
        delta: {
          ops: [{ insert: '少一点执着，\n多一点清明。', attributes: { size: 48, color: '#4B4038', bold: true, shadow: true } }]
        }
      },
      {
        id: 'sub',
        type: 'text',
        x: 160,
        y: 640,
        width: 430,
        align: 'center',
        lineHeight: 1.5,
        letterSpacing: 5,
        delta: {
          ops: [{ insert: '静心 · 观照 · 感恩', attributes: { size: 24, color: '#A5866B' } }]
        }
      }
    ],
    decorations: [],
    qrcode: { visible: false, x: 316, y: 766, size: 118, src: '' }
  },
  {
    id: 'practice-check',
    name: '功课打卡卡',
    scene: '打卡',
    cover: '',
    size: { width: 750, height: 1000 },
    background: {
      type: 'gradient',
      colors: ['#FFF9EF', '#F1E8DB'],
      direction: 'vertical',
      blur: false
    },
    blocks: [
      {
        id: 'practice',
        type: 'text',
        x: 84,
        y: 128,
        width: 582,
        align: 'left',
        lineHeight: 1.75,
        letterSpacing: 1,
        delta: {
          ops: [
            { insert: '今日功课\n', attributes: { size: 54, color: '#624833', bold: true } },
            { insert: '诵经 30 分钟\n静坐 15 分钟\n发愿：愿心清净，行有余香。', attributes: { size: 30, color: '#7A614D' } }
          ]
        }
      }
    ],
    decorations: [
      { type: 'line', x: 84, y: 602, width: 300, color: 'rgba(98,72,51,0.28)' }
    ],
    qrcode: { visible: false, x: 560, y: 770, size: 112, src: '' }
  }
];

function cloneTemplate(template) {
  return JSON.parse(JSON.stringify(template));
}

function getTemplate(id) {
  const list = remoteTemplates || templates;
  const template = list.find(item => item.id === id) || list[0] || templates[0];
  return cloneTemplate(template);
}

function getTemplates() {
  return cloneTemplate(remoteTemplates || templates);
}

function normalizeTemplateList(data) {
  const list = Array.isArray(data) ? data : (data && data.templates);
  if (!Array.isArray(list) || !list.length) return null;
  return list.filter(item => item && item.id && item.blocks && item.size);
}

function loadTemplates() {
  return new Promise(resolve => {
    wx.request({
      url: TEMPLATE_CONFIG_URL,
      method: 'GET',
      success(res) {
        const list = normalizeTemplateList(res.data);
        if (list && list.length) {
          remoteTemplates = list;
          resolve(getTemplates());
          return;
        }
        resolve(getTemplates());
      },
      fail() {
        resolve(getTemplates());
      }
    });
  });
}

module.exports = {
  templates,
  TEMPLATE_CONFIG_URL,
  loadTemplates,
  getTemplates,
  getTemplate,
  cloneTemplate
};
