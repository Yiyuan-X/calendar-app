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
    showBuiltinItems: false,

    // 自定义条目（分为善行和恶行两组）
    customGoodItems: [],
    customBadItems: [],

    // 已选中的条目（每条带 count 累计次数）
    selectedItems: [],

    // 分组后的善行/过失列表（供 WXML 直接使用，带唯一 _idx 避免 key 冲突）
    goodDisplayList: [],
    badDisplayList: [],

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

  /**
   * 将 icon 名称映射为本地图片路径
   */
  _getIconPath(icon) {
    const iconMap = {
      // 善行分类 — 精美设计图标
      benevolence: '/images/icons/merit-compassion.svg', // 慈悲利他
      filial: '/images/icons/merit-filial.svg',          // 孝亲敬长
      integrity: '/images/icons/merit-honest.svg',       // 诚实守信
      cultivation: '/images/icons/merit-cultivate.svg',  // 修身养性
      speech: '/images/icons/merit-speech.svg',          // 善语爱语
      // 恶行分类 — 警示风格图标
      anger: '/images/icons/demerit-anger.svg',         // 嗔恚暴躁
      greed: '/images/icons/demerit-greed.svg',         // 贪欲执着
      dishonesty: '/images/icons/demerit-lie.svg',      // 欺妄不实
      laziness: '/images/icons/demerit-lazy.svg',       // 懈怠懒惰
      harm: '/images/icons/demerit-harm.svg',           // 残忍伤害
    };
    return iconMap[icon] || '/images/icons/yin-yang.svg';
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
   * 加载分类并标记已选项 + count（过滤已删除的内置条目）
   */
  loadCategories() {
    const { selectedItems } = this.data;

    // 获取已删除的内置条目ID列表
    const deletedIds = storage.getDeletedBuiltinItems();
    const deletedSet = new Set(deletedIds);

    // 构建已选 itemId -> count 的映射（区分 type）
    const selectedGoodMap = {}; // { itemId: count }
    const selectedBadMap = {};
    selectedItems.forEach(item => {
      if (item.type === 'good') selectedGoodMap[item.itemId] = (selectedGoodMap[item.itemId] || 0) + (item.count || 1);
      else selectedBadMap[item.itemId] = (selectedBadMap[item.itemId] || 0) + (item.count || 1);
    });

    // 处理善行分类：给每个 item 加上 selected 和 count 标记，过滤已删除条目
    const goodCategories = meritUtil.GOOD_CATEGORIES.map(cat => ({
      ...cat,
      iconPath: this._getIconPath(cat.icon),
      items: cat.items.filter(item => !deletedSet.has(item.id)).map(item => ({
        ...item,
        selected: !!selectedGoodMap[item.id],
        count: selectedGoodMap[item.id] || 0
      }))
    })).filter(cat => cat.items.length > 0); // 过滤掉没有剩余条目的空分类

    // 处理恶行分类
    const badCategories = meritUtil.BAD_CATEGORIES.map(cat => ({
      ...cat,
      iconPath: this._getIconPath(cat.icon),
      items: cat.items.filter(item => !deletedSet.has(item.id)).map(item => ({
        ...item,
        selected: !!selectedBadMap[item.id],
        count: selectedBadMap[item.id] || 0
      }))
    })).filter(cat => cat.items.length > 0);

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
    if (record && ((record.items && record.items.length > 0) || record.note)) {
      this.setData({
        selectedItems: record.items || [],
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
   * 重新计算总功德值（基于 count × 分数），并更新分组列表
   */
  recalculateTotals() {
    const { selectedItems } = this.data;
    let goodTotal = 0;
    let badTotal = 0;
    const goodDisplayList = [];
    const badDisplayList = [];

    selectedItems.forEach((item, idx) => {
      const cnt = item.count || 1;
      if (item.type === 'good') {
        const itemTotal = (item.merit || 0) * cnt;
        goodTotal += itemTotal;
        goodDisplayList.push({ ...item, _idx: 'g_' + idx + '_' + item.itemId });
      } else {
        const itemTotal = (item.demerit || 0) * cnt;
        badTotal += itemTotal;
        badDisplayList.push({ ...item, _idx: 'b_' + idx + '_' + item.itemId });
      }
    });

    this.setData({
      currentGoodTotal: goodTotal,
      currentBadTotal: badTotal,
      currentNetMerit: goodTotal - badTotal,
      goodDisplayList,
      badDisplayList
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

  toggleBuiltinItems() {
    this.setData({ showBuiltinItems: !this.data.showBuiltinItems });
  },

  onToggleGoodItem(e) {
    const { categoryId, itemId, text, merit } = e.currentTarget.dataset;
    this.incrementItem('good', categoryId, itemId, text, merit, 0);
  },

  onToggleBadItem(e) {
    const { categoryId, itemId, text, demerit } = e.currentTarget.dataset;
    this.incrementItem('bad', categoryId, itemId, text, 0, demerit);
  },

  /**
   * 减少一次内置善行（-1）
   */
  onDecrementGoodItem(e) {
    const { itemId } = e.currentTarget.dataset;
    this.decrementItem('good', itemId, false);
  },

  /**
   * 减少一次内置恶行（-1）
   */
  onDecrementBadItem(e) {
    const { itemId } = e.currentTarget.dataset;
    this.decrementItem('bad', itemId, false);
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
    console.log('====== incrementItem 开始 ======');
    console.log('传入: merit=', merit, 'demerit=', demerit, 'itemId=', itemId);
    
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
      console.log('【已存在】count ->', selectedItems[existingIdx].count, 'merit=', selectedItems[existingIdx].merit);
    } else {
      // 首次添加，count = 1
      const mVal = type === 'good' ? (Number(merit) || 0) : 0;
      const dVal = type === 'bad' ? (Number(demerit) || 0) : 0;
      console.log('【新增】计算的 merit=', mVal, 'demerit=', dVal, '(原始 merit=', merit, ')');
      selectedItems.push({
        type,
        categoryId,
        itemId,
        text,
        merit: mVal,
        demerit: dVal,
        color,
        isCustom: isCustom,
        count: 1
      });
    }

    // 打印完整的 selectedItems
    console.log('【完整 selectedItems】:');
    selectedItems.forEach((item, i) => {
      console.log('  [' + i + '] ', item.text, '| merit=', item.merit, '| demerit=', item.demerit, '| count=', item.count);
    });

    // 直接基于修改后的数组计算（不等 setData）
    const goodDisplayList = [];
    const badDisplayList = [];
    let goodTotal = 0;
    let badTotal = 0;

    selectedItems.forEach((item, idx) => {
      const cnt = item.count || 1;
      if (item.type === 'good') {
        const t = (item.merit || 0) * cnt;
        console.log('good', item.text, ': merit=', item.merit, 'x', cnt, '=', t);
        goodTotal += t;
        goodDisplayList.push({ ...item, _idx: 'g_' + idx + '_' + item.itemId });
      } else {
        const t = (item.demerit || 0) * cnt;
        console.log('bad', item.text, ': demerit=', item.demerit, 'x', cnt, '=', t);
        badTotal += t;
        badDisplayList.push({ ...item, _idx: 'b_' + idx + '_' + item.itemId });
      }
    });

    console.log('====== 最终结果: goodTotal=', goodTotal, 'badTotal=', badTotal, 'netMerit=', goodTotal - badTotal, '======');

    // 一次性 setData，避免多次调用导致的数据覆盖
    this.setData({
      selectedItems,
      currentGoodTotal: goodTotal,
      currentBadTotal: badTotal,
      currentNetMerit: goodTotal - badTotal,
      goodDisplayList,
      badDisplayList
    }, () => {
      this.loadCategories();
      this.loadCustomItems();
    });
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
        selectedItems.splice(existingIdx, 1);
      } else {
        selectedItems[existingIdx].count = currentCount - 1;
      }
    }

    // 直接基于修改后的数组计算
    const goodDisplayList = [];
    const badDisplayList = [];
    let goodTotal = 0;
    let badTotal = 0;

    selectedItems.forEach((item, idx) => {
      const cnt = item.count || 1;
      if (item.type === 'good') {
        const t = (item.merit || 0) * cnt;
        goodTotal += t;
        goodDisplayList.push({ ...item, _idx: 'g_' + idx + '_' + item.itemId });
      } else {
        const t = (item.demerit || 0) * cnt;
        badTotal += t;
        badDisplayList.push({ ...item, _idx: 'b_' + idx + '_' + item.itemId });
      }
    });

    this.setData({
      selectedItems,
      currentGoodTotal: goodTotal,
      currentBadTotal: badTotal,
      currentNetMerit: goodTotal - badTotal,
      goodDisplayList,
      badDisplayList
    }, () => {
      this.loadCategories();
      this.loadCustomItems();
    });
  },

  /**
   * 移除已选条目（从标签区删除整条）— 原始索引
   */
  onRemoveItem(e) {
    const { index } = e.currentTarget.dataset;
    let { selectedItems } = this.data;
    selectedItems.splice(index, 1);
    this._updateAll(selectedItems);
  },

  /**
   * 从善行组中移除一条（使用分组内的索引）
   */
  onRemoveItemByGoodIndex(e) {
    const { index } = e.currentTarget.dataset;
    const { selectedItems, goodDisplayList } = this.data;
    if (goodDisplayList && goodDisplayList[index]) {
      const targetId = goodDisplayList[index].itemId;
      const targetIdx = selectedItems.findIndex(
        item => item.itemId === targetId && item.type === 'good'
      );
      if (targetIdx !== -1) {
        selectedItems.splice(targetIdx, 1);
        this._updateAll(selectedItems);
      }
    }
  },

  /**
   * 从过失组中移除一条（使用分组内的索引）
   */
  onRemoveItemByBadIndex(e) {
    const { index } = e.currentTarget.dataset;
    const { selectedItems, badDisplayList } = this.data;
    if (badDisplayList && badDisplayList[index]) {
      const targetId = badDisplayList[index].itemId;
      const targetIdx = selectedItems.findIndex(
        item => item.itemId === targetId && item.type === 'bad'
      );
      if (targetIdx !== -1) {
        selectedItems.splice(targetIdx, 1);
        this._updateAll(selectedItems);
      }
    }
  },

  /**
   * 从善行组中移除一条（通过 itemId 查找）
   */
  onRemoveGoodItem(e) {
    const { itemId } = e.currentTarget.dataset;
    let { selectedItems } = this.data;
    const targetIdx = selectedItems.findIndex(
      item => item.itemId === itemId && item.type === 'good'
    );
    if (targetIdx !== -1) {
      selectedItems.splice(targetIdx, 1);
      this._updateAll(selectedItems);
    }
  },

  /**
   * 从过失组中移除一条（通过 itemId 查找）
   */
  onRemoveBadItem(e) {
    const { itemId } = e.currentTarget.dataset;
    let { selectedItems } = this.data;
    const targetIdx = selectedItems.findIndex(
      item => item.itemId === itemId && item.type === 'bad'
    );
    if (targetIdx !== -1) {
      selectedItems.splice(targetIdx, 1);
      this._updateAll(selectedItems);
    }
  },

  /**
   * 统一更新：根据 selectedItems 数组一次性计算所有数据并 setData
   * 避免多次 setData 导致的异步竞态问题
   */
  _updateAll(selectedItems) {
    const goodDisplayList = [];
    const badDisplayList = [];
    let goodTotal = 0;
    let badTotal = 0;

    selectedItems.forEach((item, idx) => {
      const cnt = item.count || 1;
      if (item.type === 'good') {
        const t = (item.merit || 0) * cnt;
        goodTotal += t;
        goodDisplayList.push({ ...item, _idx: 'g_' + idx + '_' + item.itemId });
      } else {
        const t = (item.demerit || 0) * cnt;
        badTotal += t;
        badDisplayList.push({ ...item, _idx: 'b_' + idx + '_' + item.itemId });
      }
    });

    this.setData({
      selectedItems,
      currentGoodTotal: goodTotal,
      currentBadTotal: badTotal,
      currentNetMerit: goodTotal - badTotal,
      goodDisplayList,
      badDisplayList
    }, () => {
      this.loadCategories();
      this.loadCustomItems();
    });
  },

  /**
   * 长按内置条目 → 弹出操作菜单（删除单条 / 删除整个分类）
   */
  onLongPressBuiltinItem(e) {
    const { itemId, text, categoryId, categoryName, type } = e.currentTarget.dataset;

    wx.showActionSheet({
      itemList: [
        `删除「${text}」`,
        `删除整个「${categoryName}」分类`
      ],
      itemColor: '#FF3B30',
      success: (res) => {
        if (!res.tapIndex && res.tapIndex !== 0) return;

        if (res.tapIndex === 0) {
          // ===== 删除单条 =====
          wx.showModal({
            title: '确认删除',
            content: `确定要删除「${text}」吗？`,
            confirmText: '删除',
            confirmColor: '#FF3B30',
            success: (modalRes) => {
              if (modalRes.confirm) {
                storage.markBuiltinItemDeleted(itemId);
                let { selectedItems } = this.data;
                selectedItems = selectedItems.filter(item => item.itemId !== itemId);
                this.setData({ selectedItems });
                this.loadCategories();
                this.recalculateTotals();
                wx.showToast({ title: '已删除', icon: 'success', duration: 1000 });
              }
            }
          });

        } else if (res.tapIndex === 1) {
          // ===== 删除整个分类 =====
          const allCategories = type === 'good' ? meritUtil.GOOD_CATEGORIES : meritUtil.BAD_CATEGORIES;
          const category = allCategories.find(c => c.id === categoryId);
          if (!category) return;

          const itemIds = category.items.map(item => item.id);

          wx.showModal({
            title: `确认删除「${categoryName}」`,
            content: `将删除该分类下全部 ${itemIds.length} 个条目。`,
            confirmText: '删除分类',
            confirmColor: '#FF3B30',
            success: (modalRes) => {
              if (modalRes.confirm) {
                itemIds.forEach(id => storage.markBuiltinItemDeleted(id));
                let { selectedItems } = this.data;
                selectedItems = selectedItems.filter(item => !itemIds.includes(item.itemId));
                this.setData({ selectedItems });
                this.loadCategories();
                this.recalculateTotals();
                wx.showToast({ title: `已删除「${categoryName}」`, icon: 'success', duration: 1200 });
              }
            }
          });
        }
      }
    });
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
   * 弹窗分数输入（支持自定义输入，范围 1~999）
   */
  onCustomScoreInput(e) {
    let val = parseInt(e.detail.value);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 999) val = 999;
    this.setData({ customEditScore: val });
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

    if (selectedItems.length === 0 && !reflectionNote.trim()) {
      wx.showToast({ title: '请至少选择功过或填写反省', icon: 'none' });
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
  },

  // ==================== 分享 ====================

  onShareAppMessage() {
    var { displayDate, currentNetMerit } = this.data;
    var netText = currentNetMerit >= 0 ? ('+' + currentNetMerit) : String(currentNetMerit);
    return {
      title: displayDate + ' 功过格 ' + netText + '分 · 岁时记',
      path: '/pages/merit/merit'
    };
  },

  /** 分享到朋友圈 */
  shareToMoments() {
    this.generateShareImage(function(res) {
      if (res.success) {
        wx.previewImage({ urls: [res.tempFilePath], current: res.tempFilePath });
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  /** 保存到相册 */
  saveImage() {
    var that = this;
    this.generateShareImage(function(res) {
      if (res.success) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function() { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
          fail: function(err) {
            if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
              wx.showModal({
                title: '提示', content: '需要您授权保存相册权限',
                confirmText: '去设置',
                success: function(modalRes) { if (modalRes.confirm) wx.openSetting(); }
              });
            } else {
              wx.showToast({ title: '保存失败', icon: 'none' });
            }
          }
        });
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  /** 导出本地累计功过记录为 CSV */
  exportMeritRecords() {
    const records = storage.getMeritRecords();
    const notes = storage.getNotes();
    const dates = Array.from(new Set([
      ...Object.keys(records),
      ...Object.keys(notes)
    ])).sort();

    if (dates.length === 0) {
      wx.showToast({ title: '暂无可导出的记录', icon: 'none' });
      return;
    }

    const csv = this.buildMeritCsv(records, notes, dates);
    const fileName = `suishiji-merit-${this.formatExportDate(new Date())}.csv`;
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

    wx.showLoading({ title: '正在导出...' });
    wx.getFileSystemManager().writeFile({
      filePath,
      data: '\ufeff' + csv,
      encoding: 'utf8',
      success: () => {
        wx.hideLoading();
        if (typeof wx.shareFileMessage === 'function') {
          wx.shareFileMessage({
            filePath,
            fileName,
            success: () => wx.showToast({ title: '已导出', icon: 'success' }),
            fail: () => this.copyCsvToClipboard(csv)
          });
        } else {
          this.copyCsvToClipboard(csv);
        }
      },
      fail: (err) => {
        console.error('导出功过记录失败:', err);
        wx.hideLoading();
        this.copyCsvToClipboard(csv);
      }
    });
  },

  buildMeritCsv(records, notes, dates) {
    const rows = [
      ['日期', '类型', '条目', '单次分数', '次数', '小计', '今日反省', '日期备注', '功过更新时间', '备注更新时间']
    ];

    dates.forEach(dateStr => {
      const record = records[dateStr] || {};
      const dayNote = notes[dateStr] || {};
      const items = record.items || [];
      const reflectionNote = record.note || '';
      const dateNote = dayNote.content || '';
      const meritUpdatedAt = record.updatedAt ? this.formatDateTime(new Date(record.updatedAt)) : '';
      const noteUpdatedAt = dayNote.updatedAt ? this.formatDateTime(new Date(dayNote.updatedAt)) : '';

      if (items.length === 0) {
        rows.push([
          dateStr,
          '',
          '',
          '',
          '',
          '',
          reflectionNote,
          dateNote,
          meritUpdatedAt,
          noteUpdatedAt
        ]);
        return;
      }

      items.forEach((item, index) => {
        const count = item.count || 1;
        const score = item.type === 'good' ? (item.merit || 0) : (item.demerit || 0);
        const total = score * count;
        rows.push([
          dateStr,
          item.type === 'good' ? '善行' : '过失',
          item.text || '',
          score,
          count,
          item.type === 'good' ? total : -total,
          index === 0 ? reflectionNote : '',
          index === 0 ? dateNote : '',
          meritUpdatedAt,
          index === 0 ? noteUpdatedAt : ''
        ]);
      });
    });

    return rows.map(row => row.map(this.escapeCsvCell).join(',')).join('\n');
  },

  escapeCsvCell(value) {
    const text = String(value === undefined || value === null ? '' : value);
    return `"${text.replace(/"/g, '""')}"`;
  },

  copyCsvToClipboard(csv) {
    wx.setClipboardData({
      data: csv,
      success: () => {
        wx.showModal({
          title: '已复制导出内容',
          content: '当前微信环境不能直接分享文件，CSV 内容已复制到剪贴板，可粘贴到表格或文档中保存。',
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: () => {
        wx.showToast({ title: '导出失败', icon: 'none' });
      }
    });
  },

  formatExportDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  },

  formatDateTime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  },

  /** 生成分享海报（功过格版） */
  generateShareImage(callback) {
    var that = this;
    var dd = that.data.displayDate || '';
    var quote = (that.data.dailyQuote && that.data.dailyQuote.text) || '';
    var goodTotal = that.data.currentGoodTotal || 0;
    var badTotal = that.data.currentBadTotal || 0;
    var net = that.data.currentNetMerit || 0;

    wx.showLoading({ title: '正在生成...' });

    var query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec(function(res) {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading(); callback({ success: false }); return;
      }

      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getSystemInfoSync().pixelRatio;

      var W = 500, H = 750;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      try {
        // 背景
        var bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#FFF8E7'); bgGrad.addColorStop(1, '#FFF3D6');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

        // 边框
        ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, W - 30, H - 30);

        // 标题
        ctx.fillStyle = '#8B6914'; ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center'; ctx.fillText('功过格 · 岁时记', W / 2, 70);

        // 日期
        ctx.fillStyle = '#5D4037'; ctx.font = '26px sans-serif';
        ctx.fillText(dd, W / 2, 115);

        // 引文
        if (quote) {
          ctx.fillStyle = '#6D5A2E'; ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          var shortQuote = quote.length > 20 ? quote.substring(0, 20) + '...' : quote;
          ctx.fillText('「' + shortQuote + '」', W / 2, 155);
        }

        // 分数卡片区域
        var cardY = 200;
        ctx.fillStyle = '#fff';
        roundRect(ctx, 30, cardY, W - 60, 160, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(218,165,32,0.2)';
        ctx.lineWidth = 1;
        roundRect(ctx, 30, cardY, W - 60, 160, 16);
        ctx.stroke();

        // 善行
        ctx.fillStyle = '#2E7D32'; ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left'; ctx.fillText('善行', 55, cardY + 45);
        ctx.fillStyle = '#2E7D32'; ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center'; ctx.fillText('+' + goodTotal, W / 2, cardY + 85);

        // 过失
        ctx.fillStyle = '#C62828'; ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left'; ctx.fillText('过失', 55, cardY + 120);
        ctx.fillStyle = '#C62828'; ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center'; ctx.fillText('-' + badTotal, W / 2, cardY + 150);

        // 净功德
        var netColor = net >= 0 ? '#2E7D32' : '#C62828';
        var netStr = net >= 0 ? ('+' + net) : String(net);
        ctx.fillStyle = netColor; ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center'; ctx.fillText('净功德：' + netStr + ' 分', W / 2, cardY + 210);

        // 底部品牌
        ctx.fillStyle = '#AEAEB2'; ctx.font = '13px sans-serif';
        ctx.fillText('— 了凡四训 · 岁时记 —', W / 2, H - 50);
        ctx.font = '11px sans-serif';
        ctx.fillText('长按识别小程序码查看更多', W / 2, H - 25);

        setTimeout(function() {
          wx.canvasToTempFilePath({
            canvas: canvas, width: W, height: H,
            destWidth: W * 2, destHeight: H * 2,
            fileType: 'jpg', quality: 0.95,
            success: function(saveRes) {
              wx.hideLoading(); callback({ success: true, tempFilePath: saveRes.tempFilePath });
            },
            fail: function(err) {
              console.error('canvasToTempFilePath 失败:', err);
              wx.hideLoading(); callback({ success: false });
            }
          });
        }, 100);
      } catch (e) {
        console.error('绘制出错:', e); wx.hideLoading(); callback({ success: false });
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
