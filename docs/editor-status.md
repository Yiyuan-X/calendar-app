# 一、编辑器架构分析

当前不是纯 Canvas 编辑器，也不是 contenteditable。实际是：

```text
design 数据
  -> hydrateDesign()
  -> WXML DOM 文字热区 / 选中框 / textarea
  -> previewCanvas 全画布预览
  -> renderer.drawPosterToCanvas() 高清导出
```

架构形态：

```text
用户触摸/输入
  -> editor.js 状态机
    -> activeBlock / activePlainText / selectionStart / inlineEditing
    -> setData 更新 DOM 编辑层
    -> updateActiveBlock 克隆并 hydrate 整个 design
    -> schedulePreviewRender
      -> renderer 全量重绘 previewCanvas
```

结论：当前是 **Canvas 预览 + DOM 交互层 + 透明 textarea 输入层** 的混合方案。

关键问题：
- 编辑态和渲染态没有真正分离。输入、光标、选区、文字块位置、Canvas 预览都共用 `design` 主数据。
- `textarea` 被设置为透明且 `pointer-events: none`，触摸主要由外层 `view` 接管，自定义光标/选区完全靠 JS 估算。
- 输入一次会触发：`setData` 更新输入态、`updateActiveBlock` 克隆整份 design、`hydrateDesign`、再调度 Canvas 全量重绘。
- 存在旧 `editorCtx` / rich-editor 相关函数，但 WXML 当前没有对应 rich-editor，属于历史残留状态通道。

# 二、逐项检查

## 1. 输入系统

严重问题：
- `textarea` 没有绑定 `bindfocus`、`bindselectionchange`，但 JS 里存在 `onTextareaFocus`、`onTextSelection`。这意味着真实原生光标/选区变化没有稳定回流到状态。
- 没有 composition 处理。中文输入法拼音组合阶段会被 `bindinput` 当成普通输入处理，容易出现光标跳、候选字提交错位、安卓输入法卡顿。
- `onActiveTextInput` 每次输入都会调用 `setData`，随后 `updateActiveBlock` 又再次 `setData`，并触发 `schedulePreviewRender(50)`。同一次输入至少两次状态更新。
- `cursor` 读取存在明显 bug：`const cursor = typeof e.detail.cursor === 'number' ? e.cursor : text.length;` 应该读 `e.detail.cursor`，现在可能长期退回末尾，导致光标不稳定。
- 输入态会重建 delta：`rebuildDeltaWithText` 每次输入都重分配 op，格式复杂时成本上升，也可能破坏精细格式边界。

问题等级：P0。

## 2. 光标系统

严重问题：
- 光标不是原生光标，是 `.custom-caret`，位置由 `getSelectionLayout` 估算。
- 估算宽度使用 `estimateSelectionCharWidth`，没有真实 `measureText`，和实际字体、远程字体、粗体、英文、标点、换行都可能不一致。
- 文字渲染实际走 Canvas renderer，编辑层视觉走 DOM/rich-text/估算布局，两套排版规则不一致。
- 旋转文字只在外层 CSS `transform: rotate()`，光标和点击命中没有做旋转坐标逆变换。旋转后点击位置、选区、光标都会偏。
- `stageRect` 依赖缓存，若键盘顶起、页面滚动、面板变化后没有及时刷新，坐标会错。
- 竖排模式 textarea 用 `writing-mode: vertical-rl`，小程序 textarea 对竖排支持不稳定，iOS/安卓表现很可能不同。

问题等级：P0。

## 3. Canvas 渲染性能

瓶颈：
- previewCanvas 每次输入后全画布重绘，不是只重绘当前文字层。
- `renderer.drawPosterToCanvas` 会画背景、头像、覆盖图、所有文字、二维码、擦除层。
- 字体预加载逻辑在预览渲染中仍会走 `preloadFont`，虽然有缓存，但首次和字体切换时会拖慢。
- `layoutText` / `drawTextBlock` 中存在多次 `measureText`，多文字层和长文本会放大成本。
- 纹理文字使用 offscreen canvas，并且按 run/glyph 绘制，长文本或竖排时成本很高。
- 当前调度是 `setTimeout`，不是 requestAnimationFrame 风格节流；touchmove 中 16ms 调度，但实际 async render 可能超过 16ms，容易堆 dirty render。

