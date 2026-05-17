/**
 * 统一坐标转换层 (Unified Coordinate Transform Layer)
 *
 * 坐标空间：
 *   Screen  — 触摸事件的 clientX/Y 或 pageX/Y（CSS px）
 *   Preview — stage 区域内的 rpx 坐标，用于 DOM 定位
 *   Design  — 750rpx 基准的设计坐标，用于持久化数据
 *   Local   — 文字块内的 rpx 坐标，用于 hit testing / caret / selection
 *
 * 转换流程：
 *   Screen → Preview → Design
 *                ↘ Local (含 rotation inverse transform)
 *
 * 核心函数：
 *   screenToPreview()   — Screen → Preview
 *   previewToDesign()   — Preview → Design
 *   designToPreview()   — Design → Preview
 *   screenToLocal()     — Screen → Local (支持逆旋转)
 *   localToScreen()     — Local → Screen (支持旋转)
 *   applyInverseRotation() — 对 local 坐标做逆旋转变换
 *   getBlockTransformMatrix() — 获取 block 的变换矩阵参数
 */

/**
 * Screen → Preview
 *
 * 将屏幕 px 坐标转换为 stage 内的 rpx 坐标
 *
 * @param {number} screenX - clientX 或 pageX（px）
 * @param {number} screenY - clientY 或 pageY（px）
 * @param {object} stageRect - 由 boundingClientRect 获取的 stage 位置
 * @param {number} rpxPerPx - 750 / windowWidth
 * @returns {{ x: number, y: number }} preview 坐标（rpx）
 */
function screenToPreview(screenX, screenY, stageRect, rpxPerPx) {
  return {
    x: (screenX - (stageRect.left || 0)) * (rpxPerPx || 1),
    y: (screenY - (stageRect.top || 0)) * (rpxPerPx || 1)
  };
}

/**
 * Preview → Design
 *
 * 将 stage 内的 rpx 坐标转换为设计坐标
 *
 * @param {number} previewX - preview rpx
 * @param {number} previewY - preview rpx
 * @param {object} previewScale - { x, y } 由 getPreviewScales(design) 得到
 * @returns {{ x: number, y: number }} design 坐标（rpx, 750 基准）
 */
function previewToDesign(previewX, previewY, previewScale) {
  return {
    x: Math.round(previewX / (previewScale.x || 1)),
    y: Math.round(previewY / (previewScale.y || 1))
  };
}

/**
 * Design → Preview
 *
 * 将设计坐标转换为 stage 内的 rpx 坐标
 *
 * @param {number} designX - design rpx
 * @param {number} designY - design rpx
 * @param {object} previewScale - { x, y }
 * @returns {{ x: number, y: number }} preview 坐标（rpx）
 */
function designToPreview(designX, designY, previewScale) {
  return {
    x: Math.round((designX || 0) * (previewScale.x || 1)),
    y: Math.round((designY || 0) * (previewScale.y || 1))
  };
}

/**
 * 获取 block 的变换参数
 *
 * @param {object} block - 包含 previewX/Y/Width/Height/rotation 的 block 对象
 * @returns {object} 变换参数
 */
function getBlockTransformMatrix(block) {
  var blockWidth = Number(block.previewWidth || 0);
  var blockHeight = Number(block.previewOverlayHeight || block.previewHeight || 0);
  var rotation = Number(block.rotation || 0);
  // 旋转中心：block 矩形的中心（preview 坐标）
  var cx = Number(block.previewX || 0) + blockWidth / 2;
  var cy = Number(block.previewY || 0) + blockHeight / 2;
  return {
    // block 左上角在 preview 空间的坐标
    x: Number(block.previewX || 0),
    y: Number(block.previewY || 0),
    width: blockWidth,
    height: blockHeight,
    // 旋转中心
    cx: cx,
    cy: cy,
    // 旋转角度（度）
    rotation: rotation,
    // 旋转弧度
    rad: rotation * Math.PI / 180,
    // 是否有旋转
    hasRotation: rotation !== 0
  };
}

/**
 * 对 local 坐标做逆旋转变换
 *
 * 给定 preview 空间中相对于 block 旋转中心的偏移 (dx, dy)，
 * 返回逆旋转后的偏移，使得映射回 block 局部坐标系
 *
 * 旋转变换：
 *   screen_offset = R(θ) × local_offset
 *   local_offset  = R(-θ) × screen_offset
 *
 * 其中旋转中心是 block 矩形中心
 *
 * @param {number} dx - 相对于旋转中心的 X 偏移（preview rpx）
 * @param {number} dy - 相对于旋转中心的 Y 偏移（preview rpx）
 * @param {number} rotationDeg - 旋转角度（度）
 * @returns {{ x: number, y: number }} 逆旋转后的偏移
 */
