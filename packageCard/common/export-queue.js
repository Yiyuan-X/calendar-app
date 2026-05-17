function createCancelToken() {
  return {
    cancelled: false,
    cancel() {
      this.cancelled = true;
    },
    throwIfCancelled() {
      if (this.cancelled) throw new Error('export cancelled');
    }
  };
}

function estimateExportPixels(design, scale) {
  const size = (design && design.size) || {};
  const width = Number(size.width || 750);
  const height = Number(size.height || 1000);
  const outputScale = Number(scale || 1.5);
  return width * height * outputScale * outputScale;
}

function createExportQueue(options) {
  const maxPixels = Number(options && options.maxPixels) || 750 * 1000 * 4;
  const cooldownMs = Number(options && options.cooldownMs) || 1200;
  let locked = false;
  let currentToken = null;
  let lastStartedAt = 0;

  return {
    isLocked() {
      return locked;
    },
    cancel() {
      if (currentToken) currentToken.cancel();
    },
    async run(design, exportOptions, worker) {
      if (locked) throw new Error('export already running');
      const now = Date.now();
      if (now - lastStartedAt < cooldownMs) throw new Error('export too frequent');
      const pixels = estimateExportPixels(design, exportOptions && exportOptions.scale);
      if (pixels > maxPixels) throw new Error('export memory guard');
      locked = true;
      lastStartedAt = now;
      currentToken = createCancelToken();
      try {
        currentToken.throwIfCancelled();
        const result = await worker(currentToken);
        currentToken.throwIfCancelled();
        return result;
      } finally {
        locked = false;
        currentToken = null;
      }
    }
  };
}

module.exports = {
  createExportQueue,
  createCancelToken,
  estimateExportPixels
};
