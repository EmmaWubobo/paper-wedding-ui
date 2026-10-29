# 配置与素材约定 / Configuration

配置是JSON。以 `examples/template.json`（中文）或 `examples/template.en.json`（英文）为起点。所有字符串按普通文字转义，不能写HTML。未填写字段保持占位词。

Config is plain JSON. Start from `examples/template.json` (Chinese) or `examples/template.en.json` (English). All strings are escaped as plain text; HTML is not supported. Unfilled fields keep their placeholder wording.

## 顶层字段

| 字段 | 含义 |
|---|---|
| project | 项目标题 |
| locale | `zh`（默认）或 `en`。决定所有内置默认文案、占位词、`lang`属性和规格文档语言；`en`同时改用拉丁衬线字体 |
| strings | 覆盖内置默认文案，键见下表，例如 `{"timeline.title":"Schedule"}`。未知键会报错 |
| width / scale | CSS宽度320–600，导出倍率1–4；默认390 / 3 |
| people.male / people.female | 两位称呼；默认见`default.male`/`default.female` |
| people.english | 英文称呼；默认Name & Name |
| date / address / contact | 日期、婚宴地址、联系方式；不会自动生成实际值 |
| theme | paper/card/accent/ink/muted/line，值为六位十六进制颜色 |
| previewPhotos | 是否明确使用随附照片；默认false |
| photos | key → 图片路径，相对**配置文件所在目录**或绝对本地路径 |
| navigation | `id`、`label`、可选`icon`组成的数组，最多5项；`id`必须对应某个页面。`label`省略时使用页面标题；`icon`为1–2个字符，省略时按位置使用 ✉ ⌂ ▧ ♧ ◇ |
| pages | 页面数组，每项有 `id`（小写英文/数字/连字符）、`title`、`modules`，以及可选字段：`parent`（二级页面打开时高亮哪个底部标签，值是另一个页面的id）、`group`（总览图里的分组名）、`nav`（设为`false`则不显示底部导航，用于开屏页和登录页）。不在 `navigation` 里的页面就是二级页面 |

`photos`不接受远程URL，不会访问任何云端。`demo:portrait`、`demo:detail`、`demo:wide`、`demo:album`、`demo:opening`仅在previewPhotos=true时可用。没有配置照片时显示带名称的占位框；路径写错会明确报错并指出是哪张照片。

模块文字可以写 `{{date}}`、`{{address}}`、`{{contact}}`、`{{male}}`、`{{female}}`、`{{english}}`，自动读取顶层资料。普通字段直接填写文案也可以。

## 模块类型

每个模块都有type，可重复、重排或删除。支持以下字段：

| type | 字段 | 用途 |
|---|---|---|
| hero | eyebrow、title、subtitle | 请柬邀请标题，自动展示新人姓名 |
| story | lines字符串数组、motto、photo、position | 故事、手写短句、竖图 |
| date | title、photo、position、note | 日期和错位小照片 |
| photo | photo、ratio、position、caption | 大图，ratio数值如1.5；position如50% 40% |
| intro | eyebrow、title、subtitle | 通用页标题 |
| timeline | title、items[{time,title,note}] | 婚礼流程 |
| links | items[{title,note}] | 住宿、交通、场地等入口 |
| note | text | 提醒 |
| button | text、secondary | 主要/次要操作示意 |
| status | title、value | 已填写/未填写等状态 |
| gallery | filters、active、title、items[{photo,ratio,signature,caption,action}] | 分类和双列相册；ratio为宽/高，默认1；`filters`的元素可以是文字或`{label,page}`（点击跳转），设为`[]`则不显示筛选条；`title`设为`""`则不显示标题；`action`在照片下方加一个小按钮（如“保存原图”）；`items`为空数组时展示空状态 |
| ticket | label、number | 编号卡；号码是示例，不做分配 |
| signature | title、hint、value、button | 署名编辑示意 |
| cards | items[{title,text}] | 任意功能说明卡 |
| form | title、fields[{label,value,placeholder,multiline,select,half}]、button、noButton、page | 回执、到达登记等表单图纸。`select:true`显示下拉箭头；连续两个`half:true`的字段并排成一行（如日期与时间）；`title`设为`""`则不显示标题；`noButton:true`去掉提交按钮；`page`让提交按钮跳到另一页 |
| frame | orientation、photo、signature、caption | 横/竖通用拍立得效果，orientation为portrait或landscape |
| back | label、page | 二级页面顶部的返回条；省略`page`时返回`parent`页面 |
| splash | photo、position、names（数组）、date、skip | 开屏：满屏照片、两行姓名、日期、跳过键和进度条。配合页面`nav:false` |
| gate | stage（`login`或`answer`）、eyebrow、title、copy、question、placeholder、button、hint、note、link | 登录/暗号验证页；`title`和`copy`里的`\n`表示换行。配合页面`nav:false` |
| panel | title、text、actions（按钮文字数组） | 详情页卡片：标题、多行说明（`\n`换行）、若干操作按钮（地图、复制地址、拨打电话等） |
| actions | inline、items[{label,primary,page}] | 一排或一列按钮；`inline:true`为并排。默认是次要按钮，`primary:true`为主要按钮 |
| empty | title、text | 空状态 |
| heart | message、score | 互动游戏的心形大按钮与分数 |
| art | label、ornament | 没有照片时的详情页头图（浅色底 + 符号 + 小标签） |

