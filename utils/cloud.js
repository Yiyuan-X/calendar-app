/**
 * utils/cloud.js — 云开发数据库统一层
 *
 * 策略：云端优先 + 本地缓存 + 离线兜底
 * - 有网时：读写走云数据库，本地缓存作为备份
 * - 无网时：自动降级为本地存储，恢复后自动同步
 */

// ===== 配置 =====
const ENV_ID = 'test-d5g0jflil769eb9c0'; // 云开发环境ID（与控制台一致）
const DB_NAME = 'calendar_app'; // MySQL 数据库名（或云开发集合名）

// 云开发是否已初始化
let _cloudInitialized = false;
let _isOnline = true; // 在线状态

// ===== 表名常量 =====
const TABLES = {
  TASKS: 'tasks',              // 功课列表
  RECORDS: 'records',          // 功课计数记录
  DAILY_DETAIL: 'daily_detail',// 功课每日详情（发愿/备注）
  EVENTS: 'events',            // 重要日子
  NOTES: 'notes',              // 每日备注
  SETTINGS: 'settings',        // 用户设置
  MERIT_RECORDS: 'merit_records', // 功过格记录
  CUSTOM_MERIT_ITEMS: 'custom_merit_items', // 自定义功过条目
  DELETED_BUILTIN_ITEMS: 'deleted_builtin_items', // 已删除内置条目
  QUICK_COUNTER: 'quick_counter', // 通用计数器
  MEMO: 'memo' // 备忘录
};

// ===== 本地缓存 Key 前缀 =====
const CACHE_PREFIX = 'cloud_cache_';
const PENDING_PREFIX = 'pending_sync_';

/**
 * 初始化云开发
 */
function initCloud() {
  if (_cloudInitialized) return;
  if (!wx.cloud) {
    console.warn('[Cloud] 云开发未初始化，使用本地模式');
    _isOnline = false;
    return;
  }
  try {
    wx.cloud.init({
      env: ENV_ID,
      traceUser: true
    });
    _cloudInitialized = true;
    console.log('[Cloud] 云开发初始化成功');
  } catch (e) {
    console.warn('[Cloud] 云开发初始化失败:', e);
    _isOnline = false;
  }
}

/**
 * 获取当前用户ID（openid）
 */
async function getOpenId() {
  if (!_cloudInitialized) return 'local_user';
  try {
    const res = await wx.cloud.callFunction({
      name: 'getOpenId',
      data: {}
    });
    return res.result.openid || 'unknown_user';
  } catch (e) {
    console.warn('[Cloud] 获取openid失败:', e);
    return 'local_user';
  }
}

// ==================== 通用 CRUD ====================

/**
 * 获取数据（云端优先，本地兜底）
 * @param {string} table - 表名
 * @param {string} key - 数据键（如日期、id等）
 * @returns {Promise<any>}
 */
async function get(table, key) {
  const cacheKey = CACHE_PREFIX + table + '_' + key;

  if (_isOnline && _cloudInitialized) {
    try {
      const db = wx.cloud.database();
      // 直接用 key 查询，_openid 由云数据库安全规则自动过滤
      const res = await db.collection(table)
        .where({ key: key })
        .get();

      if (res.data && res.data.length > 0) {
        const data = res.data[0].data;
        // 更新本地缓存
        setLocalCache(cacheKey, data);
        console.log(`[Cloud] ✅ ${table}.${key} 读取成功`);
        return data;
      }
      console.log(`[Cloud] ℹ️ ${table}.${key} 云端无数据，返回本地`);
    } catch (e) {
      console.warn(`[Cloud] ${table}.${key} 读取失败，降级到本地:`, e);
    }
  }

  // 降级到本地缓存
  return getLocalCache(cacheKey);
}

/**
 * 获取列表数据
 * @param {string} table - 表名
 * @returns {Promise<Array>}
 */
async function getAll(table) {
  const cacheKey = CACHE_PREFIX + table;

  if (_isOnline && _cloudInitialized) {
    try {
      const db = wx.cloud.database();
      // _openid 由云数据库安全规则自动过滤，无需手动指定
      const res = await db.collection(table)
        .orderBy('createdAt', 'desc')
        .get();

      if (res.data) {
        const list = res.data.map(item => item.data || item);
        setLocalCache(cacheKey, list);
        console.log(`[Cloud] ✅ ${table} 列表读取成功，共 ${list.length} 条`);
        return list;
      }
    } catch (e) {
      console.warn(`[Cloud] ${table} 列表读取失败，降级到本地:`, e);
    }
  }

  return getLocalCache(cacheKey) || [];
}

/**
 * 设置/保存数据（同时写云端和本地）
 * @param {string} table - 表名
 * @param {string} key - 数据键
 * @param {any} data - 数据内容
 * @returns {Promise<boolean>}
 */