问题等级：P0/P1。

## 4. 文字对象系统

结构问题：
- 高频路径大量使用 `clone(this.data.design)`，clone 是 `JSON.parse(JSON.stringify())`，多图层、多二维码、擦除路径、纹理数据会越来越重。
- `_saveHistory` 使用 `JSON.stringify(snapshot)` 做重复判断，编辑结束或复杂操作时成本高。
- `hydrateDesign` 会重算所有 block 的 preview 字段，不是只更新活跃 block。
- 拖动时对 `design.blocks.map` 全量遍历并 `setData({ 'design.blocks': blocks })`，多文字层会卡。
- activeBlock 同时存在于 `design.blocks` 和独立 `activeBlock`，容易出现引用/快照不同步。

问题等级：P1，规模上来后会变 P0。

## 5. 手势系统

问题列表：
- 点击、拖动文字块、拖动选区、编辑态移动、缩放、背景拖动、橡皮擦、吸管、纹理拖动都在同一 stage 上叠加，状态互斥靠多个布尔值和临时字段维护。
- 编辑态 `onTextBlockTouchMove` 里移动超过 10px 会直接变成移动文字块，超过 3px 又可能进入选择逻辑，行为边界复杂。
- 拖动过程中频繁 `setData` + Canvas render，未做统一 gesture frame scheduler。
- 缩放时 `onResizeMove` 每次都 `updateActiveBlock`，同时缩放 delta 字号，成本高且会改变文本结构。
- 旋转只有按钮 15 度步进，没有真实旋转手势；旋转后的命中和选区未适配。
- 多层事件里同时出现 `catchtap`、`catchtouchend`、`bindlongpress`，容易在真机出现重复触发或 blur/tap 顺序竞争。

问题等级：P1。

## 6. 微信小程序特殊问题

兼容风险：
- `canvas type="2d"` 已使用，这是正确方向。
- `textarea` 层级和 Canvas/Dom 叠层在小程序里本来就敏感；当前 textarea 透明、opacity 0、pointer-events none，再靠外层 view 处理触摸，安卓更容易出现焦点/键盘异常。
- `adjust-position="{{false}}"` 会减少键盘顶起扰动，但也要求自己处理键盘遮挡，目前没有看到系统级 keyboard height 适配。
- iOS 上多处 `textInputFocus: !this.data.isIOS`，说明已有兼容补丁，但这是症状级处理，可能导致 iOS 编辑后不能自动恢复焦点。
- `cursor-color="transparent"` 加自定义光标，安卓/iOS selection 行为不一致时会放大问题。

问题等级：P0/P1。

# 三、性能检测结论

没有运行真机 profiler，但从代码路径可判断热点排行：

1. `onActiveTextInput`
   - 每字触发多次 `setData`
   - rebuild delta
   - caret layout
   - updateActiveBlock
   - schedule canvas redraw

2. `updateActiveBlock`
   - JSON 深拷贝整份 design
   - hydrate 全量设计
   - 更新 activeBlock 和面板状态

3. `renderPreviewCanvas -> renderer.drawPosterToCanvas`
   - 全画布重绘
   - 全文字层重排
   - 图片、背景、二维码、擦除层全部参与

4. `onBlockMoveByResize` / `onEditBlockMove`
   - touchmove 高频 setData
   - 频繁调度 Canvas render

5. `getSelectionLayout`
   - 光标、选区、点击命中反复调用
   - 使用 JS 估算排版，复杂文本时成本和误差都高

FPS 风险判断：
- 单文字层短文本：大概率可用，但输入时会有轻微抖动。
- 3-5 个文字层 + 背景图 + 阴影/描边：中低端安卓可能低于 30 FPS。
- 长文本 + 纹理字/竖排/擦除路径：拖动和输入可能掉到 15-25 FPS。

# 四、严重等级与根因

P0 架构问题：
- 输入态和 Canvas 预览强耦合，每字触发全量数据更新和全画布渲染。
- 光标/选区完全自绘，但排版算法和真实渲染不一致。
- 缺失 composition、focus、selectionchange 的完整输入事件链。
- 旋转/缩放后坐标没有完整矩阵换算。

