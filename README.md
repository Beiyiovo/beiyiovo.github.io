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
- 改 css/js 后请同步把各页 `?v=N` 加一（当前 v=21）。
- 页面共 9 个：`index / lab / shorts / about`、4 个项目页、`404`。
- 短片页 `shorts.html`：自建弹层播放器，点击才注入 `src`、退出即卸载；卡片用 `data-src` / `data-dur` / `data-ratio`（竖屏写 `720/1140` 之类实际比例），加片复制一张 `article.vcard` 即可。
- 短片页结构：Hero 主推位放 EP.01（92 秒完整 AI 结对开发录屏）→ `01 片单` 三支分别介绍 → `02 制作全流程` 六步（`.steps`）→ `03 边界` 四条原则（`.rule-grid`）。封面统一为 16:9 / 16:10 合成图，制作方式见 `03_过程记录/短片素材/`。
- 项目卡封面：`photo` 类整幅铺图（配 `plate-cap on-photo` 角标）；`frame` 类为浏览器框网页截图；`plate` 类承托白底图纸。

> 本仓库即网站源码；所有页面数据均来自真实项目记录，可溯源。
