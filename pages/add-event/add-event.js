// pages/add-event/add-event.js — 添加/编辑重要日子
const storage = require('../../utils/storage');

Page({
  data: {
    isEdit: false,
    editId: '',
    formData: {
      name: '',
      date: '',
      category: 'birthday',
      isCountdown: true,
      remark: '',
      remind: false
    },
    categories: [
      { key: 'birthday', name: '生日', icon: '🎂' },
      { key: 'anniversary', name: '纪念日', icon: '💝' },
      { key: 'salary', name: '发工资', icon: '💰' },
      { key: 'custom', name: '自定义', icon: '✨' }
    ],
    canSave: false,
    previewDays: 0
  },

  onLoad(options) {
    if (options.id) {
      this.loadEventForEdit(options.id);
    } else {
      const updates = {};

      // 预填日期（从日历页跳转）
      if (options.date) {
        updates['formData.date'] = options.date;
      }

      // 预填名称（从节日详情跳转）
      if (options.name) {
        updates['formData.name'] = decodeURIComponent(options.name);
        updates['formData.category'] = 'custom';
      }
      // 兼容旧参数 title
      if (options.title) {
        updates['formData.name'] = decodeURIComponent(options.title);
        updates['formData.category'] = 'custom';
      }

      if (Object.keys(updates).length > 0) {
        this.setData(updates);
        this.updateCanSave();
        this.updatePreview();
      }
    }
  },

  /** 加载事件数据用于编辑 */
  loadEventForEdit(id) {
    const events = storage.getEvents();
    const event = events.find(e => e.id === id);

    if (event) {
      this.setData({
        isEdit: true,
        editId: id,
        formData: {
          name: event.name || event.title || '',
          date: event.date || '',
          category: event.category || 'birthday',
          isCountdown: event.isCountdown !== undefined ? event.isCountdown : true,
          remark: event.remark || '',
          remind: event.remind || false
        }
      });

      wx.setNavigationBarTitle({ title: '编辑重要日子' });
      this.updateCanSave();
      this.updatePreview();
    }
  },

  /** 名称输入 */
  onNameInput(e) {
    this.setData({ 'formData.name': e.detail.value });
    this.updateCanSave();
    this.updatePreview();
  },

  /** 日期选择 */
  onDateChange(e) {
    this.setData({ 'formData.date': e.detail.value });
    this.updateCanSave();
    this.updatePreview();
  },

  /** 分类选择 */
  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ 'formData.category': key });
  },

  /** 计时模式切换 */
  onModeSwitch(e) {
    const mode = e.currentTarget.dataset.mode === 'true';
    this.setData({ 'formData.isCountdown': mode });
    this.updatePreview();
  },

  /** 备注输入 */
  onRemarkInput(e) {
    this.setData({ 'formData.remark': e.detail.value });
  },

  /** 提醒开关 */
  onRemindSwitch(e) {
    this.setData({ 'formData.remind': e.detail.value });
  },

  /** 更新保存按钮状态 */
  updateCanSave() {
    const { name, date } = this.data.formData;
    this.setData({ canSave: name.trim() !== '' && date !== '' });
  },

  /** 更新预览天数 */
  updatePreview() {
    const { date, isCountdown } = this.data.formData;
    if (!date) return;
    const days = storage.getDaysDiff(date, isCountdown);
    this.setData({ previewDays: days });
  },

  /** 获取分类对应的颜色类名 */
  getCategoryColor(category) {
    const colorMap = {
      birthday: 'dot-pink',
      anniversary: 'dot-red',
      salary: 'dot-green',
      custom: 'dot-blue'
    };
    return colorMap[category] || 'dot-blue';
  },

  /** 保存 */
  onSave() {
    const { formData, isEdit, editId } = this.data;

    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }

    if (!formData.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }

    // 统一使用 name 字段存储（同时兼容写入 title，保证旧数据可读）
    const saveData = {
      name: formData.name.trim(),
      title: formData.name.trim(), // 双写兼容
      date: formData.date,
      category: formData.category,
      isCountdown: formData.isCountdown,
      remark: formData.remark,
      remind: formData.remind
    };

    if (isEdit) {
      storage.updateEvent(editId, saveData);
      wx.showToast({ title: '已更新', icon: 'success' });
    } else {
      storage.addEvent(saveData);
      wx.showToast({ title: '已创建', icon: 'success' });
    }

    setTimeout(() => { wx.navigateBack(); }, 800);
  },

  /** 删除 */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个重要日子吗？此操作不可恢复。',
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          storage.deleteEvent(this.data.editId);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => { wx.navigateBack(); }, 800);
        }
      }
    });
  }
});