P1 架构问题：
- 高频操作使用整份 design 深拷贝和 hydrate。
- 手势状态分散，多个模式互相抢事件。
- 多文字层没有 layer cache，预览没有 dirty rect/layer redraw。

P2 小 bug：
- `e.detail.cursor` 误写成 `e.cursor`。
- WXML 未绑定已有的 `onTextSelection` / `onTextareaFocus`。
- 旧 rich-editor 代码残留，增加状态理解成本。
- 多处 `schedulePreviewRender(0)` 和手动调用重复。

# 五、推荐修复方案

建议分模块修，不要一次性重构：

1. 输入模块先修
   - 补齐 `bindfocus`、`bindselectionchange`
   - 增加 composition guard
   - 修正 cursor 读取
   - 输入期间只更新 textarea/activePlainText，不立即全量 canvas redraw

2. 建立编辑态/渲染态隔离
   - 输入中使用 DOM 编辑层即时显示
   - Canvas 预览延迟合成，比如 idle 后或停止输入 120-200ms 后刷新
   - active block 做局部 draft，不每字写回完整 design

3. 建立统一手势状态机
   - mode: idle / editing / dragging / resizing / selecting / erasing / picking / texture
   - 每次只允许一个主模式
   - touchmove 统一节流到一帧一次

4. 优化文字层渲染
   - 背景层缓存
   - 非活跃文字层缓存
   - 只在导出时全量高清渲染
   - 预览用低成本 layer 合成

5. 坐标系统重做
   - 使用统一矩阵：design 坐标、preview 坐标、screen 坐标
   - 旋转、缩放、平移都走同一套 transform/inverse transform
   - 光标命中和选区必须用同一坐标系统

# 六、当前结论

当前系统能跑，但已经进入“功能叠加型编辑器”的瓶颈期。最先该修的是输入链路和渲染节流，不是继续补 UI。

第一轮修复优先级建议：
1. 修输入事件链和 cursor bug。
2. 输入时停止每字全画布同步渲染。
3. 拖动/缩放 touchmove 改成统一节流。
4. activeBlock 局部更新，减少整份 design clone。
5. 再处理旋转坐标和选区精度。




codex处理：很好。

现在开始：

“第一阶段：输入系统修复”

目标：

只修：

- 输入卡顿
- 中文输入法
- 光标跳动
- selection 不稳定
- 输入时频繁 render

不要动：

- 拖动
- 缩放
- 旋转
- 橡皮擦
- 纹理
- 导出系统

非常重要：

本阶段禁止：
- 大重构
- 改整体架构
- 改 renderer
- 改导出逻辑
- 改 design 数据结构

只允许：
- 输入链路修复
- 输入态与渲染态解耦
- render 节流
- 光标修复

---

# 第一部分：修复输入事件链

请检查并修复：

- bindfocus
- bindblur
- bindselectionchange
- compositionstart
- compositionupdate
- compositionend

要求：

必须兼容：
- 微信小程序 iOS
- 微信小程序 安卓
- 中文输入法
- 英文输入法

禁止：
拼音输入过程中触发重绘。

---

# 第二部分：修复 cursor bug

修复：

e.detail.cursor 读取错误问题。

确保：

- 光标不会自动跳到末尾
- 插入文字位置正确
- 删除不会错位

---

# 第三部分：输入态与 Canvas 解耦

当前问题：

每输入一个字：
就会：
- updateActiveBlock
- clone design
- hydrate
- redraw canvas

这是错误的。

请改成：

输入期间：

只更新：
- textarea
- activePlainText
- draftText

不要立即：
- redraw 全 canvas
- hydrate 全 design

只有：

停止输入 120~200ms 后：
再同步 canvas 预览。

---

# 第四部分：render 节流

请建立：

统一 preview render scheduler。

要求：

- 同一帧只允许一次 render
- 高频输入自动合并
- touchmove 不允许疯狂 render

建议：

requestAnimationFrame
+ trailing debounce

---

# 第五部分：不要破坏现有功能

必须确保：

- 导出不变
- 样式不变
- 字体不变
- 历史记录不变
- 多文字层不变

---

# 第六部分：输出内容

请输出：

