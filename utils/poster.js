const PROMO_CODE_PATH = '/images/promo-qrcode.png';

function drawPromotionCode(canvas, ctx, options, done) {
  const opts = options || {};
  const callback = typeof done === 'function' ? done : function() {};

  if (!canvas || typeof canvas.createImage !== 'function') {
    callback(false);
    return;
  }

  const size = opts.size || 82;
  const x = opts.x || 386;
  const y = opts.y || 595;
  const padding = opts.padding === undefined ? 8 : opts.padding;
  const image = canvas.createImage();

  image.onload = function() {
    try {
      drawRoundedRect(ctx, x - padding, y - padding, size + padding * 2, size + padding * 2, 12);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = 'rgba(218, 165, 32, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.drawImage(image, x, y, size, size);
      callback(true);
    } catch (e) {
      callback(false);
    }
  };

  image.onerror = function() {
    callback(false);
  };

  image.src = opts.src || PROMO_CODE_PATH;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

module.exports = {
  PROMO_CODE_PATH,
  drawPromotionCode
};
