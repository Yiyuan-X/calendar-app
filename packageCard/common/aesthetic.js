const KEYWORDS = ['平静', '自在', '慈悲', '智慧', '清明', '欢喜', '安住', '当下', '心', '静', '善', '福', '悟', '慢'];

const STYLE_PRESETS = {
  'daily-sign-warm': {
    id: 'daily-sign-warm',
    name: '日签版',
    accent: '#A77E50',
    focus: '#6B4F39',
    body: '#8A705B',
    bg: { type: 'gradient', colors: ['#FFF8ED', '#F2E6D7'], direction: 'vertical', paper: true },
    meta: '',
    align: 'center'
  },
  'mindful-quote': {
    id: 'mindful-quote',
    name: '禅意版',
    accent: '#B98568',
    focus: '#5A4335',
    body: '#8B7464',
    bg: { type: 'gradient', colors: ['#FBF2E8', '#EFE1D0'], direction: 'vertical', blur: true, paper: true },
    meta: '',
    align: 'center'
  },
  'solar-term-paper': {
    id: 'solar-term-paper',
    name: '节气版',
    accent: '#9B8A57',
    focus: '#4F654C',
    body: '#7A765F',
    bg: { type: 'gradient', colors: ['#F7EEDD', '#E8E8D6'], direction: 'diagonal', paper: true },
    meta: '',
    align: 'left'
  },
  'practice-check': {
    id: 'practice-check',
    name: '功课打卡版',
    accent: '#A8794E',
    focus: '#684A32',
    body: '#8B6D51',
    bg: { type: 'gradient', colors: ['#FFF4E0', '#E9D7BF'], direction: 'vertical', paper: true },
    meta: '',
    align: 'left'
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\s+/g, '')
    .replace(/[“”"「」]/g, '')
    .trim();
}

function findKeyword(text) {
  return KEYWORDS.find(word => text.indexOf(word) >= 0) || '';
}

function splitByPunctuation(text) {
  const parts = text
    .split(/[，。！？；：,.!?;:、]/)
    .map(item => item.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      lead: parts.slice(0, -1).join('，'),
      focus: parts[parts.length - 1]
    };
  }
  return null;
}

function splitByKeyword(text, keyword) {
  if (!keyword || text.length <= keyword.length + 2) return null;
  const index = text.lastIndexOf(keyword);
  if (index < 0) return null;
  const focusStart = Math.max(0, index - 2);
  const lead = text.slice(0, focusStart);
  const focus = text.slice(focusStart);
  if (lead.length >= 3 && focus.length >= 2) return { lead, focus };
  return null;
}

function splitByPivot(text) {
  const pivots = ['的是', '就是', '在于', '因为', '愿你', '愿我', '让', '把', '是'];
  for (let i = 0; i < pivots.length; i++) {
    const pivot = pivots[i];
    const index = text.indexOf(pivot);
    if (index > 1 && index + pivot.length < text.length - 1) {
      return {
        lead: text.slice(0, index + pivot.length),
        focus: text.slice(index + pivot.length)
      };
    }
  }
  return null;
}

function splitByLength(text) {
  if (text.length <= 8) return { lead: '', focus: text };
  const target = text.length <= 14 ? Math.ceil(text.length * 0.58) : Math.ceil(text.length * 0.5);
  return {
    lead: text.slice(0, target),
    focus: text.slice(target)
  };
}

function splitText(text) {
  const value = normalizeText(text);
  const keyword = findKeyword(value);
  const result = splitByPunctuation(value) || splitByPivot(value) || splitByKeyword(value, keyword) || splitByLength(value);
  return {
    lead: result.lead,
    focus: result.focus,
    keyword
  };
}

function getLengthProfile(text) {
  const length = normalizeText(text).length;
  if (length <= 8) return { mainSize: 56, leadSize: 34, y: 300, lineHeight: 1.9, letterSpacing: 5 };
  if (length <= 16) return { mainSize: 52, leadSize: 32, y: 248, lineHeight: 1.88, letterSpacing: 4 };
  if (length <= 28) return { mainSize: 44, leadSize: 29, y: 210, lineHeight: 1.82, letterSpacing: 3 };
  return { mainSize: 36, leadSize: 27, y: 172, lineHeight: 1.78, letterSpacing: 2 };
}

function buildFocusOps(text, keyword, preset, profile) {
  if (!keyword || text.indexOf(keyword) < 0) {
    return [{ insert: text, attributes: focusStyle(preset, profile) }];
  }

  const parts = [];
  let rest = text;
  while (rest) {
    const index = rest.indexOf(keyword);
    if (index < 0) {
      parts.push({ insert: rest, attributes: focusStyle(preset, profile) });
      break;
    }
    if (index > 0) {
      parts.push({ insert: rest.slice(0, index), attributes: focusStyle(preset, profile) });
    }
    parts.push({
      insert: keyword,
      attributes: {
        ...focusStyle(preset, profile),
        color: preset.accent,
        background: 'rgba(255, 244, 222, 0.72)'
      }
    });
    rest = rest.slice(index + keyword.length);
  }
  return parts;
}

function focusStyle(preset, profile) {
  return {
    size: profile.mainSize,
    color: preset.focus,
    bold: true,
    letterSpacing: profile.letterSpacing
  };
}

function buildDelta(text, preset, profile) {
  const split = splitText(text);
  const ops = [];
  if (split.lead) {
    ops.push({
      insert: split.lead + '\n\n',
      attributes: {
        size: profile.leadSize,
        color: preset.body,
        letterSpacing: Math.max(profile.letterSpacing - 1, 1)
      }
    });
  }
  buildFocusOps(split.focus, split.keyword, preset, profile).forEach(op => ops.push(op));
  return { ops };
}

function applyAesthetic(template, text, styleId) {
  const design = clone(template);
  const preset = STYLE_PRESETS[styleId] || STYLE_PRESETS[design.templateId] || STYLE_PRESETS[design.id] || STYLE_PRESETS['mindful-quote'];
  const inputText = normalizeText(text) || '人生最重要的是内心平静';
  const profile = getLengthProfile(inputText);
  const align = preset.align || 'center';
  const textX = align === 'left' ? 88 : 92;
  const textWidth = align === 'left' ? 574 : 566;

  design.id = design.id || '';
  design.templateId = preset.id;
  design.name = preset.name;
  design.inputText = inputText;
  design.styleId = preset.id;
  design.background = clone(preset.bg);
  design.fontUrl = design.fontUrl || template.fontUrl || '';
  design.blocks = [
    {
      id: 'quote',
      type: 'text',
      x: textX,
      y: profile.y,
      width: textWidth,
      align,
      lineHeight: profile.lineHeight,
      letterSpacing: profile.letterSpacing,
      shadow: false,
      delta: buildDelta(inputText, preset, profile)
    }
  ];
  design.decorations = [
    {
      type: 'line',
      x: align === 'left' ? 88 : 258,
      y: 690,
      width: align === 'left' ? 260 : 234,
      color: 'rgba(167, 126, 80, 0.34)'
    }
  ];
  design.qrcode = { ...(design.qrcode || {}), visible: false, src: '' };
  return design;
}

module.exports = {
  KEYWORDS,
  STYLE_PRESETS,
  applyAesthetic,
  splitText
};