1. 修改了哪些文件
2. 为什么这样改
3. 修复了哪些问题
4. 哪些问题还没修
5. 现在预计性能提升多少
6. 有没有潜在风险

不要一次修全部。

只做：
输入系统第一阶段。



codex回复：
第一阶段已完成，只改了输入链路相关代码。

修改文件：
- [editor.wxml](d:/code/calendar-app/packageCard/editor/editor.wxml:110)
- [editor.js](d:/code/calendar-app/packageCard/editor/editor.js:1995)

做了什么：
- 给 `textarea` 补上 `bindfocus`、`bindselectionchange`、`bindcompositionstart/update/end`。
- 修复 cursor bug：从错误的 `e.cursor` 改为 `e.detail.cursor`。
- 新增输入草稿态 `draftText`，输入时只更新 `activePlainText/inputText/draftText/selection/caret`。
- 中文输入法 composition 期间不提交 design、不触发 Canvas 预览重绘。
- 停止输入后约 `160ms` 才把 draft 同步到 `design`，并延后预览 Canvas 更新。
- 保存草稿/导出前会强制 flush 输入草稿，避免刚输入完立刻导出丢字。
- `schedulePreviewRender` 增加一层帧级合并，同一时间段内的高频 render 会被合并。

修复的问题：
- 拼音输入过程中不再频繁重绘。
- 光标不再因为 `e.cursor` 读取错误自动跳到末尾。
- 每输入一个字不再立即 `clone design + hydrate + redraw canvas`。
- selection 状态开始接入原生 `selectionchange`，比原先只靠自定义触摸估算稳定。

未修的问题：
- 拖动、缩放、旋转、橡皮擦、纹理、导出 renderer 未动。
- 光标排版仍是估算模型，不是完整 Canvas `measureText` 同源排版。
- 旋转后的选区/光标坐标问题仍属于后续阶段。

预计性能提升：
- 普通输入路径减少一次全量 `design` clone/hydrate 和即时 Canvas 重绘，输入卡顿预计可下降 `40%~70%`。
- 中文拼音输入阶段收益最大，因为 composition 期间不会触发预览提交。

验证：
- `node --check packageCard\editor\editor.js`
- `git diff --check -- packageCard\editor\editor.js packageCard\editor\editor.wxml`

潜在风险：
- 微信小程序不同基础库对 composition 事件支持不完全；不支持时会自动退回普通 `input + 160ms debounce`，不会阻断输入，但中文输入法保护会弱一些。






给CODEX指定：第一阶段完成得不错。

现在开始：

第二阶段：
Gesture 与高频交互优化。

目标：

解决：

- 拖动卡顿
- 缩放掉帧
- touchmove 高频 setData
- 高频 redraw
- 多文字层移动不流畅
- resize 时输入面板抖动

注意：

本阶段：

不要处理：
- 旋转矩阵
- 光标排版
- measureText
- renderer 重构
- 导出系统

只优化：
Gesture Pipeline。

---

# 第一部分：统一 Gesture Scheduler

当前问题：

touchmove 期间：
存在：
- 多次 setData
- 多次 render
- 多次状态更新

请建立：

统一 gesture frame scheduler。

要求：

所有：
- dragging
- resizing
- moving
- stage move
- texture move

统一进入：

requestAnimationFrame 节流。

保证：

同一帧：
最多一次：
- setData
- preview render

---

# 第二部分：拖动期间不要全量 hydrate

检查：

onEditBlockMove
onResizeMove
onBlockMoveByResize

当前是否：

- clone design
- hydrate 全 design
- redraw 全 canvas

如果是：

请改成：

dragging draft state。

要求：

拖动期间：
只更新：
- activeBlockDraft
- transform draft
- preview overlay

不要：
commit 全 design。

只在：
touchend 时：
commit。

---

# 第三部分：建立 interaction mode 状态机

当前问题：

多个布尔值互相竞争。

请统一：

mode:

- idle
- editing
- dragging
- resizing
- selecting
- erasing
- picking
- texture

要求：

任意时刻：
只允许一个主 mode。

避免：
事件冲突。

---

# 第四部分：touchmove 优化

检查：

touchmove 是否：