function applyInverseRotation(dx, dy, rotationDeg) {
  if (!rotationDeg) return { x: dx, y: dy };
  var rad = -rotationDeg * Math.PI / 180;
  var cos = Math.cos(rad);
  var sin = Math.sin(rad);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos
  };
}

/**
 * 对 local 坐标做正旋转变换（local → screen 方向）
 *
 * @param {number} dx - 相对于旋转中心的 X 偏移（local rpx）
 * @param {number} dy - 相对于旋转中心的 Y 偏移（local rpx）
 * @param {number} rotationDeg - 旋转角度（度）
 * @returns {{ x: number, y: number }} 旋转后的偏移
 */
function applyRotation(dx, dy, rotationDeg) {
  if (!rotationDeg) return { x: dx, y: dy };
  var rad = rotationDeg * Math.PI / 180;
  var cos = Math.cos(rad);
  var sin = Math.sin(rad);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos
  };
}

/**
 * Screen → Local（核心函数）
 *
 * 将屏幕坐标转换为文字块内的局部坐标
 * 包含：screen → preview → 减去 block 偏移 → 逆旋转
 *
 * 步骤：
 *   1. screenToPreview: screen px → stage rpx
 *   2. 减去 block.previewX/Y: 得到相对于 block 左上角的 preview rpx
 *   3. 减去 block 中心偏移: 得到相对于旋转中心的偏移
 *   4. applyInverseRotation: 逆旋转
 *   5. 加回中心到左上角的偏移: 恢复为 block local 坐标
 *
 * @param {number} screenX - clientX 或 pageX（px）
 * @param {number} screenY - clientY 或 pageY（px）
 * @param {object} block - block 对象（需含 previewX/Y/Width/Height/rotation）
 * @param {object} stageRect - boundingClientRect 结果
 * @param {number} rpxPerPx - 750 / windowWidth
 * @returns {{ x: number, y: number }} block local 坐标（rpx）
 */
function screenToLocal(screenX, screenY, block, stageRect, rpxPerPx) {
  // Step 1: screen → preview
  var preview = screenToPreview(screenX, screenY, stageRect, rpxPerPx);
  var matrix = getBlockTransformMatrix(block);

  // Step 2: preview → 相对于 block 左上角
  var relX = preview.x - matrix.x;
  var relY = preview.y - matrix.y;

  // Step 3 & 4: 如果有旋转，做逆变换
  if (matrix.hasRotation) {
    // 先转为相对于旋转中心的偏移
    var dx = relX - matrix.width / 2;
    var dy = relY - matrix.height / 2;
    // 逆旋转
    var inversed = applyInverseRotation(dx, dy, matrix.rotation);
    // 恢复为相对于 block 左上角的坐标
    relX = inversed.x + matrix.width / 2;
    relY = inversed.y + matrix.height / 2;
  }

  return { x: relX, y: relY };
}

/**
 * Local → Screen
 *
 * 将 block local 坐标转换为屏幕坐标
 * 包含：正旋转 → 加 block 偏移 → preview → screen
 *
 * @param {number} localX - block local rpx
 * @param {number} localY - block local rpx
 * @param {object} block - block 对象
 * @param {object} stageRect - boundingClientRect 结果
 * @param {number} rpxPerPx - 750 / windowWidth
 * @returns {{ x: number, y: number }} screen 坐标（px）
 */
function localToScreen(localX, localY, block, stageRect, rpxPerPx) {
  var matrix = getBlockTransformMatrix(block);
  var relX = localX;
  var relY = localY;

  // 如果有旋转，做正变换
  if (matrix.hasRotation) {
    var dx = relX - matrix.width / 2;
    var dy = relY - matrix.height / 2;
    var rotated = applyRotation(dx, dy, matrix.rotation);
    relX = rotated.x + matrix.width / 2;
    relY = rotated.y + matrix.height / 2;
  }

  // 加 block 偏移 → preview 坐标
  var previewX = relX + matrix.x;
  var previewY = relY + matrix.y;

  // preview → screen
  var pxPerRpx = 1 / (rpxPerPx || 1);
  return {
    x: previewX * pxPerRpx + (stageRect.left || 0),
    y: previewY * pxPerRpx + (stageRect.top || 0)
  };
}

module.exports = {
  screenToPreview: screenToPreview,
  previewToDesign: previewToDesign,
  designToPreview: designToPreview,
  screenToLocal: screenToLocal,
  localToScreen: localToScreen,
  applyInverseRotation: applyInverseRotation,
  applyRotation: applyRotation,
  getBlockTransformMatrix: getBlockTransformMatrix
};
