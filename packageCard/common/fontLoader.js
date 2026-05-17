const cssSourceCache = {};

function isCssUrl(url) {
  return /\.css(?:[?#].*)?$/i.test(String(url || ''));
}

function resolveRelativeUrl(baseUrl, assetUrl) {
  const value = String(assetUrl || '').trim().replace(/^['"]|['"]$/g, '');
  if (!value) return '';
  if (value.indexOf('//') === 0) return `https:${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  try {
    const base = String(baseUrl || '').split('?')[0].split('#')[0];
    const parts = base.split('/');
    parts.pop();
    value.split('/').forEach(part => {
      if (!part || part === '.') return;
      if (part === '..') parts.pop();
      else parts.push(part);
    });
    return parts.join('/');
  } catch (e) {
    return value;
  }
}

function pickFontAssetFromCss(cssText, cssUrl) {
  const urls = [];
  const pattern = /url\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(cssText || ''))) {
    const raw = String(match[1] || '').trim().replace(/^['"]|['"]$/g, '');
    if (/\.(woff2|woff|ttf|otf)(?:[?#].*)?$/i.test(raw)) {
      urls.push(resolveRelativeUrl(cssUrl, raw));
    }
  }
  if (!urls.length) return '';
  return urls.find(url => /\.woff2(?:[?#].*)?$/i.test(url)) || urls[0];
}

function requestCss(url) {
  if (cssSourceCache[url]) return Promise.resolve(cssSourceCache[url]);
  return new Promise(resolve => {
    if (typeof wx === 'undefined' || !wx.request) {
      resolve('');
      return;
    }
    wx.request({
      url,
      method: 'GET',
      success: res => {
        const assetUrl = pickFontAssetFromCss(String(res.data || ''), url);
        cssSourceCache[url] = assetUrl;
        resolve(assetUrl);
      },
      fail: () => resolve('')
    });
  });
}

function resolveFontFaceSource(fontUrl) {
  const url = String(fontUrl || '').trim();
  if (!url) return Promise.resolve('');
  if (!isCssUrl(url)) return Promise.resolve(`url("${url}")`);
  return requestCss(url).then(assetUrl => assetUrl ? `url("${assetUrl}")` : '');
}

module.exports = {
  resolveFontFaceSource
};
