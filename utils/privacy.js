function ensurePrivacyAuthorized(options) {
  const opts = options || {};
  const onSuccess = typeof opts.success === 'function' ? opts.success : function() {};
  const onFail = typeof opts.fail === 'function' ? opts.fail : function() {};

  if (typeof wx.requirePrivacyAuthorize !== 'function') {
    onSuccess();
    return;
  }

  wx.requirePrivacyAuthorize({
    success: onSuccess,
    fail: function(err) {
      if (opts.showToast !== false) {
        wx.showToast({
          title: opts.failToast || '请先同意隐私保护指引',
          icon: 'none'
        });
      }
      onFail(err);
    }
  });
}

function openPrivacyContract() {
  if (typeof wx.openPrivacyContract !== 'function') {
    wx.showToast({
      title: '当前微信版本暂不支持查看',
      icon: 'none'
    });
    return;
  }

  wx.openPrivacyContract({
    fail: function() {
      wx.showToast({
        title: '打开隐私指引失败',
        icon: 'none'
      });
    }
  });
}

function agreePrivacyAuthorization(page, detail) {
  const currentPage = page || getCurrentPage();
  if (currentPage && currentPage.__privacyResolve) {
    currentPage.__privacyResolve(detail || {
      event: 'agree',
      buttonId: 'privacy-agree-btn'
    });
    currentPage.__privacyResolve = null;
  }
  if (currentPage && typeof currentPage.setData === 'function') {
    currentPage.setData({ showPrivacyAuthorization: false });
  }
}

function disagreePrivacyAuthorization(page) {
  const currentPage = page || getCurrentPage();
  if (currentPage && currentPage.__privacyResolve) {
    currentPage.__privacyResolve({ event: 'disagree' });
    currentPage.__privacyResolve = null;
  }
  if (currentPage && typeof currentPage.setData === 'function') {
    currentPage.setData({ showPrivacyAuthorization: false });
  }
}

function getCurrentPage() {
  const pages = getCurrentPages();
  return pages && pages.length ? pages[pages.length - 1] : null;
}

module.exports = {
  ensurePrivacyAuthorized,
  openPrivacyContract,
  agreePrivacyAuthorization,
  disagreePrivacyAuthorization
};
