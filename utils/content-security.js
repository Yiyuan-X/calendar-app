const analytics = require('./analytics');

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function deltaToText(delta) {
  return ((delta && delta.ops) || []).map(op => String(op.insert || '')).join('');
}

function collectPosterContent(design) {
  const seen = new Set();
  const chunks = [];

  function pushText(value) {
    const text = normalizeText(value);
    if (!text || seen.has(text)) return;
    seen.add(text);
    chunks.push(text);
  }

  ((design && design.blocks) || []).forEach(block => {
    if (!block || block.type !== 'text') return;
    pushText(deltaToText(block.delta));
  });

  pushText((design && design.inputText) || '');
  return chunks;
}

function getFileExtension(filePath) {
  const match = String(filePath || '').toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/);
  return match ? match[1] : '';
}

function getImageContentType(filePath) {
  const ext = getFileExtension(filePath);
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'bmp') return 'image/bmp';
  return 'image/jpeg';
}

function isRemoteImageSrc(src) {
  return /^https?:\/\//i.test(String(src || ''));
}

function isDataImageSrc(src) {
  return /^data:image\//i.test(String(src || ''));
}

function isLocalImageSrc(src) {
  const value = String(src || '');
  return !!value && !isRemoteImageSrc(value) && !isDataImageSrc(value);
}

function readFileAsBase64(filePath) {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || !wx.getFileSystemManager) {
      reject(new Error('filesystem unavailable'));
      return;
    }
    const fs = wx.getFileSystemManager();
    const candidates = Array.from(new Set([
      filePath,
      String(filePath || '').replace(/^wxfile:\/\//i, ''),
      String(filePath || '').replace(/^http:\/\/tmp\/+/i, '/tmp/'),
      String(filePath || '').replace(/^http:\/\/tmp\//i, '')
    ])).filter(Boolean);

    const tryRead = index => {
      if (index >= candidates.length) {
        resolve('');
        return;
      }
      fs.readFile({
        filePath: candidates[index],
        encoding: 'base64',
        success: res => resolve(String(res.data || '')),
        fail: () => tryRead(index + 1)
      });
    };

    tryRead(0);
  });
}

function collectTextsFromValues(values) {
  const seen = new Set();
  const chunks = [];
  (Array.isArray(values) ? values : [values]).forEach(value => {
    const text = normalizeText(value);
    if (!text || seen.has(text)) return;
    seen.add(text);
    chunks.push(text);
  });
  return chunks;
}

function collectDesignImages(design) {
  const images = [];
  const seen = new Set();

  function pushImage(slot, image) {
    if (!image || image.securityChecked) return;
    const src = String(image.src || '').trim();
    if (!src || !isLocalImageSrc(src)) return;
    const key = `${slot}:${src}`;
    if (seen.has(key)) return;
    seen.add(key);
    images.push({
      slot,
      src,
      contentType: getImageContentType(src)
    });
  }

  pushImage('background', design && design.background);
  pushImage('avatar', design && design.avatar);
  pushImage('overlayImage', design && design.overlayImage);
  pushImage('qrcode', design && design.qrcode);
  ((design && design.qrcodes) || []).forEach((item, index) => pushImage(`qrcodes[${index}]`, item));
  ((design && design.blocks) || []).forEach((block, index) => {
    if (block && block.textTexture) pushImage(`blocks[${index}].textTexture`, block.textTexture);
  });

  return images;
}

function splitContentForCheck(text, maxLength) {
  const limit = Math.max(1, Number(maxLength) || 500);
  const source = normalizeText(text);
  if (!source) return [];
  if (source.length <= limit) return [source];
  const result = [];
  for (let index = 0; index < source.length; index += limit) {
    result.push(source.slice(index, index + limit));
  }
  return result;
}

async function checkTextContentSecurity(values) {
  if (typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.callFunction !== 'function') {
    return { ok: false, skipped: true, reason: 'cloud_unavailable' };
  }

  const contentChunks = [];
  collectTextsFromValues(values).forEach(text => {
    splitContentForCheck(text, 500).forEach(chunk => contentChunks.push(chunk));
  });

  if (!contentChunks.length) {
    return { ok: true, skipped: true, reason: 'empty_content' };
  }

  for (const content of contentChunks) {
    try {
      const response = await wx.cloud.callFunction({
        name: 'contentSecurityCheck',
        data: { content }
      });
      const result = response && response.result ? response.result : {};
      if (result && result.ok === false) return result;
      if (result && result.passed === false) return result;
    } catch (error) {
      return {
        ok: false,
        reason: 'content_check_failed',
        message: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : String(error || '')
      };
    }
  }

  return { ok: true };
}

async function checkImageContentSecurity(design) {
  if (typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.callFunction !== 'function') {
    return { ok: false, skipped: true, reason: 'cloud_unavailable' };
  }

  const images = collectDesignImages(design);
  if (!images.length) {
    return { ok: true, skipped: true, reason: 'empty_content' };
  }

  for (const image of images) {
    try {
      const value = await readFileAsBase64(image.src);
      if (!value) continue;
      const response = await wx.cloud.callFunction({
        name: 'mediaSecurityCheck',
        data: {
          contentType: image.contentType,
          value
        }
      });
      const result = response && response.result ? response.result : {};
      if (result && result.ok === false) return result;
      if (result && result.passed === false) return result;
    } catch (error) {
      return {
        ok: false,
        reason: 'content_check_failed',
        message: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : String(error || '')
      };
    }
  }

  return { ok: true };
}

async function checkPosterContentSecurity(design) {
  return checkTextContentSecurity(collectPosterContent(design));
}

async function checkUserRiskRank() {
  if (typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.callFunction !== 'function') {
    return { ok: false, skipped: true, reason: 'cloud_unavailable' };
  }

  try {
    const response = await wx.cloud.callFunction({
      name: 'riskRankCheck',
      data: {}
    });
    const result = response && response.result ? response.result : {};
    if (result && result.ok === false) return result;
    return result && typeof result.riskRank !== 'undefined' ? result : { ok: true, riskRank: 0 };
  } catch (error) {
    return {
      ok: false,
      reason: 'risk_check_failed',
      message: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : String(error || '')
    };
  }
}

function shouldSoftFailSecurity(result) {
  return !!(result && result.ok === false && result.reason !== 'content_violation' && result.reason !== 'risk_rank_high');
}

function logSecurityFailure(scope, result, details) {
  try {
    const reason = result && (result.reason || result.errCode || 'unknown');
    analytics.track('content_security_failure', {
      scope: String(scope || 'unknown'),
      reason: String(reason),
      ok: !!(result && result.ok),
      blocked: !!(result && result.blocked),
      details: details || {},
      message: result && result.message ? String(result.message).slice(0, 160) : ''
    });
  } catch (e) {}
}

module.exports = {
  checkPosterContentSecurity,
  checkImageContentSecurity,
  checkUserRiskRank,
  shouldSoftFailSecurity,
  logSecurityFailure,
  checkTextContentSecurity,
  collectPosterContent,
  collectDesignImages,
  collectTextsFromValues,
  getFileExtension,
  getImageContentType,
  isLocalImageSrc,
  readFileAsBase64,
  normalizeText
};
