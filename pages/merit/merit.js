// pages/merit/merit.js — 功过格（了凡四训）
const calendarUtil = require('../../utils/calendar');
const storage = require('../../utils/storage');
const meritUtil = require('../../utils/merit');

Page({
  data: {
    // 日期
    dateStr: '',
    displayDate: '',
    weekdayText: '',

    // 今日引文
    dailyQuote: null,

    // 功德分类（预处理选中状态 + 累计次数）
    goodCategories: [],
    badCategories: [],

    // 自定义条目（分为善行和恶行两组）
    customGoodItems: [],
    customBadItems: [],

    // 已选中的条目（每条带 count 累计次数）
    selectedItems: [],

    // 反省备注
    reflectionNote: '',

    // 已有记录
    hasExistingRecord: false,

    // 预计算的数值（供 WXML 直接使用）
    currentGoodTotal: 0,
    currentBadTotal: 0,
    currentNetMerit: 0,

    // 统计概览
    stats: null,
    meritLevel: null,
    streakDays: 0,
    totalDays: 0,

    // ===== 自定义弹窗相关 =====
    showCustomModal: false,        // 是否显示添加/编辑自定义条目弹窗
    customModalMode: 'add',        // 'add' | 'edit'
    customEditType: 'good',        // 当前编辑的类型 good/bad
    customEditText: '',            // 弹窗中输入的内容
    customEditScore: 1,            // 弹窗中输入的分数
    customEditingId: null          // 编辑中的条目ID（null=新增模式）
  },

  onLoad(options) {
    const dateStr = options.date || '';
    if (!dateStr) {
      const today = calendarUtil.getTodayInfo();
      this.setData({ dateStr: today.dateStr });
    } else {
      this.setData({ dateStr });
    }

    this.initData();
  },

  onShow() {
    this.loadStats();
    this.loadCustomItems(); // 每次显示时刷新自定义条目
  },

  initData() {
    const { dateStr } = this.data;

    // 格式化日期显示
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      this.setData({
        displayDate: `${parseInt(parts[1])}月${parseInt(parts[2])}日`,
        weekdayText: weekNames[dateObj.getDay()]
      });

      wx.setNavigationBarTitle({
        title: `${parts[1]}月${parts[2]}日 · 功过格`
      });
    }

    // 加载功德分类数据（带选中状态 + count）
    this.loadCategories();

    // 加载今日引文
    this.setData({
      dailyQuote: meritUtil.getDailyQuote()
    });

    // 加载已有记录
    this.loadExistingRecord();

    // 加载自定义条目
    this.loadCustomItems();
  },

  /**
   * 加载分类并标记已选项 + count
   */
  loadCategories() {
    const { selectedItems } = this.data;

    // 构建已选 itemId -> count 的映射（区分 type）
    const selectedGoodMap = {}; // { itemId: count }
    const selectedBadMap = {};
    selectedItems.forEach(item => {
      if (item.type === 'good') selectedGoodMap[item.itemId] = (selectedGoodMap[item.itemId] || 0) + (item.count || 1);
      else selectedBadMap[item.itemId] = (selectedBadMap[item.itemId] || 0) + (item.count || 1);
    });

    // 处理善行分类：给每个 item 加上 selected 和 count 标记
    const goodCategories = meritUtil.GOOD_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.map(item => ({
        ...item,
        selected: !!selectedGoodMap[item.id],
        count: selectedGoodMap[item.id] || 0
      }))
    }));

    // 处理恶行分类
    const badCategories = meritUtil.BAD_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.map(item => ({
        ...item,
        selected: !!selectedBadMap[item.id],
        count: selectedBadMap[item.id] || 0
      }))
    }));

    this.setData({ goodCategories, badCategories });
  },

  /**
   * 加载自定义功过条目并标记选中状态 + count
   */
  loadCustomItems() {
    const allCustomItems = storage.getCustomMeritItems();
    const { selectedItems } = this.data;

    // 构建已选自定义 itemId -> count 的映射
    const selectedCustomMap = {};
    selectedItems.filter(i => i.isCustom).forEach(item => {
      selectedCustomMap[item.itemId] = (selectedCustomMap[item.itemId] || 0) + (item.count || 1);
    });

    // 分为善行和恶行两组，加上选中标记和 count
    const customGoodItems = allCustomItems
      .filter(item => item.type === 'good')
      .map(item => ({ ...item, selected: !!selectedCustomMap[item.id], count: selectedCustomMap[item.id] || 0 }));

    const customBadItems = allCustomItems
      .filter(item => item.type === 'bad')
      .map(item => ({ ...item, selected: !!selectedCustomMap[item.id], count: selectedCustomMap[item.id] || 0 }));

    this.setData({ customGoodItems, customBadItems });
  },

  /**
   * 加载已有记录
   */
  loadExistingRecord() {
    const { dateStr } = this.data;
    const record = storage.getMeritRecordByDate(dateStr);
    if (record && record.items && record.items.length > 0) {
      this.setData({
        selectedItems: record.items,
        reflectionNote: record.note || '',
        hasExistingRecord: true
      });
      // 重新加载分类以更新选中状态
      this.loadCategories();
      this.loadCustomItems();
      this.recalculateTotals();
    }
  },

  /**
   * 重新计算总功德值（基于 count × 分数）
   */
  recalculateTotals() {
    const { selectedItems } = this.data;
    let goodTotal = 0;
    let badTotal = 0;

    selectedItems.forEach(item => {
      const cnt = item.count || 1;
      if (item.type === 'good') goodTotal += (item.merit || 0) * cnt;
      else badTotal += (item.demerit || 0) * cnt;
    });

    this.setData({
      currentGoodTotal: goodTotal,
      currentBadTotal: badTotal,
      currentNetMerit: goodTotal - badTotal
    });
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    const records = storage.getMeritRecords();
    const recentRecords = storage.getRecentMeritRecords(90);

    let todayForStreak = this.data.dateStr;
    if (!todayForStreak) {
      const now = new Date();
      todayForStreak = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    const stats = meritUtil.getMeritStats(recentRecords);
    const level = meritUtil.getMeritLevel(stats.totalNet);
    const streak = meritUtil.getStreakDays(records, todayForStreak);

    this.setData({
      stats,
      meritLevel: level,
      streakDays: streak,
      totalDays: storage.getMeritRecordCount()
    });
  },

  // ==================== 选择功过条目（累计模式） ====================

  onToggleGoodItem(e) {
    const { categoryId, itemId, text, merit } = e.currentTarget.dataset;
    this.incrementItem('good', categoryId, itemId, text, merit, 0);
  },

  onToggleBadItem(e) {
    const { categoryId, itemId, text, demerit } = e.currentTarget.dataset;
    this.incrementItem('bad', categoryId, itemId, text, 0, demerit);
  },

  /**
   * 增加一次自定义善行
   */
  onIncrementCustomGood(e) {
    const { itemId, text, merit } = e.currentTarget.dataset;
    this.incrementItem('good', 'custom', itemId, text, merit, 0, true);
  },

  /**
   * 减少一次自定义善行
   */
  onDecrementCustomGood(e) {
    const { itemId } = e.currentTarget.dataset;
    this.decrementItem('good', itemId, true);
  },

  /**
   * 增加一次自定义恶行
   */
  onIncrementCustomBad(e) {
    const { itemId, text, demerit } = e.currentTarget.dataset;
    this.incrementItem('bad', 'custom', itemId, text, 0, demerit, true);
  },

  /**
   * 减少一次自定义恶行
   */
  onDecrementCustomBad(e) {
    const { itemId } = e.currentTarget.dataset;
    this.decrementItem('bad', itemId, true);
  },

  /**
   * 累计增加一条功/过（每次点击 +1）
   */
  incrementItem(type, categoryId, itemId, text, merit, demerit, isCustom = false) {
    let { selectedItems } = this.data;

    // 查找是否已有该条目
    const existingIdx = selectedItems.findIndex(
      item => item.itemId === itemId && item.type === type
    );

    let color = type === 'good' ? '#4CAF50' : '#F44336';
    if (isCustom) {
      color = type === 'good' ? '#FF9800' : '#E91E63';
    }

    if (existingIdx !== -1) {
      // 已存在，count +1
      selectedItems[existingIdx].count = (selectedItems[existingIdx].count || 1) + 1;
    } else {
      // 首次添加，count = 1
      selectedItems.push({
        type,
        categoryId,
        itemId,
        text,
        merit: merit || 0,
        demerit: demerit || 0,
        color,
        isCustom: isCustom,
        count: 1
      });
    }

    this.setData({ selectedItems });
    this.loadCategories();     // 更新内置分类的选中状态和 count
    this.loadCustomItems();    // 更新自定义条目的选中状态和 count
    this.recalculateTotals();  // 重新计算总计
  },

  /**
   * 累计减少一条功/过（每次点击 -1，到 0 时移除）
   */
  decrementItem(type, itemId, isCustom = false) {
    let { selectedItems } = this.data;

    const existingIdx = selectedItems.findIndex(
      item => item.itemId === itemId && item.type === type
    );

    if (existingIdx !== -1) {
      const currentCount = selectedItems[existingIdx].count || 1;
      if (currentCount <= 1) {
        // count 为 1 时再减则移除该条目
        selectedItems.splice(existingIdx, 1);
      } else {
        // count > 1 时减 1
        selectedItems[existingIdx].count = currentCount - 1;
      }
    }

    this.setData({ selectedItems });
    this.loadCategories();
    this.loadCustomItems();
    this.recalculateTotals();
  },

  /**
   * 移除已选条目（从标签区删除整条）
   */
  onRemoveItem(e) {
    const { index } = e.currentTarget.dataset;
    let { selectedItems } = this.data;
    selectedItems.splice(index, 1);
    this.setData({ selectedItems });
    this.loadCategories();
    this.loadCustomItems();
    this.recalculateTotals();
  },

  // ==================== 自定义条目管理 ====================

  /**
   * 打开添加自定义条目弹窗
   */
  onShowAddCustom(e) {
    const type = e.currentTarget.dataset.type || 'good';
    this.setData({
      showCustomModal: true,
      customModalMode: 'add',
      customEditType: type,
      customEditText: '',
      customEditScore: type === 'good' ? 1 : 1,
      customEditingId: null
    });
  },

  /**
   * 打开编辑自定义条目弹窗
   */
  onShowEditCustom(e) {
    const { id } = e.currentTarget.dataset;
    const allCustomItems = storage.getCustomMeritItems();
    const item = allCustomItems.find(i => i.id === id);
    if (!item) return;

    this.setData({
      showCustomModal: true,
      customModalMode: 'edit',
      customEditType: item.type,
      customEditText: item.text,
      customEditScore: item.type === 'good' ? item.merit : item.demerit,
      customEditingId: id
    });
  },

  /**
   * 关闭自定义弹窗
   */
  onCloseCustomModal() {
    this.setData({
      showCustomModal: false,
      customEditText: '',
      customEditScore: 1,
      customEditingId: null
    });
  },

  /**
   * 弹窗内切换善/过类型
   */
  onCustomTypeSwitch(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ customEditType: type });
  },

  /**
   * 弹窗内容输入
   */
  onCustomTextInput(e) {
    this.setData({ customEditText: e.detail.value });
  },

  /**
   * 弹窗分数输入
   */
  onCustomScoreInput(e) {
    const val = parseInt(e.detail.value) || 0;
    this.setData({ customEditScore: Math.max(1, Math.min(100, val)) });
  },

  /**
   * 分数快捷按钮
   */
  onQuickScore(e) {
    const score = e.currentTarget.dataset.score;
    this.setData({ customEditScore: score });
  },

  /**
   * 确认添加/编辑自定义条目
   */
  onConfirmCustom() {
    const { customEditText, customEditScore, customEditType, customModalMode, customEditingId } = this.data;

    if (!customEditText.trim()) {
      wx.showToast({ title: '请输入条目内容', icon: 'none' });
      return;
    }

    if (customModalMode === 'add') {
      storage.addCustomMeritItem(customEditType, customEditText.trim(), customEditScore);
      wx.showToast({ title: '已添加', icon: 'success' });
    } else {
      const updates = { text: customEditText.trim() };
      if (customEditType === 'good') {
        updates.merit = customEditScore;
        updates.demerit = 0;
      } else {
        updates.demerit = customEditScore;
        updates.merit = 0;
      }
      updates.type = customEditType;
      storage.updateCustomMeritItem(customEditingId, updates);
      wx.showToast({ title: '已更新', icon: 'success' });
    }

    this.onCloseCustomModal();
    this.loadCustomItems();
  },

  /**
   * 删除自定义条目
   */
  onDeleteCustomItem(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条自定义条目吗？',
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          storage.deleteCustomMeritItem(id);
          // 同时从已选列表中移除
          let { selectedItems } = this.data;
          selectedItems = selectedItems.filter(item => item.itemId !== id);
          this.setData({ selectedItems });
          this.loadCustomItems();
          this.recalculateTotals();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // ==================== 反省备注 ====================

  onNoteInput(e) {
    this.setData({ reflectionNote: e.detail.value });
  },

  // ==================== 保存 ====================

  onSave() {
    const { dateStr, selectedItems, reflectionNote } = this.data;

    if (selectedItems.length === 0) {
      wx.showToast({ title: '请至少选择一条功或过', icon: 'none' });
      return;
    }

    storage.saveMeritRecord(dateStr, selectedItems, reflectionNote.trim());

    wx.showToast({
      title: this.data.hasExistingRecord ? '已更新' : '已记录',
      icon: 'success'
    });

    this.setData({ hasExistingRecord: true });
    this.loadStats();

    setTimeout(() => {
      wx.navigateBack();
    }, 800);
  },

  onClear() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除今日的功过记录吗？',
      confirmText: '清除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          storage.deleteMeritRecord(this.data.dateStr);
          this.setData({
            selectedItems: [],
            reflectionNote: '',
            hasExistingRecord: false,
            currentGoodTotal: 0,
            currentBadTotal: 0,
            currentNetMerit: 0
          });
          this.loadCategories();
          this.loadCustomItems();
          this.loadStats();
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  },

  goToStats() {
    wx.navigateTo({ url: '/pages/merit-stats/merit-stats' });
  }
});
