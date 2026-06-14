const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function getMediaValue(event) {
  return String(event && (event.value || (event.media && event.media.value) || '') || '').trim();
}

function getContentType(event) {
  return String(event && (event.contentType || (event.media && event.media.contentType) || 'image/jpeg') || 'image/jpeg');
}

function buildBlockedResult(error, contentLength) {
  const errCode = Number(error && (error.errCode || error.code || error.errorCode || 0)) || 0;
  const message = String(error && (error.errMsg || error.message) || error || '');
  const blocked = errCode === 87014 || /87014/.test(message) || /media/i.test(message) || /违规/.test(message);
  if (blocked) {
    return {
      ok: false,
      blocked: true,
      errCode: 87014,
      contentLength,
      reason: 'content_violation'
    };
  }
  return {
    ok: false,
    blocked: false,
    errCode,
    contentLength,
    reason: 'content_check_failed',
    message
  };
}

exports.main = async (event = {}) => {
  const value = getMediaValue(event);
  if (!value) {
    return { ok: true, empty: true, contentLength: 0 };
  }

  try {
    await cloud.openapi.security.mediaCheckAsync({
      media: {
        contentType: getContentType(event),
        value
      }
    });
    return { ok: true, passed: true, contentLength: value.length };
  } catch (error) {
    return buildBlockedResult(error, value.length);
  }
};
