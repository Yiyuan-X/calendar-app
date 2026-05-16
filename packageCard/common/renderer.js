function copy(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

const VERTICAL_WIDTH_THRESHOLD = 160;
const PREVIEW_STAGE_RPX = 680;
const PREVIEW_STAGE_HEIGHT_RPX = Math.round(1000 * PREVIEW_STAGE_RPX / 750);
const imagePathCache = {};
const fontLoadCache = {};

function getPreviewStageSize(width, height) {
  const sourceWidth = Math.max(Number(width || 750), 1);
  const sourceHeight = Math.max(Number(height || 1000), 1);
  const scale = Math.min(PREVIEW_STAGE_RPX / sourceWidth, PREVIEW_STAGE_HEIGHT_RPX / sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale))
  };
}

function getDpr(exportScale) {
  // 导出分辨率：限制最大 1.5x，避免超大 canvas 导致生成缓慢
  // scale=2 的旧行为会产出 4x 像素（dpr=2 × destWidth=2x），现优化为 2.25x
  return Math.min(Math.max(1, Number(exportScale || 1.5)), 2);
}

function pickFont(style, design) {
  const family = style.fontFamily || design.fontFamily || 'PingFang SC';
  const weight = style.bold ? 'bold' : (style.fontWeight || 'normal');
  const size = parseInt(style.size || style.fontSize || 30, 10) || 30;
  const italic = style.italic ? 'italic ' : '';
  const fontFamily = family.indexOf(',') >= 0 ? family : `"${family}", sans-serif`;
  return `${italic}${weight} ${size}px ${fontFamily}`;
}

function normalizeOps(delta) {
  if (!delta || !delta.ops || !delta.ops.length) return [{ insert: '', attributes: {} }];
  return delta.ops.map(op => ({
    insert: String(op.insert || ''),
    attributes: op.attributes || {}
  }));
}

function splitRuns(ops) {
  const runs = [];
  ops.forEach(op => {
    const parts = String(op.insert || '').split(/(\n)/);
    parts.forEach(part => {
      if (!part) return;
      runs.push({ text: part, style: op.attributes || {}, newline: part === '\n' });
    });
  });
  return runs;
}

function deltaText(delta) {
  return normalizeOps(delta).map(op => op.insert || '').join('');
}

function isVerticalTextBlock(block) {
  if (block && block.textDirection === 'horizontal') return false;
  if (block && block.textDirection === 'vertical') return !!deltaText(block && block.delta).trim();
  return Number((block && block.width) || 500) <= VERTICAL_WIDTH_THRESHOLD && !!deltaText(block && block.delta).trim();
}

function drawRoundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r || 8, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawVerticalGlyph(ctx, glyph, style, block, design, x, y, columnWidth) {
  const fontSize = parseInt(style.size || style.fontSize || 30, 10) || 30;
  const opacity = Number(style.opacity || 1);
  ctx.font = pickFont(style, design);
  ctx.textBaseline = 'top';
  const textWidth = ctx.measureText(glyph).width;
  const drawX = x + (columnWidth - textWidth) / 2;
  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(opacity, 1));

  const shadowEnabled = typeof style.shadow === 'boolean' ? style.shadow : !!block.shadow;
  const strokeEnabled = typeof style.stroke === 'boolean' ? style.stroke : !!block.stroke;

  if (shadowEnabled) {
    ctx.shadowColor = style.shadowColor || block.shadowColor || 'rgba(80,54,30,0.25)';
    ctx.shadowBlur = Number(style.shadowBlur || block.shadowBlur || 10);
    ctx.shadowOffsetX = Number(style.shadowOffsetX || block.shadowOffsetX || 2);
    ctx.shadowOffsetY = Number(style.shadowOffsetY || block.shadowOffsetY || 4);
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  if (style.background || style.backgroundColor) {
    ctx.fillStyle = style.background || style.backgroundColor;
    ctx.fillRect(x - 3, y - 2, columnWidth + 6, fontSize + 5);
  }

  if (strokeEnabled) {
    ctx.strokeStyle = style.strokeColor || block.strokeColor || '#FFFFFF';
    ctx.lineWidth = Number(style.strokeWidth || block.strokeWidth || 2);
    ctx.strokeText(glyph, drawX, y);
  }

  ctx.fillStyle = style.color || block.color || '#333333';
  ctx.fillText(glyph, drawX, y);
  if (style.bold) {
    ctx.fillText(glyph, drawX + Math.max(fontSize * 0.035, 0.8), y);
  }
  if (style.underline) {
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = Math.max(1, fontSize / 16);
    ctx.beginPath();
    ctx.moveTo(drawX, y + fontSize + 3);
    ctx.lineTo(drawX + textWidth, y + fontSize + 3);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 将文本按中文词组拆分为片段，用于竖排时的合理换行
 * 规则：
 * - 英文单词、数字保持完整
 * - 中文按 2 字词组优先（如"心安"、"当下"），长句自适应
 * - 标点符号附着在前一个字符上
 */
function splitTextForVertical(text) {
  const segments = [];
  // 匹配：英文单词/数字 | 中文标点 | 中文字符（成对或单字）
  const re = /[a-zA-Z0-9]+|[，。！？；：""''、…—·\-\(\)\[\]【】《》]|[\u4e00-\u9fa5]/g;
  let match;
  const buffer = []; // 缓存中文字符，尝试组成 2 字词组
  function flushBuffer() {
    if (buffer.length === 1) {
      segments.push(buffer[0]);
    } else if (buffer.length >= 2) {
      // 两两分组，剩余单字单独成段
      for (let i = 0; i < buffer.length; i += 2) {
        if (i + 1 < buffer.length) {
          segments.push(buffer[i] + buffer[i + 1]);
        } else {
          segments.push(buffer[i]);
        }
      }
    }
    buffer.length = 0;
  }

  while ((match = re.exec(text)) !== null) {
    const token = match[0];
    if (/[\u4e00-\u9fa5]/.test(token)) {
      buffer.push(token);
    } else {
      flushBuffer();
      segments.push(token); // 非中文字符直接成段
    }
  }
  flushBuffer();
  return segments;
}

function drawVerticalTextBlock(ctx, block, design) {
  const ops = normalizeOps(block.delta);
  const sourceX = Number(block.x || 0);
  const sourceY = Number(block.y || 0);
  const maxWidth = Number(block.width || 120);
  const boxHeight = Number(block.height || 360);
  const lineHeight = Number(block.lineHeight || 1.6);
  const blockLetterSpacing = Number(block.letterSpacing || 0);
  const rotation = Number(block.rotation || 0);
  const verticalAlign = block.verticalAlign || 'top';
  let x = sourceX;
  let y = sourceY;

  if (rotation) {
    ctx.save();
    ctx.translate(sourceX + maxWidth / 2, sourceY + boxHeight / 2);
    ctx.rotate(rotation * Math.PI / 180);
    x = -maxWidth / 2;
    y = -boxHeight / 2;
  }

  const maxFontSize = ops.reduce((max, op) => {
    const attrs = op.attributes || {};
    return Math.max(max, parseInt(attrs.size || attrs.fontSize || 30, 10) || 30);
  }, 30);
  const columnWidth = Math.max(maxFontSize * 1.2, 28);

  // 收集所有带样式的文本片段（按词组拆分）
  const allSegments = [];
  ops.forEach(op => {
    const style = {
      fontFamily: block.fontFamily,
      fontUrl: block.fontUrl,
      ...(op.attributes || {})
    };
    const fontSize = parseInt(style.size || style.fontSize || 30, 10) || 30;
    const letterSpacing = Number(style.letterSpacing || blockLetterSpacing);
    const stepY = Math.max(fontSize * lineHeight + letterSpacing, fontSize + 4);
    const text = String(op.insert || '');
    if (!text) return;

    // 按词组拆分文本
    const segments = splitTextForVertical(text);
    segments.forEach(seg => {
      if (seg === '\n') {
        allSegments.push({ isNewline: true });
      } else {
        allSegments.push({ text: seg, style, stepY });
      }
    });
  });

  // 将片段分配到列中（每列不超过 boxHeight）
  const columns = [[]];
  let currentHeight = 0;
  allSegments.forEach(seg => {
    if (seg.isNewline) {
      columns.push([]);
      currentHeight = 0;
      return;
    }
    const segHeight = seg.text.length * seg.stepY;
    // 如果当前列放不下这个片段且已有内容，换到下一列
    if (currentHeight + segHeight > boxHeight && currentHeight > 0) {
      columns.push([]);
      currentHeight = 0;
    }
    columns[columns.length - 1].push(seg);
    currentHeight += segHeight;
  });

  const visibleColumns = columns.filter(column => column.length);
  visibleColumns.forEach((column, columnIndex) => {
    const cursorX = x + maxWidth - columnWidth * (columnIndex + 1);
    const columnHeight = column.reduce((sum, item) => sum + item.text.length * item.stepY, 0);
    let cursorY = y;
    if (verticalAlign === 'middle') cursorY = y + Math.max((boxHeight - columnHeight) / 2, 0);
    if (verticalAlign === 'bottom') cursorY = y + Math.max(boxHeight - columnHeight, 0);
    column.forEach(item => {
      // 将片段中的每个字符绘制在同一列
      for (let c = 0; c < item.text.length; c++) {
        drawVerticalGlyph(ctx, item.text[c], item.style, block, design, cursorX, cursorY, columnWidth);
        cursorY += item.stepY;
      }
    });
  });

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  if (rotation) ctx.restore();
}

function measureChar(ctx, ch, letterSpacing) {
  return ctx.measureText(ch).width + (letterSpacing || 0);
}

function splitTextForLineWrap(text) {
  const value = String(text || '');
  const tokens = [];
  const wordRe = /[A-Za-z0-9]+(?:[A-Za-z0-9_'’.\-:/@#%&+=]*[A-Za-z0-9])?[\)\]\}",.!?:;，。！？；：、]*/g;
  let index = 0;
  let match;
  while ((match = wordRe.exec(value)) !== null) {
    if (match.index > index) {
      value.slice(index, match.index).split('').forEach(ch => tokens.push(ch));
    }
    tokens.push(match[0]);
    index = match.index + match[0].length;
  }
  if (index < value.length) {
    value.slice(index).split('').forEach(ch => tokens.push(ch));
  }
  return tokens.filter(Boolean);
}

function measureToken(ctx, token, letterSpacing) {
  const text = String(token || '');
  return ctx.measureText(text).width + Math.max(Number(letterSpacing || 0), 0) * Math.max(text.length - 1, 0);
}

function layoutText(ctx, block, design) {
  const runs = splitRuns(normalizeOps(block.delta));
  const lines = [];
  let line = [];
  let width = 0;
  const maxWidth = Number(block.width || 500);
  const blockLetterSpacing = Number(block.letterSpacing || 0);

  // 中文禁则标点：这些符号不应出现在行首（应与前一个字符粘连）
  const PROHIBIT_LINE_START = /[，。；：！？、》』】）…~\-–—]/;

  function flush() {
    lines.push({ runs: line, width });
    line = [];
    width = 0;
  }

  runs.forEach(run => {
    if (run.newline) {
      flush();
      return;
    }
    splitTextForLineWrap(run.text || '').forEach(token => {
      const style = {
        fontFamily: block.fontFamily,
        fontUrl: block.fontUrl,
        ...(run.style || {})
      };
      ctx.font = pickFont(style, design);
      const tokenWidth = measureToken(ctx, token, Number(style.letterSpacing || blockLetterSpacing));
      if (width + tokenWidth > maxWidth && line.length) {
        // 禁止标点符号出现在行首：将标点挤到上一行末尾
        if (PROHIBIT_LINE_START.test(token)) {
          line.push({ text: token, style, width: tokenWidth });
          width += tokenWidth;
          flush();
        } else {
          flush();
          line.push({ text: token, style, width: tokenWidth });
          width += tokenWidth;
        }
      } else {
        line.push({ text: token, style, width: tokenWidth });
        width += tokenWidth;
      }
    });
  });

  if (line.length || !lines.length) flush();
  return lines;
}

function drawTextBlock(ctx, block, design) {
  if (isVerticalTextBlock(block)) {
    drawVerticalTextBlock(ctx, block, design);
    return;
  }
  const lines = layoutText(ctx, block, design);
  const baseSize = 30;
  const sourceY = Number(block.y || 0);
  const sourceX = Number(block.x || 0);
  const maxWidth = Number(block.width || 500);
  const align = block.align || 'left';
  const lineHeights = lines.map(line => {
    let lineHeight = 0;
    line.runs.forEach(run => {
      const size = parseInt(run.style.size || run.style.fontSize || baseSize, 10) || baseSize;
      lineHeight = Math.max(lineHeight, size * Number(block.lineHeight || 1.6));
    });
    return lineHeight || baseSize * Number(block.lineHeight || 1.6);
  });
  const contentHeight = lineHeights.reduce((sum, item) => sum + item, 0);
  const boxHeight = Number(block.height || contentHeight || 1);
  const rotation = Number(block.rotation || 0);
  const verticalAlign = block.verticalAlign || 'top';
  let x = sourceX;
  let y = sourceY;

  if (rotation) {
    ctx.save();
    ctx.translate(sourceX + maxWidth / 2, sourceY + boxHeight / 2);
    ctx.rotate(rotation * Math.PI / 180);
    x = -maxWidth / 2;
    y = -boxHeight / 2;
  }

  if (verticalAlign === 'middle') {
    y += Math.max((boxHeight - contentHeight) / 2, 0);
  } else if (verticalAlign === 'bottom') {
    y += Math.max(boxHeight - contentHeight, 0);
  }

  // ===== 绘制每一行文字 =====
  lines.forEach((line, lineIndex) => {
    const lineHeight = lineHeights[lineIndex];
    let cursorX = x;
    if (align === 'center') cursorX = x + (maxWidth - line.width) / 2;
    if (align === 'right') cursorX = x + maxWidth - line.width;

    line.runs.forEach(run => {
      const style = run.style || {};
      const fontSize = parseInt(style.size || style.fontSize || baseSize, 10) || baseSize;
      const letterSpacing = Number(style.letterSpacing || block.letterSpacing || 0);
      const opacity = Number(style.opacity || 1);
      ctx.font = pickFont(style, design);
      ctx.textBaseline = 'top';
      const textWidth = Math.max(Number(run.width || 0), ctx.measureText(run.text).width);
      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(opacity, 1));

      const bgStyle = style.background || style.backgroundColor;
      if (bgStyle) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = bgStyle;
        ctx.fillRect(cursorX - 2, y + (lineHeight - fontSize) / 2 - 2, textWidth + 4, fontSize + 4);
      }

      const shadowEnabled = typeof style.shadow === 'boolean' ? style.shadow : !!block.shadow;
      const strokeEnabled = typeof style.stroke === 'boolean' ? style.stroke : !!block.stroke;

      if (shadowEnabled) {
        ctx.shadowColor = style.shadowColor || block.shadowColor || 'rgba(80,54,30,0.25)';
        ctx.shadowBlur = Number(style.shadowBlur || block.shadowBlur || 10);
        ctx.shadowOffsetX = Number(style.shadowOffsetX || block.shadowOffsetX || 2);
        ctx.shadowOffsetY = Number(style.shadowOffsetY || block.shadowOffsetY || 4);
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      if (strokeEnabled) {
        ctx.strokeStyle = style.strokeColor || block.strokeColor || '#FFFFFF';
        ctx.lineWidth = Number(style.strokeWidth || block.strokeWidth || 2);
        ctx.strokeText(run.text, cursorX, y + (lineHeight - fontSize) / 2);
      }

      ctx.fillStyle = style.color || block.color || '#333333';
      ctx.fillText(run.text, cursorX, y + (lineHeight - fontSize) / 2);
      if (style.bold) {
        ctx.fillText(run.text, cursorX + Math.max(fontSize * 0.035, 0.8), y + (lineHeight - fontSize) / 2);
      }
      if (style.underline) {
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = Math.max(1, fontSize / 16);
        const underlineY = y + (lineHeight - fontSize) / 2 + fontSize + 3;
        ctx.beginPath();
        ctx.moveTo(cursorX, underlineY);
        ctx.lineTo(cursorX + textWidth, underlineY);
        ctx.stroke();
      }
      ctx.restore();
      cursorX += textWidth + letterSpacing;
    });

    y += lineHeight;
  });

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  if (rotation) ctx.restore();
}

function drawGradient(ctx, bg, width, height) {
  const direction = bg.direction || 'vertical';
  const gradient = direction === 'diagonal'
    ? ctx.createLinearGradient(0, 0, width, height)
    : ctx.createLinearGradient(0, 0, 0, height);
  const colors = bg.colors || ['#FFFFFF', '#F7F1EA'];
  colors.forEach((color, index) => {
    gradient.addColorStop(colors.length === 1 ? 0 : index / (colors.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function hexToRgb(hex) {
  const value = /^#[0-9a-fA-F]{6}$/.test(String(hex || '')) ? String(hex).slice(1) : 'f7f1ea';
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function glassFillStyle(bg, alpha) {
  const color = bg.glassColor || bg.color || ((bg.colors && bg.colors[0]) || '#F7F1EA');
  const rgb = hexToRgb(color);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function getImagePath(src) {
  return new Promise(resolve => {
    if (!src) {
      resolve('');
      return;
    }
    if (imagePathCache[src]) {
      resolve(imagePathCache[src]);
      return;
    }
    wx.getImageInfo({
      src,
      success: res => {
        imagePathCache[src] = res.path;
        resolve(res.path);
      },
      fail: () => resolve(src)
    });
  });
}

function loadCanvasImage(canvas, src) {
  return new Promise(resolve => {
    if (!canvas || typeof canvas.createImage !== 'function' || !src) {
      resolve(null);
      return;
    }
    getImagePath(src).then(path => {
      const image = canvas.createImage();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = path;
    });
  });
}

function getBackgroundImageRect(bg, width, height) {
  const sourceWidth = Number(bg.bgWidth || width);
  const sourceHeight = Number(bg.bgHeight || height);
  if (!sourceWidth || !sourceHeight) {
    return { x: 0, y: 0, width, height };
  }
  const imageScale = Math.max(0.2, Math.min(Number(bg.scale || 1), 1));
  const scale = Math.min(width / sourceWidth, height / sourceHeight) * imageScale;
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const maxOffsetX = Math.max(0, (width - drawWidth) / 2);
  const maxOffsetY = Math.max(0, (height - drawHeight) / 2);
  const previewStage = getPreviewStageSize(width, height);
  const offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, Number(bg.offsetX || 0) * width / previewStage.width));
  const offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, Number(bg.offsetY || 0) * height / previewStage.height));
  const x = (width - drawWidth) / 2 + offsetX;
  const y = (height - drawHeight) / 2 + offsetY;
  const cropX = Math.max(0, x);
  const cropY = Math.max(0, y);
  const cropRight = Math.min(width, x + drawWidth);
  const cropBottom = Math.min(height, y + drawHeight);
  return {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.max(1, Math.round(cropRight - cropX)),
    height: Math.max(1, Math.round(cropBottom - cropY))
  };
}

async function drawBackground(canvas, ctx, design, width, height) {
  const bg = design.background || {};
  ctx.fillStyle = bg.color || '#F7F1EA';
  ctx.fillRect(0, 0, width, height);
  if (bg.type === 'image' && bg.src) {
    const path = await getImagePath(bg.src);
    const image = await loadCanvasImage(canvas, path);
    try {
      if (!image) throw new Error('background image load failed');
      const sourceWidth = Number(bg.bgWidth || image.width || width);
      const sourceHeight = Number(bg.bgHeight || image.height || height);
      const imageScale = Math.max(0.2, Math.min(Number(bg.scale || 1), 1));
      const scale = Math.min(width / sourceWidth, height / sourceHeight) * imageScale;
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      const maxOffsetX = Math.max(0, (width - drawWidth) / 2);
      const maxOffsetY = Math.max(0, (height - drawHeight) / 2);
      const previewStage = getPreviewStageSize(width, height);
      const offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, Number(bg.offsetX || 0) * width / previewStage.width));
      const offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, Number(bg.offsetY || 0) * height / previewStage.height));
      const drawX = (width - drawWidth) / 2 + offsetX;
      const drawY = (height - drawHeight) / 2 + offsetY;
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      if (bg.blur) {
        ctx.fillStyle = glassFillStyle(bg, 0.24);
        ctx.fillRect(0, 0, width, height);
      }
      return;
    } catch (e) {}
  }
  if (bg.type === 'gradient') {
    drawGradient(ctx, bg, width, height);
    if (bg.blur) {
      ctx.fillStyle = glassFillStyle(bg, 0.24);
      ctx.fillRect(0, 0, width, height);
    }
    drawPaperTexture(ctx, bg, width, height);
    return;
  }
  if (bg.blur) {
    ctx.fillStyle = glassFillStyle(bg, 0.24);
    ctx.fillRect(0, 0, width, height);
  }
  drawPaperTexture(ctx, bg, width, height);
}

function drawPaperTexture(ctx, bg, width, height) {
  if (!bg || !bg.paper) return;
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#8B623D';
  for (let i = 0; i < 220; i++) {
    const x = (i * 73) % width;
    const y = (i * 137) % height;
    const size = 0.7 + (i % 3) * 0.35;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#A77E50';
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const y = 40 + i * 72;
    ctx.beginPath();
    ctx.moveTo(42, y);
    ctx.lineTo(width - 42, y + ((i % 2) ? 6 : -4));
    ctx.stroke();
  }
  ctx.restore();
}

async function drawImageLayer(canvas, ctx, layer) {
  if (!layer || !layer.src || layer.visible === false) return;
  const image = await loadCanvasImage(canvas, layer.src);
  if (!image) return;
  const x = Number(layer.x || 0);
  const y = Number(layer.y || 0);
  const size = Number(layer.size || layer.width || 120);
  try {
    if (layer.radius) {
      ctx.save();
      drawRoundRect(ctx, x, y, size, size, Number(layer.radius));
      ctx.clip();
      ctx.drawImage(image, x, y, size, size);
      ctx.restore();
    } else {
      ctx.drawImage(image, x, y, size, size);
    }
  } catch (e) {}
}

function drawDecorations(ctx, decorations) {
  (decorations || []).forEach(item => {
    if (item.type === 'line') {
      ctx.strokeStyle = item.color || 'rgba(0,0,0,0.2)';
      ctx.lineWidth = Number(item.height || 1);
      ctx.beginPath();
      ctx.moveTo(Number(item.x || 0), Number(item.y || 0));
      ctx.lineTo(Number(item.x || 0) + Number(item.width || 100), Number(item.y || 0));
      ctx.stroke();
    }
  });
}

function collectFonts(design) {
  const map = {};
  if (design.fontUrl) {
    map[design.fontFamily || 'CardSerif'] = design.fontUrl;
  }
  (design.blocks || []).forEach(block => {
    if (block.fontUrl && block.fontFamily) map[block.fontFamily] = block.fontUrl;
    normalizeOps(block.delta).forEach(op => {
      const attrs = op.attributes || {};
      if (attrs.fontUrl && attrs.fontFamily) map[attrs.fontFamily] = attrs.fontUrl;
    });
  });
  return Object.keys(map).map(family => ({ family, url: map[family] }));
}

async function preloadFont(design) {
  const fonts = collectFonts(design);
  if (!fonts.length) return;
  await Promise.all(fonts.map(font => new Promise(resolve => {
    const key = `${font.family}|${font.url}`;
    if (fontLoadCache[key]) {
      resolve();
      return;
    }
    // 字体加载设置 8 秒超时，超时后不阻塞渲染（用系统字体降级）
    const timer = setTimeout(() => {
      resolve();
    }, 8000);
    wx.loadFontFace({
      family: font.family,
      source: `url("${font.url}")`,
      global: true,
      success: () => {
        fontLoadCache[key] = true;
        clearTimeout(timer);
        resolve();
      },
      fail: () => {
        clearTimeout(timer);
        resolve();
      }
    });
  })));
  design.fontFamily = design.fontFamily || 'CardSerif';
}

async function drawPosterToCanvas(page, selector, sourceDesign, options) {
  const design = copy(sourceDesign);
  const fullWidth = Number((design.size && design.size.width) || 750);
  const fullHeight = Number((design.size && design.size.height) || 1000);
  const viewport = options && options.cropToBackgroundImage && design.background && design.background.type === 'image' && design.background.src
    ? getBackgroundImageRect(design.background, fullWidth, fullHeight)
    : { x: 0, y: 0, width: fullWidth, height: fullHeight };
  const width = viewport.width;
  const height = viewport.height;
  const scale = Number((options && options.scale) || 2);
  const dpr = Number((options && options.dpr) || getDpr(scale));

  if (!options || options.preloadFonts !== false) {
    await preloadFont(design);
  }
  const node = await new Promise((resolve, reject) => {
    wx.createSelectorQuery().in(page).select(selector).fields({ node: true, size: true }).exec(res => {
      if (!res || !res[0] || !res[0].node) reject(new Error('canvas missing'));
      else resolve(res[0].node);
    });
  });
  const ctx = node.getContext('2d');
  node.width = width * dpr;
  node.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(-viewport.x, -viewport.y);

  await drawBackground(node, ctx, design, fullWidth, fullHeight);
  drawDecorations(ctx, design.decorations);
  await drawImageLayer(node, ctx, design.avatar);
  await drawImageLayer(node, ctx, design.overlayImage);
  const hiddenBlockIds = new Set((options && options.hiddenBlockIds) || []);
  (design.blocks || []).forEach(block => {
    if (hiddenBlockIds.has(block.id)) return;
    if (block.type === 'text') drawTextBlock(ctx, block, design);
  });
  await drawImageLayer(node, ctx, design.qrcode);
  for (const qr of (design.qrcodes || [])) {
    await drawImageLayer(node, ctx, qr);
  }
  ctx.restore();
  return { node, width, height, scale };
}

async function exportPoster(page, selector, sourceDesign, options) {
  const result = await drawPosterToCanvas(page, selector, sourceDesign, options);
  const node = result.node;
  const width = result.width;
  const height = result.height;
  const scale = result.scale;

  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas: node,
      width,
      height,
      destWidth: width * scale,
      destHeight: height * scale,
      fileType: 'png',
      quality: 1,
      success: res => resolve(res.tempFilePath),
      fail: reject
    });
  });
}

function _drawRoundedRect(ctx, x, y, w, h, r) {
  if (w < 1 || h < 1) return;
  r = Math.min(r, Math.min(w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h, r);
  ctx.lineTo(x, y + r);
  ctx.closePath();
  ctx.fill();
}

module.exports = {
  exportPoster,
  drawPosterToCanvas,
  layoutText
};
