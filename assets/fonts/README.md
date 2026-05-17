Font binaries placed here must have clear redistribution rights for commercial
use in both WeChat mini programs and Web builds.

Use WOFF2 subsets first. Avoid full CJK font files in the mini program main
package; prefer CDN or a subpackage for large fonts.

Current runtime registry uses remote font URLs so the mobile editor is usable
without bundling binaries. For production WeChat builds, add these domains to
the mini program download/request allowlist as needed:

- `cdn.jsdelivr.net`
- `static.cdn.sunmi.com`
- `fontsapi.zeoseven.com`

## Active registry fonts

- `source-han-sans-sc.woff2`
  - Runtime family: `CardSourceHanSansSC`
  - Runtime source: Fontsource CDN, Noto Sans SC compatible with Source Han Sans
  - Category: body
  - License status: open-commercial

- `source-han-serif-sc.woff2`
  - Runtime family: `CardSourceHanSerifSCManaged`
  - Runtime source: Fontsource CDN, Noto Serif SC compatible with Source Han Serif
  - Category: zen
  - License status: open-commercial

- `alibaba-puhuiti-regular.ttf`
  - Runtime family: `CardAlibabaPuHuiTi`
  - Runtime source: remote Regular TTF
  - Category: body
  - License status: open-commercial

- `line-seed-tw.woff2`
  - Runtime family: `CardLINESeedTW`
  - Runtime source: ZeoSeven CSS, resolved to WOFF2 at load time
  - Category: body
  - License status: open-commercial

- `lxgw-wenkai.woff2`
  - Runtime family: `CardLXGWWenKai`
  - Runtime source: jsDelivr GitHub TTF
  - Category: zen
  - License status: open-commercial

- `zhi-mang-xing.woff2`
  - Runtime family: `CardFeibaiCaoshu`
  - UI name: 飞白草书
  - Source font: Zhi Mang Xing
  - Runtime source: Fontsource CDN
  - Category: zen
  - License status: open-commercial

- `long-cang.woff2`
  - Runtime family: `CardLangyaGuji`
  - UI name: 琅琊古籍
  - Source font: Long Cang
  - Runtime source: Fontsource CDN
  - Category: zen
  - License status: open-commercial

## System Latin fonts

These are registry entries only and do not need bundled font files:

- Verdana
- Trebuchet MS
- Courier New
- Times New Roman

## Not accepted without confirmed authorization

Do not add binaries or runtime registry entries for these until license and
distribution provenance are confirmed:

- MaoKen ZhuYuan
- Canger Shuyuan
- Yanshi Youran Xiaokai
- 平方赖江湖飞扬体
- 平方赖江湖琅琊体
