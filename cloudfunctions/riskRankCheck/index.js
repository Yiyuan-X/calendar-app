const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  try {
    const wxContext = cloud.getWXContext();
    let response;
    try {
      response = await cloud.openapi.security.getUserRiskRank({
        openid: wxContext.OPENID
      });
    } catch (firstError) {
      response = await cloud.openapi.security.getUserRiskRank({});
    }
    const riskRank = Number(
      (response && (response.risk_rank ?? response.riskRank ?? response.riskrank)) || 0
    );
    return {
      ok: true,
      riskRank: Number.isFinite(riskRank) ? riskRank : 0,
      raw: response
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'risk_check_failed',
      message: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : String(error || '')
    };
  }
};
