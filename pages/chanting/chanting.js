// pages/chanting/chanting.js — 功课计数器主页面
const chant = require('../../utils/chanting');
const privacy = require('../../utils/privacy');
const share = require('../../utils/share');
const poster = require('../../utils/poster');

Page({
  data: {
    tasks: [],
    taskData: [],      // 带今日计数和进度的展示数据
    todaySummary: { completed: 0, total: 0, tasks: 0 },
    showYesterdayTip: false,
    yesterdayIncomplete: [],
    pageMotto: '',
    quickSuggestions: [
      { id: 'b2', name: '大悲咒' },
      { id: 'b3', name: '心经' }
    ],
    quickCount: 0,       // 通用计数器
    showPrivacyAuthorization: false,
    privacyContractName: '用户隐私保护指引'
  },

  onShow() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
    try {
      this.loadData();
      // 加载通用计数器
      const qc = wx.getStorageSync('quick_count') || 0;
      this.setData({
        quickCount: qc,
        pageMotto: chant.getRandomMotto()
      });
    } catch (e) {
      console.error('loadData 出错:', e);
      this.setData({ tasks: [], taskData: [], todaySummary: { completed: 0, total: 0, tasks: 0 } });
    }
  },

  loadData() {
    const tasks = chant.getTasks();
    const today = chant.getToday();
    const dayRec = chant.getDayRecord(today);

    // 构建展示数据
    const taskData = (tasks || []).map(t => {
      const todayCount = (dayRec && dayRec[t.id]) || 0;
      const total = chant.getTaskTotal(t.id);
      // 每日目标达标：今天计数 >= 每日目标
      const isDailyDone = t.dailyTarget > 0 && todayCount >= t.dailyTarget;
      // 总目标达标：累计总数 >= 总目标
      const isTotalDone = t.totalTarget > 0 && total >= t.totalTarget;
      return {
        ...t,
        todayCount,
        total: total || 0,
        isDailyDone,
        isTotalDone,
        progressPercent: t.dailyTarget > 0 ? Math.min(100, (todayCount / t.dailyTarget) * 100) : 0,
        totalProgressPercent: t.totalTarget > 0 ? Math.min(100, ((total || 0) / t.totalTarget) * 100) : 0
      };
    });

    // 今日完成情况（基于实际达标数计算）
    let completed = 0, total = 0;
    (taskData || []).forEach(item => {
      if (item.dailyTarget > 0 || item.totalTarget > 0) {
        total++;
        if (item.isDailyDone || (item.dailyTarget === 0 && item.isTotalDone)) completed++;
      }
    });
    const summary = { completed, total, tasks: (tasks || []).length };

    // 昨日未完成提示（仅显示一次）
    let showTip = false;
    let incomplete = [];
    if (!this._tipShown) {
      try {
        incomplete = chant.getYesterdayIncomplete();
        if (incomplete.length > 0) {
          showTip = true;
          this._tipShown = true;
        }
      } catch(e) { /* 忽略 */ }
    }

    this.setData({
      tasks: tasks || [],
      taskData: taskData || [],
      todaySummary: summary,
      showYesterdayTip: showTip,
      yesterdayIncomplete: incomplete || []
    });
  },

  onShareAppMessage() {
    const summary = this.data.todaySummary || {};
    return share.appMessage({
      title: `今日修行 ${summary.completed || 0}/${summary.total || 0} 项 · 岁时记`,
      path: '/pages/chanting/chanting'
    });
  },

  onShareTimeline() {
    const summary = this.data.todaySummary || {};
    return share.timeline({
      title: `今日修行 ${summary.completed || 0}/${summary.total || 0} 项 · 岁时记`
    });
  },

  /** +1 */
  onIncrement(e) {
    const id = e.currentTarget.dataset.id;
    chant.increment(id, chant.getToday(), 1);
    this.loadData();

    // 轻触反馈
    wx.vibrateShort({ type: 'light' });
  },

  /** -1 */
  onDecrement(e) {
    const id = e.currentTarget.dataset.id;
    const today = chant.getToday();
    const rec = chant.getDayRecord(today);
    const cur = rec[id] || 0;
    if (cur <= 1) {
      chant.clearCount(id, today);
    } else {
      chant.increment(id, today, -1);
    }
    this.loadData();
  },

  /** 清零（仅清今日该通道） */
  onClear(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '清零确认',
      content: '确定清零今日计数？累计总数不变',
      confirmColor: '#FF9500',
      success: (res) => {
        if (res.confirm) {
          chant.clearCount(id, chant.getToday());
          this.loadData();
          wx.showToast({ title: '已清零', icon: 'success' });
        }
      }
    });
  },

  /** 删除整个功课 */
  onDeleteTask(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    wx.showModal({
      title: '删除功课',
      content: '确定删除「' + name + '」？所有记录将被清除',
      confirmColor: '#FF3B30',
      confirmText: '删除',
      success: (res) => {
        if (res.confirm) {
          chant.deleteTask(id);
          this.loadData();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/chanting-add/chanting-add' });
  },

  onQuickAddTask(e) {
    const id = e.currentTarget.dataset.id;
    const item = chant.BUILTIN.find(task => task.id === id);
    if (!item) return;

    const task = chant.addTask(item.name, item.unit, 0, 0, false, item.id);
    if (!task) {
      wx.showToast({ title: '已添加过', icon: 'none' });
      return;
    }

    wx.showToast({ title: '已添加', icon: 'success' });
    this.loadData();
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/chanting-detail/chanting-detail?id=' + e.currentTarget.dataset.id });
  },
  goSupplement() {
    const first = this.data.yesterdayIncomplete && this.data.yesterdayIncomplete[0];
    if (!first || !first.id) {
      wx.showToast({ title: '暂无可补录功课', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/chanting-detail/chanting-detail?id=' + first.id + '&mode=supplement' });
  },

  goSetTarget() {
    const tasks = this.data.tasks || [];
    if (!tasks.length) {
      wx.showToast({ title: '请先添加功课', icon: 'none' });
      return;
    }

    const openDetail = (taskId) => {
      wx.navigateTo({ url: '/pages/chanting-detail/chanting-detail?id=' + taskId + '&mode=target' });
    };

    if (tasks.length === 1) {
      openDetail(tasks[0].id);
      return;
    }

    wx.showActionSheet({
      itemList: tasks.slice(0, 6).map(task => task.name.length > 12 ? task.name.slice(0, 12) + '...' : task.name),
      success: (res) => {
        const task = tasks[res.tapIndex];
        if (task) openDetail(task.id);
      }
    });
  },

  // ==================== 通用计数器 ====================

  /** 通用计数器 +1 */
  onQcIncrement() {
    const newVal = this.data.quickCount + 1;
    this.setData({ quickCount: newVal });
    wx.setStorageSync('quick_count', newVal);
    wx.vibrateShort({ type: 'light' });
  },

  /** 通用计数器 -1 */
  onQcDecrement() {
    const newVal = this.data.quickCount - 1;
    this.setData({ quickCount: newVal });
    wx.setStorageSync('quick_count', newVal);
  },

  /** 通用计数器重置 */
  onQcReset() {
    wx.showModal({
      title: '重置确认',
      content: '确定将通用计数器归零？',
      confirmColor: '#FF9500',
      success: (res) => {
        if (res.confirm) {
          this.setData({ quickCount: 0 });
          wx.setStorageSync('quick_count', 0);
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },

  // ==================== 朋友圈分享图 ====================

  /** 分享到朋友圈（生成海报图片） */
  shareToMoments() {
    this.generateShareImage((res) => {
      if (res.success) {
        wx.previewImage({
          urls: [res.tempFilePath],
          current: res.tempFilePath
        });
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  /** 保存到相册 */
  saveShareImage() {
    const that = this;
    this.generateShareImage((res) => {
      if (res.success) {
        privacy.ensurePrivacyAuthorized({
          success: () => {
            that.saveImageToAlbum(res.tempFilePath);
          }
        });
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  saveImageToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
      fail: (err) => {
        if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册权限',
            confirmText: '去设置',
            success: (modalRes) => { if (modalRes.confirm) wx.openSetting(); }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  openPrivacyContract() {
    privacy.openPrivacyContract();
  },

  onAgreePrivacyAuthorization(e) {
    privacy.agreePrivacyAuthorization(this, e.detail);
  },

  onDisagreePrivacyAuthorization() {
    privacy.disagreePrivacyAuthorization(this);
  },

  noop() {},

  /** 生成朋友圈分享图 */
  generateShareImage(callback) {
    const that = this;
    const tasks = that.data.tasks;
    const taskData = that.data.taskData;
    const summary = that.data.todaySummary;

    // 计算今日总计数
    let todayTotalCount = 0;
    taskData.forEach(item => { todayTotalCount += item.todayCount; });

    // 获取连续天数
    const streakDays = chant.getGlobalStreakDays();

    // 获取随机金句
    const quote = chant.getRandomQuote();

    // 格式化日期
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekNames[now.getDay()];
    const dateStr = month + '月' + day + '日 ' + weekDay;

    wx.showLoading({ title: '正在生成...' });

    const query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec(function(res) {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading();
        callback({ success: false });
        return;
      }

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;

      const W = 500;
      const H = 750;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      try {
        // ===== 背景：渐变暖色 =====
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#FFF8E7');
        bgGrad.addColorStop(0.3, '#FFFBF0');
        bgGrad.addColorStop(0.7, '#FFF3D6');
        bgGrad.addColorStop(1, '#FFE8B5');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // ===== 顶部装饰圆 =====
        ctx.beginPath();
        ctx.arc(W / 2, -80, 220, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,179,0,0.08)';
        ctx.fill();

        // ===== 标题区域 =====
        ctx.fillStyle = '#8B6914';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('今日修行打卡', W / 2, 65);

        // ===== 日期 =====
        ctx.fillStyle = '#A0824A';
        ctx.font = '22px sans-serif';
        ctx.fillText(dateStr, W / 2, 100);

        // ===== 主数据卡片 =====
        const cardY = 130;
        const cardH = 200;

        // 卡片背景（白色圆角）
        ctx.fillStyle = '#FFFFFF';
        roundRect(ctx, 25, cardY, W - 50, cardH, 20);
        ctx.fill();

        // 卡片阴影效果（用边框模拟）
        ctx.strokeStyle = 'rgba(218,165,32,0.15)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, 25, cardY, W - 50, cardH, 20);
        ctx.stroke();

        // 今日行善数（大字）
        ctx.fillStyle = '#FF8F00';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        const countStr = '+' + todayTotalCount;
        ctx.fillText(countStr, W / 2, cardY + 75);

        ctx.fillStyle = '#AEAEB2';
        ctx.font = '20px sans-serif';
        ctx.fillText('今日行善', W / 2, cardY + 105);

        // 分割线
        ctx.beginPath();
        ctx.moveTo(60, cardY + 125);
        ctx.lineTo(W - 60, cardY + 125);
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 底部两列数据：连续天数 | 完成情况
        const bottomY = cardY + 162;

        // 连续天数
        ctx.fillStyle = '#5D4037';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(streakDays + '天', W / 4, bottomY);
        ctx.fillStyle = '#AEAEB2';
        ctx.font = '17px sans-serif';
        ctx.fillText('已连续修行', W / 4, bottomY + 22);

        // 完成情况
        ctx.fillStyle = '#2E7D32';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(summary.completed + '/' + summary.total, W * 3 / 4, bottomY);
        ctx.fillStyle = '#AEAEB2';
        ctx.font = '17px sans-serif';
        ctx.fillText('今日达标', W * 3 / 4, bottomY + 22);

        // ===== 金句卡片 =====
        const quoteY = 355;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        roundRect(ctx, 30, quoteY, W - 60, 90, 14);
        ctx.fill();

        ctx.fillStyle = '#6D5A2E';
        ctx.font = '19px sans-serif';
        ctx.textAlign = 'center';

        // 金句文字（自动换行）
        const maxW = W - 90;
        let displayQuote = quote.text;
        if (displayQuote.length > 22) {
          // 简单分行处理
          const line1 = displayQuote.substring(0, Math.ceil(displayQuote.length / 2));
          const line2 = displayQuote.substring(Math.ceil(displayQuote.length / 2));
          ctx.fillText('「' + line1, W / 2, quoteY + 35);
          ctx.fillText(line2 + '」', W / 2, quoteY + 62);
        } else {
          ctx.fillText('「' + displayQuote + '」', W / 2, quoteY + 50);
        }

        ctx.fillStyle = '#B09A68';
        ctx.font = '14px sans-serif';
        ctx.fillText('— ' + quote.source, W / 2, quoteY + 78);

        // ===== 功课列表摘要 =====
        const listY = 465;
        ctx.fillStyle = '#5D4037';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('今日功课', 35, listY);

        let listOffsetY = listY + 28;
        const maxShow = 5; // 最多显示5个功课
        const showTasks = taskData.slice(0, maxShow);

        showTasks.forEach((item, idx) => {
          // 功课名
          let name = item.name;
          if (name.length > 14) name = name.substring(0, 13) + '…';

          ctx.fillStyle = '#333';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(name, 45, listOffsetY);

          // 计数
          ctx.fillStyle = '#FF8F00';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(item.todayCount + item.unit, W - 45, listOffsetY);

          // 进度小条（如果有目标）
          if (item.dailyTarget > 0) {
            const barX = 45;
            const barY = listOffsetY + 6;
            const barW = W - 90;
            const barH = 4;
            const pct = Math.min(1, item.todayCount / item.dailyTarget);

            ctx.fillStyle = '#F0F0F0';
            roundRect(ctx, barX, barY, barW, barH, 2);
            ctx.fill();

            if (pct > 0) {
              ctx.fillStyle = '#FFB300';
              roundRect(ctx, barX, barY, barW * pct, barH, 2);
              ctx.fill();
            }
          }

          listOffsetY += 36;
        });

        // 如果有更多功课
        if (taskData.length > maxShow) {
          ctx.fillStyle = '#AEAEB2';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('等 ' + taskData.length + ' 项功课...', W / 2, listOffsetY + 6);
        }

        // ===== 底部品牌区 =====
        const brandY = H - 70;

        // 底部分割线上方装饰
        ctx.beginPath();
        ctx.moveTo(120, brandY - 25);
        ctx.lineTo(W - 120, brandY - 25);
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#B09A68';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('— 岁时记 · 计数器 —', W / 2, brandY);

        ctx.fillStyle = '#AEAEB2';
        ctx.font = '12px sans-serif';
        ctx.fillText('长按识别小程序码，一起修行打卡', W / 2, brandY + 22);

        // 导出为临时文件
        poster.drawPromotionCode(canvas, ctx, { x: W - 112, y: 42, size: 72 }, function() {
          setTimeout(function() {
            wx.canvasToTempFilePath({
              canvas: canvas,
              width: W,
              height: H,
              destWidth: W * 2,
              destHeight: H * 2,
              fileType: 'jpg',
              quality: 0.95,
              success: function(saveRes) {
                wx.hideLoading();
                callback({ success: true, tempFilePath: saveRes.tempFilePath });
              },
              fail: function(err) {
                console.error('canvasToTempFilePath 失败:', err);
                wx.hideLoading();
                callback({ success: false });
              }
            });
          }, 150);
        });

      } catch (e) {
        console.error('绘制朋友圈图出错:', e);
        wx.hideLoading();
        callback({ success: false });
      }
    });
  }
});

/** 绘制圆角矩形辅助函数 */
function roundRect(ctx, x, y, w, h, r) {
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
