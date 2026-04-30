const APP_NAME = '岁时记';
const PROMO_CODE_PATH = '/images/promo-qrcode.png';

function enableShareMenu() {
  if (typeof wx.showShareMenu !== 'function') return;

  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  });
}

function getCurrentPath(defaultPath) {
  const pages = getCurrentPages();
  const page = pages && pages.length ? pages[pages.length - 1] : null;
  if (!page || !page.route) return defaultPath || '/pages/index/index';

  const query = page.options ? Object.keys(page.options).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(page.options[key]);
  }).join('&') : '';

  return '/' + page.route + (query ? '?' + query : '');
}

function appMessage(options) {
  const opts = options || {};
  return {
    title: opts.title || APP_NAME + ' · 日历节日倒计时',
    path: opts.path || getCurrentPath('/pages/index/index')
  };
}

function timeline(options) {
  const opts = options || {};
  const result = {
    title: opts.title || APP_NAME + ' · 日历节日倒计时',
    query: opts.query || ''
  };
  result.imageUrl = opts.imageUrl || PROMO_CODE_PATH;
  return result;
}

module.exports = {
  enableShareMenu,
  appMessage,
  timeline
};
