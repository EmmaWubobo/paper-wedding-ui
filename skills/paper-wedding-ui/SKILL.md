---
name: paper-wedding-ui
description: Generate paper-style (warm beige + burgundy, thin serif, handwritten script) wedding mini-program UI blueprints — HD long-image PNGs, viewable HTML and a design spec — with customizable names, pages, navigation and modules, in Chinese or English. For wedding invitation / RSVP / album / guest-corner interface proposals and prototypes; no backend or real data. 生成纸感复古风婚礼小程序高清UI长图、HTML预览和设计规格，支持自定义姓名、资料、导航与功能模块，支持中英文；适用于婚礼界面设计与视觉提案，不承担后台部署或真实数据操作。
---

# Paper Wedding UI

将用户的婚礼需求转为可交付的界面图纸。风格是暖米色纸张、酒红强调色、细衬线中文、手写英文、留白与摄影叙事。交付实际文件，不能只写设计建议。

## 内容与范围

- 从用户消息提取姓名、日期、地点、文案、照片、功能和导航。已有资料不重复询问；未给的信息使用模板里的占位词（中文“姓名（男）”“日期”“婚宴地址”，英文 “Name (Partner 1)”“Wedding date”“Venue address”），不编造真实身份、日期或地址。
- **语言**：用户用什么语言交流，就设置什么 `locale`（`zh` 或 `en`），并以对应的 `examples/template.json` 或 `examples/template.en.json` 为起点。想统一改某句内置文案，用顶层 `strings`（键表见配置说明），不要逐个模块重复填写。其他语言：`locale` 选 `en` 作底，再用 `strings` 和模块字段写入该语言文案。
- 默认模板是 4 个主页面（请柬、赴约、相册、我的）加 15 个二级页面（开屏、登录、暗号验证、场地、住宿、集合地点、抵达指南、城市推荐、我的接送、回执、到达登记、分享照片、分享成功、新人合照、互动游戏）。导航可增删、重命名、排序；导航项可写 `icon`（1–2个字符），重排或改名后记得给图标换成对应含义。每个 `↗` 入口和按钮都应能打开一个页面：用 `page` 指向目标页面的 `id`，二级页面用 `parent` 保持底部标签高亮、用 `group` 在总览图里分组、用 `nav:false` 去掉底部导航。用户只要求部分功能时，删掉不需要的页面，并同时删掉指向它们的 `page`。只生成用户要求的模块，不冒充已经实现的小程序功能。
- 区分 UI 示例状态和业务实现。相册、署名、编号、表单、分享均是设计示例，图纸不接 API、不读取真实宾客数据、不部署云服务。
- `assets/preview` 是原作者允许保留的预览照片，人物面部和可辨认的招牌已做强模糊处理，但服饰、体态与场景仍可见，所以不是完全匿名素材，也不在代码MIT许可中。默认用占位图。只有用户要求“使用随附预览照片”时采用 `examples/preview.json`（中文）或 `examples/preview.en.json`（英文），新婚礼作品使用用户自己的素材。不要据照片推断姓名或身份。

## 制作路径

1. 读取 [设计语言](references/design-language.md) 和 [配置说明](references/configuration.md)。以示例模板为基础，在用户输出目录另存配置，不修改技能里的原始示例。
2. 写入实际需求，选择模块、内容与素材。照片放进配置的 `photos`（相对路径以配置文件所在目录为基准），取景位置写入模块的 `position`；两张相框通过 `frame` 模块的 `orientation` 生成。没有提供的内容保留占位词。
3. 在技能目录渲染（首次需要 `npm install`，已有 `node_modules` 则跳过）：
   ```
   npm install
   node scripts/render.cjs --config /absolute/path/project.json --out /absolute/path/output
   ```
   渲染器会自己依次尝试：Playwright 自带 Chromium → 本机 Chrome → 本机 Edge → 全局安装的 Playwright。通常不需要手动处理。只有它报“无法启动浏览器”时才按提示选一种：`npx playwright install chromium`（需要网络）、`--browser chrome|msedge`、或 `--browser-path <可执行文件>`（也可设环境变量 `CHROMIUM_PATH`）。无法联网下载浏览器的沙箱里，直接用已预装的浏览器，不要修改渲染脚本。不把当前机器路径写入技能或用户交付。
4. 渲染输出默认390 CSS像素、3倍采样，即1170像素宽PNG。用户需要更高清可调 `scale`，不要事后放大小图。超大照片会自动缩放到输出所需宽度。HTML 用于查看和继续修改，规格文档记录模块与内容（`locale=zh` 为 `设计规格.md`，`en` 为 `design-spec.md`），`manifest.json` 记录尺寸。
5. 读命令输出里以 `⚠` 开头的提示（照片键拼写错误、照片定义了却没使用等）并修正。渲染报错时，错误信息会指出是哪个页面、哪个模块、哪个字段，按提示改配置后重试；不把未生成的图称为已交付。
6. 打开每张图检查，并先看 `overview.jpg`（全部页面的总览，二级页面下方标注了入口来源），确认每个入口都有对应页面：文字没有截断，长名字和地址自然换行，照片主体不被裁掉，按钮和底部导航完整。
7. 交付 PNG、HTML 和规格文件。在能展示输出文件的环境里（例如把文件放进输出目录并展示），先展示 `overview.jpg`，再展示各页 PNG。说明这是UI预览，不是真机截图或已上线小程序。

## 定制边界

模板支持的模块见配置说明。新功能可用 `cards` 或 `form` 表达，或在输出副本扩展渲染器；保留统一色彩、间距、文字层级。避免把原请柬的绝对坐标机械套用于更长的新内容。

所有文字使用真实文本排版，不用图片生成器绘制中文界面。未配置API、AppID、环境ID、访问密钥或原婚礼资料；不要添加这些内容来“让预览能运行”。公开演示保持占位文本，用户的私人设计只放其自己的输出目录。
