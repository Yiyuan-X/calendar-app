const EVENTS_KEY = 'analytics_events';
const SUMMARY_KEY = 'analytics_summary';
const MAX_EVENTS = 500;

function getStorage(key, fallback) {
  try {
    return wx.getStorageSync(key) || fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (e) {}
}

function track(name, props) {
  if (!name) return;
  try {
    const event = {
      name,
      props: props || {},
      ts: Date.now()
    };
    const events = getStorage(EVENTS_KEY, []);
    events.unshift(event);
    setStorage(EVENTS_KEY, events.slice(0, MAX_EVENTS));

    const summary = getStorage(SUMMARY_KEY, {});
    const item = summary[name] || { count: 0, lastTs: 0 };
    summary[name] = {
      count: item.count + 1,
      lastTs: event.ts
    };
    setStorage(SUMMARY_KEY, summary);
  } catch (e) {}
}

function getEvents() {
  return getStorage(EVENTS_KEY, []);
}

function getSummary() {
  return getStorage(SUMMARY_KEY, {});
}

module.exports = {
  track,
  getEvents,
  getSummary
};