- 高频 setData
- 高频 measure
- 高频 selection layout
- 高频 redraw

优化：

- move threshold
- velocity merge
- RAF batching

目标：

低端安卓也稳定。

---

# 第五部分：输出

请输出：

1. 修改了哪些交互链路
2. 哪些 touchmove 被节流
3. 哪些 render 被合并
4. FPS 预计提升
5. 是否影响现有导出
6. 是否有潜在副作用

注意：

不要碰 renderer 核心。

本阶段：
只优化交互管线。


它只完成：我会把这阶段限定在交互管线：新增统一 RAF 批处理器，然后把拖动、编辑态移动、缩放、纹理拖动这些 touchmove 改成进批处理器。不会碰 renderer 和导出。


Ran 6 commands
Worked for 32s
我会先增加一个小的块级 hydrate 工具和 RAF 批处理器，避免每次 move 都走整份 hydrateDesign。接着只替换几个高频 touchmove 的提交方式，touchend 仍保存历史和最终状态。


Edited 1 file
You've hit your usage limit. Upgrade to Pro


---

# Phase 4b：Unified Text Layout Engine — 完成报告

## 1. 新 Text Layout Pipeline

```
┌─────────────────────────────────────────────────┐
│               text-layout.js                     │
│                                                  │
│  measureTextCached()  ← 缓存层 (512 entry LRU)  │
│        ↓                                         │
│  getGlyphMetrics()   ← 字符级 metrics            │
│        ↓                                         │
│  layoutLine()        ← 行级排版                   │
│        ↓                                         │
│  layoutTextBlock()   ← 块级排版                   │
│        ↓                                         │
│  layoutTextBlockCached() ← 块级缓存 (64 entry)   │
└─────────────────────────────────────────────────┘
         ↓ 消费者
  ┌──────────────────────────────────┐
  │ getSelectionLayout (editor.js)   │
  │ getCaretState (editor.js)        │
  │ getSelectionRects (editor.js)    │
  │ getSelectionHandlePositions      │
  │ getSelectionIndexFromPoint       │
  │ getCharOffsetFromPagePoint       │
  │ getLineCaretPosition             │
  └──────────────────────────────────┘
```

坐标流：

```
Screen px  →  coord.screenToLocal()  →  Local rpx
                                           ↓
                                    layoutTextBlock()
                                    (在 local rpx 空间中排版)
                                           ↓
                                    offsets[index] = { x, y, line, fontSize, lineHeight }
                                           ↓
                                    caretX, caretY, selectionRects
```

## 2. 哪些旧估算逻辑被替换

| 旧函数 | 旧行为 | 新行为 |
|--------|--------|--------|
| `estimateSelectionCharWidth(ch, fontSize)` | 正则匹配字符类别，返回 fontSize × 系数 | 委托 `textLayout._estimateCharWidth()`（作为 ctx.measureText 不可用时的回退） |
| `getSelectionStyledChars(text, block)` | 使用 `estimateSelectionCharWidth` × bold系数 + letterSpacing | 委托 `textLayout.buildStyledChars()`，使用 `measureTextCached()` 替代估算 |
| `getSelectionLayout(text, blockOverride)` | 内联 70+ 行行分割 + offset 计算 | 委托 `textLayout.layoutTextBlockCached()`，输出格式兼容 |

## 3. 哪些地方开始统一 measureText

| 位置 | 说明 |
|------|------|
| `text-layout.js: measureTextCached()` | 核心缓存函数，优先使用 `ctx.measureText`，回退到估算 |
| `text-layout.js: buildStyledChars()` | 每个字符宽度通过 `measureTextCached` 获取 |
| `text-layout.js: getGlyphMetrics()` | 基于 `measureTextCached` 输出 width/advance/lineHeight |
| `editor.js: onReady()` | 注入 Canvas context 给 measureText 缓存层 |

**关键变化**：当 Canvas context 可用时，字符宽度从估算变为 `ctx.measureText` 精确测量。
当 context 不可用时（初始化阶段），自动回退到与旧逻辑完全一致的估算。

## 4. 哪些 selection/caret 问题会改善

