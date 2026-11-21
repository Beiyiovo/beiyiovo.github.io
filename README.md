# Beiyiovo · 个人作品集 / Portfolio

嵌入式 / IoT 全栈作品集网站（纯静态，零构建）。

- 中文 / English 双语切换（右上角）
- 访问线上版：https://beiyiovo.github.io/
- 本地预览：`python -m http.server 8787`

## 结构与约定

- 设计系统集中在 `assets/css/main.css` 顶部变量：`--bg / --ink / --acc / --grad / --radius`。
- 字体自托管：`assets/fonts/`（Noto Sans SC 可变字重 + Cascadia Code，均为 OFL，已子集化，约 245 KB）。
  新增文案若含生僻字，需重新子集化，见 `assets/fonts/LICENSE.txt`。
- 首页动效：`assets/js/visuals.js`（Hero 仪表 PPG 波形 + 「轨迹」星轨 Canvas）；实验室互动：`assets/js/lab.js`。
- 双语机制未变：所有可见文案 `data-i18n` + `data-en` 成对；JS 新增 `window.__onLangChange` 钩子供动态区块重渲染。
- `?static=1` 会关闭全部过渡与动画，用于截图比对；`prefers-reduced-motion` 同样降级。
- 改 css/js 后请同步把各页 `?v=N` 加一（当前 v=25）。
- 页面共 9 个：`index / lab / shorts / about`、4 个项目页、`404`。
- 短片页 `shorts.html`：自建弹层播放器，点击才注入 `src`、退出即卸载；卡片用 `data-src` / `data-dur` / `data-ratio`（竖屏写 `720/1140` 之类实际比例），加片复制一张 `article.vcard` 即可。
- 短片页结构：Hero 主推位放 EP.01（92 秒完整 AI 结对开发录屏）→ `01 片单` 三支分别介绍 → `02 制作全流程` 六步（`.steps`）→ `03 边界` 四条原则（`.rule-grid`）。封面统一为 16:9 / 16:10 合成图，制作方式见 `03_过程记录/短片素材/`。
- 项目卡封面：`photo` 类整幅铺图（配 `plate-cap on-photo` 角标）；`frame` 类为浏览器框网页截图；`plate` 类承托白底图纸。

## 访问统计（当前未启用）

- `assets/js/analytics.js` 已全站接入（9 个页面），**默认三个接收端全空 = 完全静默**：零外部请求、零 DOM 注入、页面无任何可见变化、访客无需填写任何信息。
- 采集内容（仅在启用接收端后才有意义）：页面浏览、停留时长、滚动深度、点击热区、视频观看进度、邮箱复制、语言切换；只用随机匿名 ID（localStorage）区分独立访客，不含任何身份信息。
- **启用方法**（按需选其一，填入即生效，无需改其他代码）：
  - 百度统计：把 `analytics.js` 顶部 CONFIG 的 `baiduId` 填上站点 ID（hm.js? 后面那串）。
  - Google Analytics 4：填 `gaId`（`G-XXXXXXXXXX`）。
  - 自建上报：填 `endpoint`（一个能收 `application/json` 的地址，用 `sendBeacon` 发）。
  - 也可在页面 `<head>` 里、加载 analytics.js **之前**写 `window.SITE_TRACK = { baiduId: '...' };` 覆盖配置。
- 调试：URL 加 `?track-debug=1`，事件打印到控制台并写入 `window.__trackLog`；`?static=1` 下不采集。
- 纯静态站无后端，不启用接收端就看不到数据（GitHub Pages 只提供仓库 Traffic 的聚合数字，不含访客行为）。

> 本仓库即网站源码；所有页面数据均来自真实项目记录，可溯源。