async function set(table, key, data) {
  const cacheKey = CACHE_PREFIX + table + '_' + key;

  // 先写本地缓存（即时响应）
  setLocalCache(cacheKey, data);

  if (_isOnline && _cloudInitialized) {
    try {
      const db = wx.cloud.database();

      // upsert：先查再更新或插入（不手动指定 _openid，由系统自动注入）
      const existing = await db.collection(table)
        .where({ key: key })
        .get();

      if (existing.data && existing.data.length > 0) {
        // 更新
        await db.collection(table).doc(existing.data[0]._id).update({
          data: { data: data, updatedAt: Date.now() }
        });
        console.log(`[Cloud] ✅ ${table}.${key} 更新成功`);
      } else {
        // 新增（不写 _openid，让云数据库自动注入当前用户的 openid）
        await db.collection(table).add({
          data: {
            key: key,
            data: data,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        });
        console.log(`[Cloud] ✅ ${table}.${key} 新增成功`);
      }
      return true;
    } catch (e) {
      console.warn(`[Cloud] ❌ ${table}.${key} 写入失败:`, e);
      // 加入待同步队列
      addPendingSync(table, key, data);
      return false; // 返回false但本地已有数据
    }
  }

  return true;
}

/**
 * 删除数据
 * @param {string} table - 表名
 * @param {string} key - 数据键
 * @returns {Promise<boolean>}
 */
async function remove(table, key) {
  const cacheKey = CACHE_PREFIX + table + '_' + key;

  // 先删本地
  removeLocalCache(cacheKey);

  if (_isOnline && _cloudInitialized) {
    try {
      const db = wx.cloud.database();
      const existing = await db.collection(table)
        .where({ key: key })
        .get();

      if (existing.data && existing.data.length > 0) {
        await db.collection(table).doc(existing.data[0]._id).remove();
        console.log(`[Cloud] ✅ ${table}.${key} 删除成功`);
      }
      return true;
    } catch (e) {
      console.warn(`[Cloud] ❌ ${table}.${key} 删除失败:`, e);
      return false;
    }
  }

  return true;
}

// ==================== 批量操作（用于列表型数据）====================

/**
 * 保存整个列表（覆盖式）
 * @param {string} table - 表名
 * @param {Array} list - 数据数组
 * @returns {Promise<boolean>}
 */
async function setList(table, list) {
  const cacheKey = CACHE_PREFIX + table;
  setLocalCache(cacheKey, list);

  if (_isOnline && _cloudInitialized) {
    try {
      const db = wx.cloud.database();

      // 删除旧数据（不手动指定 _openid）
      const oldData = await db.collection(table)
        .where({})
        .get();

      if (oldData.data && oldData.data.length > 0) {
        for (const item of oldData.data) {
          await db.collection(table).doc(item._id).remove();
        }
      }

      // 批量插入新数据（不写 _openid，让系统自动注入）
      if (list.length > 0) {
        for (const item of list) {
          await db.collection(table).add({
            data: {
              key: item.id || item._id || String(Date.now()) + Math.random().toString(36).substr(2, 5),
              data: item,
              createdAt: item.createdAt || Date.now(),
              updatedAt: Date.now()
            }
          });
        }
      }
      console.log(`[Cloud] ✅ ${table} 批量写入成功，共 ${list.length} 条`);
      return true;
    } catch (e) {
      console.warn(`[Cloud] ❌ ${table} 批量写入失败:`, e);
      return false;
    }
  }

  return true;
}

/**
 * 获取整个列表
 * @param {string} table - 表名
 * @returns {Promise<Array>}
 */
async function getList(table) {
  return getAll(table);
}

// ==================== 本地缓存管理 ====================

function getLocalCache(key) {
  try {
    return wx.getStorageSync(key);
  } catch (e) {
    return null;
  }
}

function setLocalCache(key, data) {
  try {
    wx.setStorageSync(key, data);
  } catch (e) {
    console.warn('[Cloud] 本地缓存写入失败:', e);
  }
}

function removeLocalCache(key) {
  try {
    wx.removeStorageSync(key);
  } catch (e) {}
}

// ==================== 待同步队列（离线支持）====================

function addPendingSync(table, key, data) {
  const pendingKey = PENDING_PREFIX + table;
  let pending = getLocalCache(pendingKey) || [];
  pending.push({ table, key, data, time: Date.now() });
  // 最多保留100条待同步记录
  if (pending.length > 100) pending = pending.slice(-100);
  setLocalCache(pendingKey, pending);
}

/**
 * 同步待处理的数据（在网络恢复后调用）
 */
async function syncPending() {
  if (!_isOnline || !_cloudInitialized) return;

  const tables = Object.values(TABLES);
  let syncedCount = 0;

  for (const table of tables) {
    const pendingKey = PENDING_PREFIX + table;
    const pending = getLocalCache(pendingKey) || [];

    for (const item of pending) {
      try {
        await set(item.table, item.key, item.data);
        syncedCount++;
      } catch (e) {
        console.warn(`[Cloud] 同步失败 ${item.table}.${item.key}:`, e);
      }
    }

    // 清空该表的待同步队列
    if (pending.length > 0) {
      removeLocalCache(pendingKey);
    }
  }

  if (syncedCount > 0) {
    console.log(`[Cloud] 已同步 ${syncedCount} 条离线数据`);
  }
}

// ==================== 网络状态监听 ====================

function watchNetworkStatus() {
  wx.onNetworkStatusChange(res => {
    _isOnline = res.isConnected;
    if (_isOnline) {
      console.log('[Cloud] 网络恢复，开始同步...');
      syncPending();
    }
  });

  // 初始检查
  wx.getNetworkType({
    success(res) {
      _isOnline = res.networkType !== 'none';
    }
  });
}

// ==================== 导出 ====================

module.exports = {
  initCloud,
  TABLES,

  // 通用CRUD
  get,
  getAll,
  set,
  remove,

  // 列表操作
  setList,
  getList,

  // 工具方法
  getOpenId,
  isOnline: () => _isOnline,
  syncPending,
  watchNetworkStatus
};
