const fs = require('fs');
var c = fs.readFileSync('packageCard/editor/editor.wxss', 'utf8');
var old = `.text-block.editing .block-control,\n.text-block.editing .resize-handle,\n.text-block.editing .block-rich-text,\n.text-block.editing .placeholder-text {\n  display: none;\n}`;
var newc = `/* 编辑模式：只显示边框 */
.text-block.editing {
  outline: 2px solid rgba(218, 165, 32, 0.72) !important;
  overflow: visible !important;
}

/* 隐藏的编辑 textarea（移到屏幕外） */
.stage-editor-hidden {
  position: fixed;
  left: -9999px !important;
  top: -9999px !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0;
  pointer-events: none;
}`;
if (c.indexOf(old) >= 0) {
  c = c.replace(old, newc);
  fs.writeFileSync('packageCard/editor/editor.wxss', c);
  console.log('OK');
} else {
  console.log('NOT FOUND');
}
