// pages/notes/notes.js
const calendarUtil = require('../../utils/calendar');
const storage = require('../../utils/storage');

Page({
  data: {
    dateStr: '',
    displayDate: '',
    weekdayText: '',
    noteContent: '',
    canSave: false,
    hasExistingNote: false,
    autoFocus: true,
    placeholder: '今天有什么想记录的？'
  },

  onLoad(options) {
    const dateStr = options.date || '';
    
    if (!dateStr) {
      // 如果没有日期参数，使用今天
      const today = calendarUtil.getTodayInfo();
      this.setData({
        dateStr: today.dateStr
      });
    } else {
      this.setData({ dateStr });
    }

    this.initData();
  },

  /**
   * 初始化数据
   */
  initData() {
    const { dateStr } = this.data;

    // 格式化显示日期
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      this.setData({
        displayDate: `${parseInt(parts[1])}月${parseInt(parts[2])}日`,
        weekdayText: weekNames[dateObj.getDay()]
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: `${parts[1]}月${parts[2]}日 · 备注`
      });
    }

    // 加载已有备注
    const existingNote = storage.getNoteByDate(dateStr);
    if (existingNote && existingNote.content) {
      this.setData({
        noteContent: existingNote.content,
        canSave: !!existingNote.content.trim(),
        hasExistingNote: true
      });
    }

    // 根据日期设置不同的 placeholder
    this.setDatePlaceholder();
  },

  /**
   * 根据日期设置提示文字
   */
  setDatePlaceholder() {
    const placeholders = [
      '今天有什么想记录的？',
      '给这一天留下一句话吧',
      '此刻的心情，值得被记住',
      '写下今天的回忆或期待',
      '一句话，记录这个特别的日子'
    ];

    const randomIndex = Math.floor(Math.random() * placeholders.length);
    this.setData({ placeholder: placeholders[randomIndex] });
  },

  /**
   * 备注输入
   */
  onNoteInput(e) {
    const noteContent = e.detail.value;
    this.setData({
      noteContent,
      canSave: !!noteContent.trim()
    });
  },

  /**
   * 保存备注
   */
  onSave() {
    const { dateStr, noteContent } = this.data;

    if (!noteContent.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    storage.saveNote(dateStr, noteContent.trim());

    wx.showToast({
      title: this.data.hasExistingNote ? '已更新' : '已保存',
      icon: 'success'
    });

    this.setData({ hasExistingNote: true });

    setTimeout(() => {
      wx.navigateBack();
    }, 800);
  },

  /**
   * 清除备注
   */
  onClear() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除这条备注吗？',
      confirmText: '清除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          storage.deleteNote(this.data.dateStr);
          this.setData({
            noteContent: '',
            canSave: false,
            hasExistingNote: false
          });
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  }
});
