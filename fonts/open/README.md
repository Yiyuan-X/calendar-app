Open font assets for the Zen card editor.

New font binaries should go to `/assets/fonts/` and be registered in
`packageCard/common/fontRegistry.js` only after their commercial distribution
rights are clear. Do not add unverified fonts to the runtime registry or UI.

Only place fonts here when their license clearly permits commercial use and
distribution in a WeChat mini program. Keep the exact filenames below because
`packageCard/editor/editor.js` loads these paths through `wx.loadFontFace`.

## Required files

- `lxgw-wenkai.ttf`
  - UI label: 禅意
  - Source font: LXGW WenKai
  - Use: 修心、日签、正文

- `maoken-tangyuan.ttf`
  - UI label: 温柔
  - Source font: 猫啃网糖圆体
  - Use: 治愈、童真、温柔文案

- `huiwen-mincho.ttf`
  - UI label: 经书
  - Source font: 汇文明朝体
  - Use: 佛经、古籍、节气

- `source-han-serif-sc.ttf`
  - UI label: 高级
  - Source font: Source Han Serif SC
  - Use: 长文、高级正文、东方排版

- `lxgw-neo-xihei.ttf`
  - UI label: 极简
  - Source font: LXGW Neo XiHei
  - Use: 现代禅意、极简卡片

- `jiangxi-zhuokai.ttf`
  - UI label: 文人
  - Source font: 江西拙楷
  - Use: 金句、碑帖感、文人风

- `yanshi-qiuhongkai.ttf`
  - UI label: 诗意
  - Source font: 演示秋鸿楷
  - Use: 手写卡片、温柔金句

- `yanshi-chunfengkai.ttf`
  - UI label: 春风
  - Source font: 演示春风楷
  - Use: 女性向、祝福、柔和标题

- `lxgw-wenkai-gb.ttf`
  - UI label: 空灵
  - Source font: 霞鹜文楷 GB
  - Use: 留白、山水、空境

- `smiley-sans.ttf`
  - UI label: 现代
  - Source font: Smiley Sans
  - Use: UI、按钮、导航、Banner

- `youzai.ttf`
  - UI label: 佛系
  - Source font: 悠哉字体
  - Use: 佛系语录、轻修心内容

- `yanshi-xiaxingkai.ttf`
  - UI label: 国风
  - Source font: 演示夏行楷
  - Use: 海报、签名、标题

- `klee-one.ttf`
  - UI label: 清楷
  - Source font: Klee One
  - Use: 短句、便签、修心旁注

- `zen-maru-gothic.ttf`
  - UI label: 圆融
  - Source font: Zen Maru Gothic
  - Use: 温柔标题、祝福卡片

- `iming.ttf`
  - UI label: 书卷
  - Source font: I.Ming
  - Use: 古籍、经文、注疏

- `kaisei-tokumin.ttf`
  - UI label: 寺院
  - Source font: Kaisei Tokumin
  - Use: 节气标题、仪式感正文

- `glow-sans.ttf`
  - UI label: 素净
  - Source font: Glow Sans
  - Use: 现代说明、轻量信息

- `cwtex-q-kai.ttf`
  - UI label: 古楷
  - Source font: cwTeX Q Kai
  - Use: 碑帖感短文、传统题跋

- `noto-serif-sc.ttf`
  - UI label: 端雅
  - Source font: Noto Serif SC
  - Use: 通用长文、节气说明

- `noto-sans-sc.ttf`
  - UI label: 明净
  - Source font: Noto Sans SC
  - Use: 信息层级、说明文字

Ma Shan Zheng is loaded from Fontsource CDN and is not required here.

## Package-size rule

Use subsetted TTF/WOFF2 files whenever possible. For poster generation, a
common subset can include punctuation, digits, and the app's common copy. Avoid
shipping every full CJK font in the main package; move large files to a CDN or
subpackage when the mini program package limit becomes tight.
