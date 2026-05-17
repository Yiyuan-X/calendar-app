function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function createCheckpointManager(options) {
  const limit = Math.max(Number(options && options.limit) || 12, 1);
  const stack = [];

  return {
    snapshot(label, design) {
      const item = {
        label: label || 'checkpoint',
        design: clone(design),
        createdAt: Date.now()
      };
      stack.push(item);
      while (stack.length > limit) stack.shift();
      return item;
    },
    latest() {
      return stack.length ? clone(stack[stack.length - 1]) : null;
    },
    rollback(label) {
      if (!stack.length) return null;
      if (!label) return clone(stack[stack.length - 1]);
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].label === label) return clone(stack[i]);
      }
      return null;
    },
    clear() {
      stack.length = 0;
    },
    size() {
      return stack.length;
    }
  };
}

module.exports = {
  createCheckpointManager
};
