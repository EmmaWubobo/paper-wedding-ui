# Changelog / 更新记录

## 1.1.0

**二级页面与总览 / Secondary pages and overview**
- 默认模板由 4 页扩展为 4 个主页面 + 15 个二级页面：开屏、登录、暗号验证、场地、住宿、集合地点、抵达指南、城市推荐、我的接送、赴约回执、到达登记、分享照片、分享成功、新人合照、互动游戏。
- 新增模块 `splash`、`gate`、`panel`、`actions`、`empty`、`heart`、`art`、`back`；表单字段支持 `select`、`half`，相册支持照片操作按钮与可点击的筛选条。
- 页面新增 `parent`（保持底部标签高亮）、`group`（总览分组）、`nav`（隐藏底部导航）；`links`、`cards`、`actions`、`button`、`status`、`form`、`gallery.filters` 支持 `page` 跳转，HTML 页面之间可点击。
- 渲染时自动生成 `overview.jpg`：主页面一行、二级页面按分组排列，并标出每个页面的入口来源。
- 新增英文版 `examples/template.en.json` 的完整二级页面。

**新增 / Added**
- `locale`（`zh` / `en`）和 `strings`：所有内置默认文案可切换语言或逐句覆盖；新增 `examples/template.en.json` 和 `README.en.md`。
- 导航项可写 `icon`；`label` 省略时使用页面标题。
- 渲染器自动寻找可用浏览器（Playwright Chromium → Chrome → Edge → 全局Playwright），新增 `--browser-path`、`--locale`、环境变量 `CHROMIUM_PATH`。
- 渲染时自动缩小超大照片；拼写错误的照片键会给出 `⚠` 提示。
- 英文版规格文档 `design-spec.md`。

**变更 / Changed**
- 校验错误信息改为中英双语，并指出具体位置（如 `pages[0](home).modules[1].lines`）。
- 输出先写入临时目录，成功后才复制到目标目录，失败不再留下半成品。
- 默认编号卡标签由“专属抽奖编号”改为“专属编号”。
- Playwright 固定为 1.62.1，并提交 `package-lock.json`。
- README 预览图改为JPG（体积约为原来的四分之一），并新增不含人物照片的占位版预览。

**修复 / Fixed**
- 请柬横图、相册、相框里的占位框文字不再贴在框顶部。
- 英文等非中文内容的输出里仍出现中文默认文案的问题（见 `locale`）。