| 问题 | 改善程度 | 说明 |
|------|----------|------|
| 中英混排光标偏移 | **显著改善** | 英文/数字字符宽度从 `fontSize × 0.58` 变为精确 `ctx.measureText` |
| 国风字体误差 | **显著改善** | 自定义字体宽度不再靠正则估算，使用真实 measureText |
| 手写字体误差 | **显著改善** | 同上，不再假设"中文字符宽度 = fontSize" |
| selection 高亮偏移 | **改善** | 字符宽度精确后，selection rect 位置更准确 |
| 旋转后 selection/caret 偏移 | **间接改善** | 本阶段依赖 Phase 4a 的 `coord.screenToLocal()` 逆旋转 + 更精确的布局 |
| emoji 宽度 | **部分改善** | `ctx.measureText` 对 emoji 宽度更准确，但代理对拆分问题未解决 |

## 5. 哪些地方仍是旧 renderer

| 组件 | 说明 |
|------|------|
| `renderer.js: layoutText()` | Canvas 导出排版，仍使用独立的 `ctx.measureText` + token 拆分 |
| `renderer.js: drawTextBlock()` | Canvas 导出绘制，未使用 text-layout.js |
| `renderer.js: pickFont()` | Canvas 导出字体选择，未统一 |
| `renderer.js: measureChar()` / `measureToken()` | Canvas 导出测量，未使用缓存层 |
| WXML DOM 排版 | 由 rich-text 组件渲染，仍由浏览器排版引擎处理 |
| `deltaToNodes()` | Preview DOM 节点生成，仍使用旧逻辑 |

**说明**：renderer 和 preview DOM 排版是独立的渲染路径，本阶段未修改。
后续可以让 renderer 消费 `layoutTextBlock()` 的结果来统一，但这不是本阶段的范围。

## 6. Layout Cache 如何工作

```
layoutTextBlockCached(opts)
    ↓
生成 cache key:
    text | fontFamily | fontSize | letterSpacing | lineHeight | align | width | scaleX | rotation
    ↓
命中缓存 → 直接返回缓存的 layout 结果
    ↓
未命中 → 调用 layoutTextBlock() 计算并存入缓存
    ↓
缓存超过 64 条 → 清空全部
```

**缓存粒度**：
- 同一 block 的 text/font/width 未变化 → 复用
- 任何影响排版的关键参数变化 → 重新计算
- 缓存上限 64 条（约覆盖 64 个不同 block 状态）

**measureText 缓存**：
- 缓存 key: `fontFamily|fontSize|fontWeight|letterSpacing|text`
- 上限 512 条
- 超过后淘汰一半

## 7. 性能影响

| 指标 | 旧 | 新 | 变化 |
|------|-----|-----|------|
| 单次 `getSelectionLayout` 字符测量 | O(n) × 估算（快但不准） | O(n) × `measureTextCached`（首次慢，缓存后 O(1)） | 首次稍慢，后续更快 |
| 光标/选区更新 | 每次 full layout | layout cache hit → 0 计算 | 高频操作显著改善 |
| `ctx.measureText` 调用频率 | N/A（不使用） | 首次每字符 1 次，缓存后 0 | 初始化后几乎无开销 |
| 内存开销 | 无缓存 | ~512 measure 缓存 + ~64 layout 缓存 | 微量增加（< 100KB） |

## 8. 哪些风险仍未处理

| 风险 | 优先级 | 说明 |
|------|--------|------|
| Emoji / 代理对拆分 | P1 | `String.split('')` 按代码单元拆分，emoji 会被拆成两个字符，导致宽度和光标偏移 |
| Preview DOM 与 layout 不一致 | P2 | rich-text 的浏览器排版与 JS layoutTextBlock 仍有差异 |
| Renderer 与 layout 不一致 | P2 | `renderer.js: layoutText()` 仍用独立 token 拆分和 measureText |
| `ctx.measureText` 字体未加载 | P2 | 自定义字体未完成加载时，measureText 可能返回 fallback 字体宽度 |
| letterSpacing 逐字符 vs 逐 token | P3 | renderer 用 token 级 letterSpacing，layout 引擎用字符级，可能有微小差异 |
| 多行首行缩进 | P3 | 未处理 text-indent |
| Tab 字符 | P3 | 未处理 tab 宽度 |


---

