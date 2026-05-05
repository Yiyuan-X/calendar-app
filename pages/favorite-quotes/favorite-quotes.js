const storage = require('../../utils/storage');
const share = require('../../utils/share');
const poster = require('../../utils/poster');
const analytics = require('../../utils/analytics');

Page({
  data: {
    quotes: []
  },

  onLoad() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    this.loadQuotes();
  },

  onShow() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    this.loadQuotes();
  },

  loadQuotes() {
    const quotes = storage.getFavoriteQuotes().map(item => ({
      ...item,
      dateText: item.createdAt ? this.formatDate(new Date(item.createdAt)) : ''
    }));
    this.setData({ quotes });
  },

  removeQuote(e) {
    const text = e.currentTarget.dataset.text || '';
    wx.showModal({
      title: '取消收藏',
      content: '确定取消收藏这句金句吗？',
      confirmText: '取消收藏',
      confirmColor: '#C2410C',
      success: res => {
        if (!res.confirm) return;
        const result = storage.toggleFavoriteQuote(text);
        analytics.track('quote_favorite', { favorited: result.favorited, quote: text, source: 'favorite_list' });
        this.loadQuotes();
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      }
    });
  },

  generateQuotePoster(e) {
    const text = e.currentTarget.dataset.text || '';
    if (!text) return;
    this.drawQuotePoster(text, res => {
      if (res.success) {
        wx.previewImage({ urls: [res.tempFilePath], current: res.tempFilePath });
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  drawQuotePoster(text, callback) {
    const that = this;
    wx.showLoading({ title: '正在生成...' });
    wx.createSelectorQuery().select('#quoteCanvas').fields({ node: true, size: true }).exec(function(res) {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading();
        callback({ success: false });
        return;
      }
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio || 1;
      const W = 500;
      const H = 650;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      try {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#FFF8E7');
        bg.addColorStop(1, '#FFF3D6');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.strokeRect(16, 16, W - 32, H - 32);

        ctx.fillStyle = '#8B6914';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('今日签 · 岁时记', W / 2, 72);

        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        that.drawRoundRect(ctx, 42, 130, W - 84, 300, 18);
        ctx.fill();

        ctx.fillStyle = '#6D5A2E';
        ctx.font = 'bold 27px sans-serif';
        that.wrapText(ctx, '「' + text + '」', 76, 198, W - 152, 40, true);

        ctx.fillStyle = '#AEAEB2';
        ctx.font = '15px sans-serif';
        ctx.fillText('— 岁时记 · 收藏金句 —', W / 2, H - 54);
        ctx.font = '12px sans-serif';
        ctx.fillText('长按识别小程序码查看更多', W / 2, H - 30);

        poster.drawPromotionCode(canvas, ctx, {
          x: W - 112,
          y: H - 148,
          size: 72,
          src: '/images/PQ_today.png'
        }, function() {
          setTimeout(function() {
            wx.canvasToTempFilePath({
              canvas,
              width: W,
              height: H,
              destWidth: W * 2,
              destHeight: H * 2,
              fileType: 'jpg',
              quality: 0.95,
              success: function(saveRes) {
                analytics.track('poster_generate', { page: 'favorite_quotes' });
                wx.hideLoading();
                callback({ success: true, tempFilePath: saveRes.tempFilePath });
              },
              fail: function() {
                wx.hideLoading();
                callback({ success: false });
              }
            });
          }, 100);
        });
      } catch (e) {
        wx.hideLoading();
        callback({ success: false });
      }
    });
  },

  drawRoundRect(ctx, x, y, w, h, r) {
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
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight, center) {
    const breakChars = ' ，。！？、；：""\'\'（）【】《》…—\n\t\r';
    const chars = String(text || '').split('');
    let line = '';
    let curY = y;
    let lastBreakPos = -1;
    chars.forEach(char => {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        if (lastBreakPos >= 0 && lastBreakPos < line.length) {
          ctx.fillText(line.substring(0, lastBreakPos + 1), center ? x + maxWidth / 2 : x, curY);
          line = line.substring(lastBreakPos + 1) + char;
        } else {
          ctx.fillText(line, center ? x + maxWidth / 2 : x, curY);
          line = char;
        }
        curY += lineHeight;
        lastBreakPos = -1;
      } else {
        line = testLine;
        if (breakChars.indexOf(char) >= 0) lastBreakPos = line.length - 1;
      }
    });
    if (line) ctx.fillText(line, center ? x + maxWidth / 2 : x, curY);
  },

  formatDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日收藏`;
  },

  onShareAppMessage() {
    return share.appMessage({
      title: '我的金句收藏 · 岁时记',
      path: '/pages/favorite-quotes/favorite-quotes'
    });
  },

  onShareTimeline() {
    return share.timeline({ title: '我的金句收藏 · 岁时记' });
  }
});