photo字段引用photos中的key，不直接传路径。表单中的示例数据不是提交记录。网页按钮是视觉原型，不会上传、支付、登录或发送信息。

## 页面之间的跳转（`page`）

下面这些位置都可以写 `page`，值是另一个页面的 `id`：

- `links`、`cards`、`actions` 的 `items[]`
- `button`、`status`、`back`、`form`（提交按钮）
- `gallery` 的 `filters[]`（写成 `{"label":"新人合照","page":"portraits"}`）

写了 `page` 的元素会变成真正的链接。输出的HTML文件之间可以点击跳转（包括底部导航），像一个可点击的原型。写了不存在的页面id会报错并指出具体位置。没有 `page` 的元素保持静态。

默认模板有 4 个主页面和 15 个二级页面，对应一套完整的婚礼小程序流程：

| 分组 | 页面 |
|---|---|
| 主页面（底部导航） | 请柬、赴约、相册、我的 |
| 启动与登录 | 开屏、登录、暗号验证 |
| 赴约详情 | 婚礼场地、住宿安排、集合地点、抵达指南、这座城、我的接送 |
| 回执与登记 | 赴约回执、到达登记 |
| 相册与互动 | 分享照片、分享成功、新人合照、互动游戏 |

删除不需要的页面时，同时删掉指向它的 `page`，否则校验会提示。

## 可覆盖的内置文案（strings）

模块没有写某个字段时，渲染器使用下表的默认文案。可通过顶层 `strings` 统一覆盖，不必每个模块逐个填写。