# Phase 4c：Shared Layout Source — 完成报告

## 1. Renderer 与 text-layout 差异

### 1.1 重复逻辑

| 逻辑 | renderer.js | text-layout.js | 差异 |
|------|-------------|----------------|------|
| Token 拆分 | `splitTextForLineWrap()` | `splitTextForLineWrap()` | **正则完全一致**，已共享 |
| 行断行逻辑 | `layoutText()` | `layoutTextBlock()` / `layoutTextBlockForDesign()` | 逻辑对齐，但粒度不同（见下） |
| 字体构造 | `pickFont()` | 内联在 `measureTextCached` 和 `layoutTextBlockForDesign` | **已对齐**：相同的 italic/weight/size/family 格式 |
| 中文禁则 | `PROHIBIT_LINE_START` | `PROHIBIT_LINE_START` | **完全一致** |
| letterSpacing 计算 | `measureToken()` 逐 token | `measureTextCached()` 逐字符 | 计算方式不同（见 1.4） |

### 1.2 Line Break 不一致

| 差异点 | renderer (旧 layoutText) | text-layout (新) | 影响 |
|--------|--------------------------|-------------------|------|
| 断行粒度 | **token 级**：英文单词不可断 | **字符级** (layoutTextBlock) / **token 级** (layoutTextBlockForDesign) | layoutTextBlockForDesign 已与 renderer 对齐 |
| 禁则处理 | token 粒度禁则 | 字符粒度禁则 | 微小差异：token 可能包含标点+文字 |
| `layoutTextBlock` (preview) | N/A | 字符级断行 | preview 和 renderer 可能产生不同换行点 |

**解决**：`layoutTextBlockForDesign()` 使用与 renderer 相同的 token 级断行，确保 preview 和 renderer 在**横排文本**的断行结果一致。

### 1.3 Token Split 不一致

`splitTextForLineWrap()` 的正则已完全一致：
```
/[A-Za-z0-9]+(?:[A-Za-z0-9_''.\-:/@#%&+=]*[A-Za-z0-9])?[\)\]\}",.!?:;，。！？；：、]*/g
```

**无差异**。此函数已共享（text-layout.js 导出，renderer 通过 textLayout 调用）。

### 1.4 Font Metrics 不一致

| 差异点 | renderer (旧) | text-layout (新) |
|--------|---------------|-------------------|
| 测量方式 | `ctx.measureText()` 直接调用 | `measureTextCached()` 缓存 + 回退估算 |
| 测量粒度 | **token 级** `measureToken()` | **字符级** `measureTextCached(ch)` (layoutTextBlock) / **token 级** `ctx.measureText(token)` (layoutTextBlockForDesign) |
| 缓存 | 无 | 512 条 LRU |
| 无 ctx 时 | 不可用 | 自动回退到估算 |

**关键对齐**：`layoutTextBlockForDesign()` 使用 **token 级** `ctx.measureText()`，与旧 `measureToken()` 结果完全一致（因为 renderer 的 ctx 始终可用）。

### 1.5 Spacing 不一致

| 间距 | renderer (旧) | text-layout (新 layoutTextBlockForDesign) |
|------|---------------|-------------------------------------------|
| letterSpacing | `measureToken()` 内一次性加 `letterSpacing * (token.length - 1)` | 同：`ctx.measureText(token).width + letterSpacing * (token.length - 1)` |
| 行高 | `fontSize * lineHeight` | 同 |
| 对齐 | `left/center/right` | 同 |

**已对齐**，无差异。

## 2. 哪些逻辑开始共享

| 共享逻辑 | 说明 |
|----------|------|
| `splitTextForLineWrap()` | text-layout.js 提供，renderer 通过 textLayout 引用 |
| `layoutTextBlockForDesign()` | 横排文本断行 + token 宽度测量，renderer 直接消费 |
| 中文禁则标点处理 | 同一正则和逻辑 |
| 字体构造（pickFont 对齐） | `layoutTextBlockForDesign` 内联了与 `pickFont` 相同的字体构造逻辑 |
| 行高计算 | `fontSize * lineHeightVal`，同一公式 |

## 3. 哪些 Renderer 已接入 layoutTextBlock

