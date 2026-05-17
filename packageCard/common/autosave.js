const AUTOSAVE_KEY = 'card_tool_autosave_recovery';
const EXPORT_RECOVERY_KEY = 'card_tool_export_recovery';

function safeSet(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

function safeGet(key) {
  try {
    return wx.getStorageSync(key);
  } catch (e) {
    return null;
  }
}

function safeRemove(key) {
  try {
    wx.removeStorageSync(key);
  } catch (e) {}
}

function createAutosave(options) {
  const delay = Math.max(Number(options && options.delay) || 1200, 300);
  let timer = null;
  let pending = null;

  function flush() {
    clearTimeout(timer);
    timer = null;
    if (!pending) return null;
    const payload = {
      design: pending.design,
      reason: pending.reason || 'autosave',
      updatedAt: Date.now()
    };
    safeSet(AUTOSAVE_KEY, payload);
    pending = null;
    return payload;
  }

  return {
    schedule(design, reason) {
      pending = { design, reason };
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    flush,
    clear() {
      clearTimeout(timer);
      timer = null;
      pending = null;
      safeRemove(AUTOSAVE_KEY);
    }
  };
}

function getRecoveryDraft(maxAgeMs) {
  const payload = safeGet(AUTOSAVE_KEY);
  if (!payload || !payload.design) return null;
  const maxAge = Number(maxAgeMs || 24 * 60 * 60 * 1000);
  if (Date.now() - Number(payload.updatedAt || 0) > maxAge) {
    safeRemove(AUTOSAVE_KEY);
    return null;
  }
  return payload;
}

function markExportRecovery(design, meta) {
  return safeSet(EXPORT_RECOVERY_KEY, {
    design,
    meta: meta || {},
    updatedAt: Date.now()
  });
}

function getExportRecovery(maxAgeMs) {
  const payload = safeGet(EXPORT_RECOVERY_KEY);
  if (!payload || !payload.design) return null;
  const maxAge = Number(maxAgeMs || 60 * 60 * 1000);
  if (Date.now() - Number(payload.updatedAt || 0) > maxAge) {
    safeRemove(EXPORT_RECOVERY_KEY);
    return null;
  }
  return payload;
}

function clearExportRecovery() {
  safeRemove(EXPORT_RECOVERY_KEY);
}

module.exports = {
  createAutosave,
  getRecoveryDraft,
  markExportRecovery,
  getExportRecovery,
  clearExportRecovery
};