| 键 / Key | zh 默认 | en default |
|---|---|---|
| `hero.eyebrow` | WITH HEARTFELT INVITATION | WITH HEARTFELT INVITATION |
| `hero.title` | 诚挚邀请 | You’re Invited |
| `hero.subtitle` | 邀请您见证 | Join us to celebrate |
| `hero.small` | Be Our Witness | Be Our Witness |
| `story.line1` | 故事文案第一行 | Write the story of how you met here. |
| `story.line2` | 故事文案第二行 | Write a few words you’d like to share with family and friends. |
| `story.motto` | Love, written together. | Love, written together. |
| `date.title` | 期待，与你相见。 | We can’t wait to see you. |
| `date.note` | 在这里，写下你们的故事。 | Write your story here. |
| `date.small` | Our story continues. | Our story continues. |
| `photo.placeholder` | 照片 · {key} | Photo · {key} |
| `photo.unnamed` | 待填写 | to be added |
| `intro.eyebrow` | OUR WEDDING | OUR WEDDING |
| `intro.title` | 页面标题 | Page title |
| `timeline.title` | 婚礼安排 | Wedding Schedule |
| `button.text` | 按钮文案 | Button label |
| `status.title` | 当前状态 | Current status |
| `status.value` | 待填写 | To be filled |
| `gallery.filter1` | 我的视角 | My View |
| `gallery.filter2` | 宾客花絮 | Guest Moments |
| `gallery.filter3` | 新人合照 | Couple Photos |
| `gallery.title` | 共同留下这一刻 | Moments We Share |
| `gallery.empty` | 照片将在这里展示，等待亲友留下第一份喜悦。 | Photos will appear here once friends and family share their first moments. |
| `gallery.signature` | 亲友署名 | Guest name |
| `ticket.eyebrow` | WELCOME TO OUR WEDDING | WELCOME TO OUR WEDDING |
| `ticket.label` | 专属编号 | Your guest number |
| `ticket.number` | 编号 | No. |
| `signature.title` | 编辑我的署名 | Edit my signature |
| `signature.hint` | 照片上的名字，留一个你喜欢的称呼。 | The name shown on your photos — pick one you like. |
| `signature.value` | 亲友署名 | Guest name |
| `signature.current` | 当前署名： | Current signature:  |
| `signature.save` | 保存署名 | Save |
| `form.title` | 信息填写 | Your details |
| `form.empty` | 待填写 | To be filled |
| `form.button` | 保存信息 | Save |
| `frame.eyebrow` | WELCOME TO OUR WEDDING | WELCOME TO OUR WEDDING |
| `frame.signature` | 亲友署名 | Guest name |
| `splash.skip` | 跳过 | Skip |
| `gate.eyebrow` | GUESTS ONLY | GUESTS ONLY |
| `gate.login.title` | 欢迎来到我们的婚礼。⏎先登录，再进门。 | Welcome to our wedding.⏎Sign in to come inside. |
| `gate.login.copy` | 请柬里有行程与亲友信息。⏎登录后即可查看完整安排。 | The invitation includes schedules and guest details.⏎Sign in to see the full plan. |
| `gate.login.button` | 登录并继续 | Sign in and continue |
| `gate.login.hint` | 首次登录需要核对暗号，之后自动进入。 | The first sign-in checks a password; after that you go straight in. |
| `gate.answer.title` | 说出暗号，⏎就能进门。 | One quick password,⏎and you’re in. |
| `gate.answer.question` | 暗号问题写在这里 | Your password question goes here |
| `gate.answer.placeholder` | 输入暗号 | Enter the password |
| `gate.answer.button` | 进入婚礼 | Enter the wedding |
| `gate.answer.hint` | 暗号由新人提前告知 | The couple shares the password in advance |
| `gate.note` | 请柬含行程与亲友信息，仅限受邀者查看。 | This invitation contains schedules and guest details, visible to invited guests only. |
| `gate.link` | 先浏览公开请柬 | View the public invitation first |
| `heart.message` | 点一点，送出祝福 | Tap to send a blessing |
| `heart.score` | 0 | 0 |
| `empty.title` | 这里还是空的 | Nothing here yet |
| `empty.text` | 有内容之后，会出现在这里。 | It will appear here once there is something to show. |
| `art.label` | VENUE | VENUE |
| `back.label` | 返回 | Back |
| `default.male` | 姓名（男） | Name (Partner 1) |
| `default.female` | 姓名（女） | Name (Partner 2) |
| `default.english` | Name & Name | Name & Name |
| `default.date` | 日期 | Wedding date |
| `default.address` | 婚宴地址 | Venue address |
| `default.contact` | 联系方式 | Contact info |
| `default.project` | 婚礼UI设计 | Wedding UI design |

## 图片准备

基础预览用5张：portrait请柬主竖图、detail局部竖图、wide请柬横图、album相册头图、opening开屏满屏竖图（黑色背景）。可复用这些图片做列表示例。替换为自己的照片时优先保留人脸居中，按需要调整position。

渲染时，宽度超过 `width × scale` 像素的照片会在浏览器里自动缩小（只作用于输出，不改原文件），避免HTML和图片过大。仅支持本地 JPG / PNG / WebP。

如果增加场地/酒店详情，每页可再加一张photo模块；自定义相框设计可从frame模块扩展，但不要默认使用带原作者姓名的成品底图。

## 命令行

```sh
node scripts/render.cjs --config project.json --out output [--locale zh|en] [--browser chrome|msedge] [--browser-path <可执行文件>]
```

- `--locale`临时覆盖配置里的locale。
- 浏览器查找顺序：Playwright自带Chromium → 本机Chrome → 本机Edge → 全局安装的Playwright。也可用`--browser-path`或环境变量`CHROMIUM_PATH`直接指定。
- 先在内存里完整校验配置和素材，再启动浏览器；输出先写入临时目录，全部成功后才复制到`--out`，失败不会留下半成品。
- 以`⚠`开头的提示不会中断渲染，但通常说明有拼写问题：照片键没有定义，或定义了却没被使用。

## 输出

- 每个page生成一张PNG与自包含HTML，文件名以序号和安全id组成。
- `overview.jpg`：全部页面的总览图，主页面一行，二级页面按`group`分组，每个二级页面下方标出“来自哪个页面·哪个入口”。
- index.html提供全部页面链接。
- 规格文档记录占位资料、颜色、模块和示例状态：`locale=zh`为`设计规格.md`，`locale=en`为`design-spec.md`。
- manifest.json记录每张长图的像素尺寸。
- 无网络字体、API凭据、用户账号或原机器路径。