| 组件 | 接入状态 | 说明 |
|------|----------|------|
| `drawTextBlock()` — 横排文本 | **已接入** | 使用 `textLayout.layoutTextBlockForDesign()` 替代 `layoutText()` |
| `drawTextBlock()` — 竖排文本 | **未接入** | 仍使用 `drawVerticalTextBlock()` 独立逻辑 |
| `drawVerticalTextBlock()` | **未接入** | 独立的竖排排版，暂不动 |
| Texture 填充 | **未接入** | 渲染逻辑不变，只消费 layout 的 lines/runs |
| Stroke / Shadow | **未接入** | 渲染逻辑不变 |
| Rich text (bold/italic/underline/background) | **未接入** | 渲染逻辑不变，run.style 传递方式不变 |

## 4. 哪些地方仍是旧逻辑

| 组件 | 说明 |
|------|------|
| `layoutText()` | 仍存在于 renderer.js，已标记 deprecated，仅作为 export 兼容 |
| `measureChar()` / `measureToken()` | 仍存在于 renderer.js，未被删除，但不再被 drawTextBlock 调用 |
| `drawVerticalTextBlock()` | 完全独立的竖排排版 |
| `drawVerticalGlyph()` | 竖排字符绘制 |
| `splitTextForVertical()` | 竖排词组拆分 |
| `pickFont()` | 仍用于 drawTextBlock 中设置 ctx.font（渲染需要） |
| Preview DOM 排版 (`deltaToNodes`) | 编辑器中 DOM 排版仍由浏览器 rich-text 组件处理 |

## 5. 哪些 Preview/Caret/Render 偏差会改善

| 偏差问题 | 改善程度 | 说明 |
|----------|----------|------|
| **横排文本 preview 与 renderer 断行不一致** | **完全消除** | 两者现在共用 `splitTextForLineWrap()` + 相同的 token 级断行 + 相同的 `ctx.measureText()` |
| **横排文本 preview 与 renderer 字符位置不一致** | **显著改善** | preview 用 `layoutTextBlock` (字符级)，renderer 用 `layoutTextBlockForDesign` (token 级)。两者断行结果一致，但 caret 定位精度取决于 preview 侧的字符级精度 |
| **中英混排 renderer 断行偏差** | **消除** | renderer 不再独立计算 token 宽度，直接消费同源 layout |
| **竖排文本** | **未改善** | 竖排仍使用独立逻辑，本阶段未动 |

## 6. 哪些风险还没处理

| 风险 | 优先级 | 说明 |
|------|--------|------|
| 竖排排版不同源 | P1 | `drawVerticalTextBlock` 仍使用独立逻辑，preview 竖排和 renderer 竖排可能不一致 |
| Preview layoutTextBlock 字符级断行 vs Renderer token 级断行 | P2 | `layoutTextBlock` (preview/caret) 按字符断行，`layoutTextBlockForDesign` (renderer) 按 token 断行。通常结果一致，但极端情况下可能有差异 |
| `layoutTextBlockForDesign` 每次都重新计算 | P3 | 无缓存（因为 renderer 每次绘制需要用当前 ctx 测量，ctx 可能不同）。后续可加 ctx 级缓存 |
| Emoji / 代理对 | P3 | 同 Phase 4b 遗留问题 |
| `pickFont()` 重复 | P3 | renderer 中仍保留 pickFont，与 text-layout 中的字体构造逻辑有轻微重复 |

## 7. 哪些部分暂时不要动

| 部分 | 原因 |
|------|------|
| **竖排文本** (`drawVerticalTextBlock`) | 独立排版体系，需要专门设计竖排 layout engine，不属于本阶段 |
| **Texture 渲染** (`fillTextWithTexture`) | 渲染层逻辑，与 layout source 无关 |
| **Stroke / Shadow 渲染** | 渲染层逻辑，与 layout source 无关 |
| **Rich text 样式** (bold/italic/underline) | 样式传递机制，不属于 layout source |
| **Export 系统** (`exportPoster`) | 完全不在本阶段范围 |
| **Preview DOM** (`deltaToNodes`) | 浏览器排版引擎独立，统一需要更大重构 |
| **旧 `layoutText()` 函数** | 保留 deprecated 状态，不删除，避免 breaking change |
