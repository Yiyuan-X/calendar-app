// pages/help/help.js — 使用说明
const share = require('../../utils/share');

Page({
  onLoad() {
    share.enableShareMenu();
    getApp().applyDisplaySettings(this);
  },

  onShareAppMessage() {
    return share.appMessage({
      title: '岁时记使用说明',
      path: '/pages/index/index'
    });
  },

  onShareTimeline() {
    return share.timeline({ title: '岁时记使用说明' });
  }
});
