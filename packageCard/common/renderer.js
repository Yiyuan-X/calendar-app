function copy(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function getDpr(exportScale) {
  const info = wx.getSystemInfoSync();
  return Math.max(info.pixelRatio || 2, exportScale || 2);
}

function pickFont(style, design) {
  const family = style.fontFamily || design.fontFamily || 'PingFang SC';
  const weight = style.bold ? 'bold' : (style.fontWeight || 'normal');
  const size = parseInt(style.size || style.fontSize || 30, 10) || 30;
  return `${weight} ${size}px "${family}", sans-serif`;
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

function measureChar(ctx, ch, letterSpacing) {
  return ctx.measureText(ch).width + (letterSpacing || 0);
}

function layoutText(ctx, block, design) {
  const runs = splitRuns(normalizeOps(block.delta));
  const lines = [];
  let line = [];
  let width = 0;
  const maxWidth = Number(block.width || 500);
  const blockLetterSpacing = Number(block.letterSpacing || 0);

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
    const text = run.text || '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const style = { ...(run.style || {}) };
      ctx.font = pickFont(style, design);
      const chWidth = measureChar(ctx, ch, Number(style.letterSpacing || blockLetterSpacing));
      if (width + chWidth > maxWidth && line.length) {
        flush();
      }
      line.push({ text: ch, style, width: chWidth });
      width += chWidth;
    }
  });

  if (line.length || !lines.length) flush();
  return lines;
}

function drawTextBlock(ctx, block, design) {
  const lines = layoutText(ctx, block, design);
  const baseSize = 30;
  let y = Number(block.y || 0);
  const x = Number(block.x || 0);
  const maxWidth = Number(block.width || 500);
  const align = block.align || 'left';

  lines.forEach(line => {
    let lineHeight = 0;
    line.runs.forEach(run => {
      const size = parseInt(run.style.size || run.style.fontSize || baseSize, 10) || baseSize;
      lineHeight = Math.max(lineHeight, size * Number(block.lineHeight || 1.6));
    });
    let cursorX = x;
    if (align === 'center') cursorX = x + (maxWidth - line.width) / 2;
    if (align === 'right') cursorX = x + maxWidth - line.width;

    line.runs.forEach(run => {
      const style = run.style || {};
      const fontSize = parseInt(style.size || style.fontSize || baseSize, 10) || baseSize;
      const letterSpacing = Number(style.letterSpacing || block.letterSpacing || 0);
      ctx.font = pickFont(style, design);
      ctx.textBaseline = 'top';

      if (style.shadow || block.shadow) {
        ctx.shadowColor = style.shadowColor || block.shadowColor || 'rgba(80,54,30,0.25)';
        ctx.shadowBlur = Number(style.shadowBlur || 10);
        ctx.shadowOffsetX = Number(style.shadowOffsetX || 2);
        ctx.shadowOffsetY = Number(style.shadowOffsetY || 4);
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      if (style.background || style.backgroundColor) {
        ctx.fillStyle = style.background || style.backgroundColor;
        ctx.fillRect(cursorX - 3, y + (lineHeight - fontSize) / 2 - 2, run.width + 6, fontSize + 5);
      }

      if (style.stroke || block.stroke) {
        ctx.strokeStyle = style.strokeColor || block.strokeColor || '#FFFFFF';
        ctx.lineWidth = Number(style.strokeWidth || block.strokeWidth || 2);
        ctx.strokeText(run.text, cursorX, y + (lineHeight - fontSize) / 2);
      }

      ctx.fillStyle = style.color || block.color || '#333333';
      ctx.fillText(run.text, cursorX, y + (lineHeight - fontSize) / 2);
      cursorX += ctx.measureText(run.text).width + letterSpacing;
    });

    y += lineHeight;
  });

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
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

function getImagePath(src) {
  return new Promise(resolve => {
    if (!src) {
      resolve('');
      return;
    }
    wx.getImageInfo({
      src,
      success: res => resolve(res.path),
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

async function drawBackground(canvas, ctx, design, width, height) {
  const bg = design.background || {};
  if (bg.type === 'image' && bg.src) {
    const path = await getImagePath(bg.src);
    const image = await loadCanvasImage(canvas, path);
    try {
      if (!image) throw new Error('background image load failed');
      ctx.drawImage(image, 0, 0, width, height);
      if (bg.blur) {
        ctx.fillStyle = 'rgba(250,244,235,0.42)';
        ctx.fillRect(0, 0, width, height);
      }
      return;
    } catch (e) {}
  }
  if (bg.type === 'gradient') {
    drawGradient(ctx, bg, width, height);
    drawPaperTexture(ctx, bg, width, height);
    return;
  }
  ctx.fillStyle = bg.color || '#F7F1EA';
  ctx.fillRect(0, 0, width, height);
  if (bg.blur) {
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(32, 32, width - 64, height - 64);
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

async function preloadFont(design) {
  if (!design.fontUrl) return;
  await new Promise(resolve => {
    wx.loadFontFace({
      family: design.fontFamily || 'CardSerif',
      source: `url("${design.fontUrl}")`,
      global: false,
      success: resolve,
      fail: resolve
    });
  });
  design.fontFamily = design.fontFamily || 'CardSerif';
}

async function exportPoster(page, selector, sourceDesign, options) {
  const design = copy(sourceDesign);
  const width = Number((design.size && design.size.width) || 750);
  const height = Number((design.size && design.size.height) || 1000);
  const scale = Number((options && options.scale) || 2);
  const dpr = getDpr(scale);

  await preloadFont(design);
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

  await drawBackground(node, ctx, design, width, height);
  drawDecorations(ctx, design.decorations);
  await drawImageLayer(node, ctx, design.avatar);
  await drawImageLayer(node, ctx, design.overlayImage);
  (design.blocks || []).forEach(block => {
    if (block.type === 'text') drawTextBlock(ctx, block, design);
  });
  await drawImageLayer(node, ctx, design.qrcode);

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

module.exports = {
  exportPoster,
  layoutText
};
