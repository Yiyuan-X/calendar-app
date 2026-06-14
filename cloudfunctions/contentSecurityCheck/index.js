const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function buildBlockedResult(error, contentLength) {
  const errCode = Number(error && (error.errCode || error.code || error.errorCode || 0)) || 0;
  const message = String(error && (error.errMsg || error.message) || error || '');
  const blocked = errCode === 87014 || /87014/.test(message) || /content security/i.test(message) || /违规/.test(message);
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
  const content = String(event.content || '').trim();
  if (!content) {
    return { ok: true, empty: true, contentLength: 0 };
  }

  try {
    await cloud.openapi.security.msgSecCheck({ content });
    return { ok: true, passed: true, contentLength: content.length };
  } catch (error) {
    return buildBlockedResult(error, content.length);
  }
};
