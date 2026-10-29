'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const types = new Set(['hero','story','date','photo','intro','timeline','links','note','button','status','gallery','ticket','signature','cards','form','frame','back','splash','gate','panel','actions','empty','heart','art']);
const defaults = {paper:'#F1E8DF',card:'#FFF8EE',accent:'#782D37',ink:'#302E29',muted:'#827366',line:'#DCC5B8'};
const DEFAULT_ICONS = ['✉','⌂','▧','♧','◇'];

// ---------------------------------------------------------------------------
// Built-in copy. Every default text lives here, so any of it can be replaced
// from the config with  "strings": { "timeline.title": "..." }.
// ---------------------------------------------------------------------------
const STRINGS = {
  zh: {
    'hero.eyebrow':'WITH HEARTFELT INVITATION','hero.title':'诚挚邀请','hero.subtitle':'邀请您见证','hero.small':'Be Our Witness',
    'story.line1':'故事文案第一行','story.line2':'故事文案第二行','story.motto':'Love, written together.',
    'date.title':'期待，与你相见。','date.note':'在这里，写下你们的故事。','date.small':'Our story continues.',
    'photo.placeholder':'照片 · {key}','photo.unnamed':'待填写',
    'intro.eyebrow':'OUR WEDDING','intro.title':'页面标题',
    'timeline.title':'婚礼安排',
    'button.text':'按钮文案',
    'status.title':'当前状态','status.value':'待填写',
    'gallery.filter1':'我的视角','gallery.filter2':'宾客花絮','gallery.filter3':'新人合照','gallery.title':'共同留下这一刻',
    'gallery.empty':'照片将在这里展示，等待亲友留下第一份喜悦。','gallery.signature':'亲友署名',
    'ticket.eyebrow':'WELCOME TO OUR WEDDING','ticket.label':'专属编号','ticket.number':'编号',
    'signature.title':'编辑我的署名','signature.hint':'照片上的名字，留一个你喜欢的称呼。','signature.value':'亲友署名','signature.current':'当前署名：','signature.save':'保存署名',
    'form.title':'信息填写','form.empty':'待填写','form.button':'保存信息',
    'frame.eyebrow':'WELCOME TO OUR WEDDING','frame.signature':'亲友署名',
    'splash.skip':'跳过','gate.eyebrow':'GUESTS ONLY','gate.login.title':'欢迎来到我们的婚礼。\n先登录，再进门。','gate.login.copy':'请柬里有行程与亲友信息。\n登录后即可查看完整安排。','gate.login.button':'登录并继续','gate.login.hint':'首次登录需要核对暗号，之后自动进入。','gate.answer.title':'说出暗号，\n就能进门。','gate.answer.question':'暗号问题写在这里','gate.answer.placeholder':'输入暗号','gate.answer.button':'进入婚礼','gate.answer.hint':'暗号由新人提前告知','gate.note':'请柬含行程与亲友信息，仅限受邀者查看。','gate.link':'先浏览公开请柬','heart.message':'点一点，送出祝福','heart.score':'0','empty.title':'这里还是空的','empty.text':'有内容之后，会出现在这里。','art.label':'VENUE','back.label':'返回','default.male':'姓名（男）','default.female':'姓名（女）','default.english':'Name & Name',
    'default.date':'日期','default.address':'婚宴地址','default.contact':'联系方式','default.project':'婚礼UI设计'
  },
  en: {
    'hero.eyebrow':'WITH HEARTFELT INVITATION','hero.title':'You’re Invited','hero.subtitle':'Join us to celebrate','hero.small':'Be Our Witness',
    'story.line1':'Write the story of how you met here.','story.line2':'Write a few words you’d like to share with family and friends.','story.motto':'Love, written together.',
    'date.title':'We can’t wait to see you.','date.note':'Write your story here.','date.small':'Our story continues.',
    'photo.placeholder':'Photo · {key}','photo.unnamed':'to be added',
    'intro.eyebrow':'OUR WEDDING','intro.title':'Page title',
    'timeline.title':'Wedding Schedule',
    'button.text':'Button label',
    'status.title':'Current status','status.value':'To be filled',
    'gallery.filter1':'My View','gallery.filter2':'Guest Moments','gallery.filter3':'Couple Photos','gallery.title':'Moments We Share',
    'gallery.empty':'Photos will appear here once friends and family share their first moments.','gallery.signature':'Guest name',
    'ticket.eyebrow':'WELCOME TO OUR WEDDING','ticket.label':'Your guest number','ticket.number':'No.',
    'signature.title':'Edit my signature','signature.hint':'The name shown on your photos — pick one you like.','signature.value':'Guest name','signature.current':'Current signature: ','signature.save':'Save',
    'form.title':'Your details','form.empty':'To be filled','form.button':'Save',
    'frame.eyebrow':'WELCOME TO OUR WEDDING','frame.signature':'Guest name',
    'splash.skip':'Skip','gate.eyebrow':'GUESTS ONLY','gate.login.title':'Welcome to our wedding.\nSign in to come inside.','gate.login.copy':'The invitation includes schedules and guest details.\nSign in to see the full plan.','gate.login.button':'Sign in and continue','gate.login.hint':'The first sign-in checks a password; after that you go straight in.','gate.answer.title':'One quick password,\nand you’re in.','gate.answer.question':'Your password question goes here','gate.answer.placeholder':'Enter the password','gate.answer.button':'Enter the wedding','gate.answer.hint':'The couple shares the password in advance','gate.note':'This invitation contains schedules and guest details, visible to invited guests only.','gate.link':'View the public invitation first','heart.message':'Tap to send a blessing','heart.score':'0','empty.title':'Nothing here yet','empty.text':'It will appear here once there is something to show.','art.label':'VENUE','back.label':'Back','default.male':'Name (Partner 1)','default.female':'Name (Partner 2)','default.english':'Name & Name',
    'default.date':'Wedding date','default.address':'Venue address','default.contact':'Contact info','default.project':'Wedding UI design'
  }
};
const HTML_LANG = {zh:'zh-CN', en:'en'};
// Latin text looks better in a Latin serif; Chinese falls through to the CJK serif stack.
const LOCALE_CSS = {zh:'', en:'body{font-family:Georgia,"Times New Roman","Songti SC","STSong","SimSun","Noto Serif CJK SC",serif}'};

const DOCS = {
  zh: {
    indexTitle: 'UI图纸', specFile: '设计规格.md', ovTitle: '页面总览', ovMain: '主页面（底部导航）', ovDetail: '二级页面（点击 ↗ 打开）', ovFrom: '来自：',
    indexNote: '设计预览，不是真机截图。示例状态不连接后台。',
    spec: (c, results) => `# ${c.project || c.strings_default_project}\n\n这是一套UI图纸，不含后台实现。${c.previewPhotos ? '包含原作者预览照片（人物面部已模糊处理），照片不属于MIT代码许可。' : '默认占位或用户提供的照片。'}\n\n## 基本资料\n\n- 姓名：${c.people.male} / ${c.people.female}\n- 日期：${c.date}\n- 婚宴地址：${c.address}\n- 联系方式：${c.contact}\n\n## 色彩\n\n${Object.entries(c.theme).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\n## 页面与模块\n\n${c.pages.map(p => `### ${p.title}\n\n${p.modules.map((m,i) => `${i+1}. ${m.type}：${m.title||m.text||m.label||'按配置内容展示'}`).join('\n')}`).join('\n\n')}\n\n## 交付与状态\n\n${results.map(r => `- ${r.png}：${r.width}×${r.height}px`).join('\n')}\n- overview.jpg：全部页面总览（主页面与二级页面的关系）\n\n按钮、表单、编号、相册为静态示例。真实登录、存储、编号分配、提交、分享需后续开发。\n`
  },
  en: {
    indexTitle: 'UI blueprints', specFile: 'design-spec.md', ovTitle: 'Page overview', ovMain: 'Main pages (bottom navigation)', ovDetail: 'Detail pages (opened from ↗ links)', ovFrom: 'From: ',
    indexNote: 'Design preview, not device screenshots. Example states are not connected to any backend.',
    spec: (c, results) => `# ${c.project || c.strings_default_project}\n\nThis is a set of UI blueprints with no backend implementation. ${c.previewPhotos ? 'It includes the original author’s preview photos (faces blurred); the photos are not covered by the MIT code license.' : 'Photos are placeholders or supplied by the user.'}\n\n## Basics\n\n- Names: ${c.people.male} / ${c.people.female}\n- Date: ${c.date}\n- Venue address: ${c.address}\n- Contact: ${c.contact}\n\n## Colors\n\n${Object.entries(c.theme).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\n## Pages and modules\n\n${c.pages.map(p => `### ${p.title}\n\n${p.modules.map((m,i) => `${i+1}. ${m.type}: ${m.title||m.text||m.label||'content from config'}`).join('\n')}`).join('\n\n')}\n\n## Deliverables\n\n${results.map(r => `- ${r.png}: ${r.width}×${r.height}px`).join('\n')}\n- overview.jpg: overview of all pages (main pages and the detail pages they open)\n\nButtons, forms, numbers and the album are static examples. Real login, storage, number assignment, submission and sharing still need to be built.\n`
  }
};

// ---------------------------------------------------------------------------
// Errors and warnings (bilingual so any user can act on them)
// ---------------------------------------------------------------------------
function fail(zh, en) { throw new Error(en ? `${zh}\n${en}` : zh); }
const warnings = new Set();
const usedKeys = new Set();
const warn = (zh, en) => warnings.add(`${zh} / ${en}`);
const isText = v => typeof v === 'string' || typeof v === 'number';
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);

function T(c, key, vars) {
  let s = c.strings && Object.hasOwn(c.strings, key) ? c.strings[key] : STRINGS[c.locale][key];
  if (s === undefined) throw Error('missing string: ' + key);
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
}

const TEXT_FIELDS = {
  hero:['eyebrow','title','subtitle'], story:['motto','photo','position'], date:['title','photo','position','note'],
  photo:['photo','position','caption'], intro:['eyebrow','title','subtitle'], timeline:['title'], links:[], note:['text'],
  button:['text','page'], status:['title','value','page'], gallery:['title'], ticket:['label','number'], signature:['value','hint','title','button'],
  cards:[], form:['title','button','page'], frame:['photo','signature','caption','position'], back:['label','page'],
  splash:['photo','position','date','skip'], gate:['stage','eyebrow','title','copy','question','placeholder','button','hint','note','link'], panel:['title','text'], actions:[], empty:['title','text'], heart:['message','score'], art:['label','ornament']
};
const ARRAY_FIELDS = {splash:['names'], panel:['actions'], actions:['items'], story:['lines'], timeline:['items'], links:['items'], cards:['items'], gallery:['items','filters'], form:['fields']};
const ITEM_TEXT = {timeline:['time','title','note'], links:['title','note','page'], cards:['title','text','page'], gallery:['photo','signature','caption','action'], form:['label','value','placeholder'], actions:['label','page']};
const ratioOk = r => typeof r === 'number' && r >= 0.3 && r <= 4;

// Every place a module can point at another page: used for validation, links and the overview captions.
function pageRefs(c) {
  const out = [];
  c.pages.forEach((p, pi) => p.modules.forEach((m, mi) => {
    const at = `pages[${pi}](${p.id}).modules[${mi}]`;
    const push = (to, label, where, kind) => { if (to !== undefined) out.push({at: where, to, label, from: p, kind}); };
    if (['links', 'cards', 'actions'].includes(m.type)) (m.items || []).forEach((it, ii) => push(it.page, it.title || it.label, `${at}.items[${ii}].page`));
    if (m.type === 'button') push(m.page, m.text, `${at}.page`);
    if (m.type === 'form') push(m.page, m.button || T(c, 'form.button'), `${at}.page`);
    if (m.type === 'status') push(m.page, m.title, `${at}.page`);
    if (m.type === 'back') push(m.page, m.label, `${at}.page`, 'back');
    if (m.type === 'gallery') (m.filters || []).forEach((f, fi) => { if (isObj(f)) push(f.page, f.label, `${at}.filters[${fi}].page`); });
  }));
  return out;
}
function validate(c) {
  if (!isObj(c)) fail('配置文件顶层必须是JSON对象。', 'The config must be a JSON object at the top level.');
  c.locale ??= 'zh';
  if (!Object.hasOwn(STRINGS, c.locale)) fail(`locale只支持 ${Object.keys(STRINGS).join(' / ')}，收到 "${c.locale}"。`, `"locale" must be one of: ${Object.keys(STRINGS).join(', ')} (got "${c.locale}").`);
  if (c.strings !== undefined) {
    if (!isObj(c.strings)) fail('strings必须是对象，例如 {"timeline.title":"Schedule"}。', '"strings" must be an object, e.g. {"timeline.title":"Schedule"}.');
    for (const [k, v] of Object.entries(c.strings)) {
      if (!Object.hasOwn(STRINGS[c.locale], k)) fail(`strings中的键 "${k}" 不存在。可用键见 references/configuration.md。`, `Unknown key "${k}" in "strings". See references/configuration.md for the list.`);
      if (typeof v !== 'string') fail(`strings["${k}"] 必须是字符串。`, `strings["${k}"] must be a string.`);
    }
  }
  if (c.project !== undefined && !isText(c.project)) fail('project必须是文字。', '"project" must be text.');
  if (c.previewPhotos !== undefined && typeof c.previewPhotos !== 'boolean') fail('previewPhotos必须是true或false。', '"previewPhotos" must be true or false.');
  if (c.photos !== undefined) {
    if (!isObj(c.photos)) fail('photos必须是 {键: 图片路径} 对象。', '"photos" must be an object of {key: image path}.');
    for (const [k, v] of Object.entries(c.photos)) if (typeof v !== 'string') fail(`photos["${k}"] 必须是图片路径字符串。`, `photos["${k}"] must be an image path string.`);
  }
  if (!Array.isArray(c.pages) || !c.pages.length) fail('pages不能为空，至少需要一个页面。', '"pages" must contain at least one page.');
  c.width ??= 390; c.scale ??= 3;
  if (!Number.isInteger(c.width) || c.width < 320 || c.width > 600 || !Number.isInteger(c.scale) || c.scale < 1 || c.scale > 4)
    fail('width须为320–600的整数，scale须为1–4的整数。', '"width" must be an integer 320–600 and "scale" an integer 1–4.');

  const ids = new Set();
  c.pages.forEach((p, pi) => {
    if (!isObj(p)) fail(`pages[${pi}] 必须是对象。`, `pages[${pi}] must be an object.`);
    if (typeof p.id !== 'string' || !/^[a-z][a-z0-9-]{0,40}$/.test(p.id) || ids.has(p.id))
      fail(`pages[${pi}].id 须为唯一的小写英文/数字/连字符（以字母开头），收到 ${JSON.stringify(p.id)}。`, `pages[${pi}].id must be unique, lowercase letters/digits/hyphens, starting with a letter (got ${JSON.stringify(p.id)}).`);
    ids.add(p.id);
    p.title ??= p.id;
    if (p.nav !== undefined && typeof p.nav !== 'boolean') fail(`pages[${pi}](${p.id}).nav 必须是true或false。`, `pages[${pi}] (${p.id}): "nav" must be true or false.`);
    if (p.group !== undefined && !isText(p.group)) fail(`pages[${pi}](${p.id}).group 必须是文字。`, `pages[${pi}] (${p.id}): "group" must be text.`);
    if (!Array.isArray(p.modules)) fail(`pages[${pi}](${p.id}).modules 必须是数组。`, `pages[${pi}] (${p.id}): "modules" must be an array.`);
    p.modules.forEach((m, mi) => {
      const at = `pages[${pi}](${p.id}).modules[${mi}]`;
      if (!isObj(m)) fail(`${at} 必须是对象。`, `${at} must be an object.`);
      if (!types.has(m.type)) fail(`${at}：未知模块类型 ${JSON.stringify(m.type)}。可用类型：${[...types].join(', ')}。`, `${at}: unknown module type ${JSON.stringify(m.type)}. Available: ${[...types].join(', ')}.`);
      if (m.position !== undefined && !(typeof m.position === 'string' && /^\d{1,3}% \d{1,3}%$/.test(m.position))) fail(`${at}.position 请用百分比坐标，如 "50% 40%"。`, `${at}.position must look like "50% 40%".`);
      if (m.ratio !== undefined && !ratioOk(m.ratio)) fail(`${at}.ratio 须为0.3–4之间的数字（宽/高）。`, `${at}.ratio must be a number between 0.3 and 4 (width/height).`);
      for (const f of TEXT_FIELDS[m.type]) if (m[f] !== undefined && !isText(m[f])) fail(`${at}.${f} 必须是文字。`, `${at}.${f} must be text.`);
      for (const f of ARRAY_FIELDS[m.type] || []) {
        if (m[f] === undefined) continue;
        if (!Array.isArray(m[f])) fail(`${at}.${f} 必须是数组（例如 ["a","b"]），收到 ${typeof m[f]}。`, `${at}.${f} must be an array (e.g. ["a","b"]), got ${typeof m[f]}.`);
        m[f].forEach((item, ii) => {
          const where = `${at}.${f}[${ii}]`;
          if (f === 'filters' && isObj(item)) {
            if (!isText(item.label)) fail(`${where}.label 必须是文字。`, `${where}.label must be text.`);
            if (item.page !== undefined && typeof item.page !== 'string') fail(`${where}.page 必须是页面id。`, `${where}.page must be a page id.`);
            return;
          }
          if (['lines', 'filters', 'names', 'actions'].includes(f) && m.type !== 'actions') { if (!isText(item)) fail(`${where} 必须是文字。`, `${where} must be text.`); return; }
          if (!isObj(item)) fail(`${where} 必须是对象。`, `${where} must be an object.`);
          for (const k of ITEM_TEXT[m.type] || []) if (item[k] !== undefined && !isText(item[k])) fail(`${where}.${k} 必须是文字。`, `${where}.${k} must be text.`);
          if (item.ratio !== undefined && !ratioOk(item.ratio)) fail(`${where}.ratio 须为0.3–4之间的数字。`, `${where}.ratio must be a number between 0.3 and 4.`);
          for (const flag of ['multiline', 'select', 'half', 'primary', 'inline']) if (item[flag] !== undefined && typeof item[flag] !== 'boolean') fail(`${where}.${flag} 必须是true或false。`, `${where}.${flag} must be true or false.`);
        });
      }
      for (const flag of ['noButton', 'inline', 'secondary']) if (m[flag] !== undefined && typeof m[flag] !== 'boolean') fail(`${at}.${flag} 必须是true或false。`, `${at}.${flag} must be true or false.`);
      if (m.type === 'gate' && m.stage !== undefined && !['login', 'answer'].includes(m.stage)) fail(`${at}.stage 只能是 "login" 或 "answer"。`, `${at}.stage must be "login" or "answer".`);
      if (m.type === 'frame' && m.orientation !== undefined && !['portrait', 'landscape'].includes(m.orientation)) fail(`${at}.orientation 只能是 "portrait" 或 "landscape"。`, `${at}.orientation must be "portrait" or "landscape".`);
      if (m.type === 'gallery' && m.active !== undefined && !Number.isInteger(m.active)) fail(`${at}.active 必须是整数（第几个筛选标签，从0开始）。`, `${at}.active must be an integer (0-based filter index).`);
    });
  });

  c.pages.forEach((p, pi) => {
    if (p.parent !== undefined && !(typeof p.parent === 'string' && ids.has(p.parent) && p.parent !== p.id)) {
      const list = [...ids].join(', ');
      fail(`pages[${pi}](${p.id}).parent 必须是另一个已有页面的id（现有：${list}）。`, `pages[${pi}] (${p.id}): "parent" must be the id of another page (available: ${list}).`);
    }
  });
  for (const r of pageRefs(c)) if (!ids.has(r.to)) {
    const list = [...ids].join(', ');
    fail(`${r.at} 必须是已有页面的id（现有：${list}），收到 ${JSON.stringify(r.to)}。`, `${r.at} must be an existing page id (available: ${list}), got ${JSON.stringify(r.to)}.`);
  }

  c.navigation ??= c.pages.slice(0, 4).map(p => ({id: p.id, label: p.title}));
  if (!Array.isArray(c.navigation) || c.navigation.length > 5) fail('navigation最多5项。', '"navigation" must be an array of at most 5 items.');
  c.navigation = c.navigation.map((n, i) => {
    if (!isObj(n) || !ids.has(n.id)) fail(`navigation[${i}].id 必须对应某个页面的id（现有：${[...ids].join(', ')}）。`, `navigation[${i}].id must match a page id (available: ${[...ids].join(', ')}).`);
    if (n.icon !== undefined && !(typeof n.icon === 'string' && n.icon && Array.from(n.icon).length <= 2)) fail(`navigation[${i}].icon 必须是1–2个字符，例如 "✉"。`, `navigation[${i}].icon must be 1–2 characters, e.g. "✉".`);
    const page = c.pages.find(p => p.id === n.id);
    return {...n, label: n.label ?? page.title};
  });

  c.theme = {...defaults, ...c.theme};
  for (const [key, val] of Object.entries(c.theme))
    if (!(key in defaults) || !/^#[0-9a-f]{6}$/i.test(val)) fail(`无效主题色 ${key}：须为 #RRGGBB（可用键：${Object.keys(defaults).join('/')}）。`, `Invalid theme color "${key}": use #RRGGBB (keys: ${Object.keys(defaults).join('/')}).`);

  c.people = {male: T(c, 'default.male'), female: T(c, 'default.female'), english: T(c, 'default.english'), ...c.people};
  c.date ??= T(c, 'default.date'); c.address ??= T(c, 'default.address'); c.contact ??= T(c, 'default.contact'); c.photos ??= {};
  const tokens = {date: c.date, address: c.address, contact: c.contact, male: c.people.male, female: c.people.female, english: c.people.english};
  const fill = v => typeof v === 'string' ? v.replace(/\{\{(date|address|contact|male|female|english)\}\}/g, (_, k) => tokens[k]) : Array.isArray(v) ? v.map(fill) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)])) : v;
  c.pages = c.pages.map(p => ({...p, modules: fill(p.modules)}));
  return c;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
const MIME = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf'};
function asset(file, c) {
  const hit = c && c.__resized && c.__resized.get(file);
  if (hit) return hit;
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime) fail(`只支持本地JPG/PNG/WebP素材：${file}`, `Only local JPG/PNG/WebP images are supported: ${file}`);
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}
function photo(c, base, key, cls = '', ratio = 1.5, position = '50% 50%') {
  if (key !== undefined) usedKeys.add(key);
  let value = Object.hasOwn(c.photos, key) ? c.photos[key] : undefined;
  if (!value) {
    if (key !== undefined && Object.keys(c.photos).length) warn(`照片键 "${key}" 没有在 photos 中定义，已显示占位框`, `Photo key "${key}" is not defined in "photos"; showing a placeholder`);
    return `<div class="placeholder ${esc(cls)}" style="aspect-ratio:${ratio}"><span>${esc(T(c, 'photo.placeholder', {key: key || T(c, 'photo.unnamed')}))}</span></div>`;
  }
  if (value.startsWith('demo:')) {
    if (!c.previewPhotos) fail('随附照片仅供显式预览：设置 previewPhotos=true。', 'The bundled photos are for explicit previews only: set previewPhotos=true.');
    const name = value.slice(5);
    if (!['portrait', 'detail', 'wide', 'album', 'opening'].includes(name)) fail(`未知demo素材 "${name}"。`, `Unknown demo photo "${name}".`);
    value = path.join(root, 'assets/preview', name + '.jpg');
  } else {
    if (/^[a-z]+:\/\//i.test(value)) fail(`照片 "${key}" 不能是远程地址：${value}`, `Photo "${key}" cannot be a remote URL: ${value}`);
    value = path.resolve(base, value);
  }
  if (!fs.existsSync(value)) fail(`照片 "${key}" 的文件不存在：${value}\n相对路径以配置文件所在目录为基准。`, `The file for photo "${key}" does not exist: ${value}\nRelative paths are resolved from the config file's folder.`);
  return `<img class="${esc(cls)}" src="${asset(value, c)}" alt="${esc(key)}" style="aspect-ratio:${ratio};object-position:${esc(position)}">`;
}
const act = (c, page, cls, inner, tag = 'button') => page ? `<a class="${cls}" href="${pageFile(c, page)}">${inner}</a>` : `<${tag} class="${cls}">${inner}</${tag}>`;
const br = text => esc(text).replace(/\n/g, '<br>');
const pageFile = (c, id) => `${String(c.pages.findIndex(p => p.id === id) + 1).padStart(2, '0')}-${id}.html`;
function renderModule(m, c, base, page) {
  const e = esc, t = (k, v) => T(c, k, v), pic = (key, cls, ratio) => photo(c, base, key, cls, ratio, m.position);
  switch (m.type) {
    case 'hero': return `<section class="hero"><div class="thread"></div><p class="eyebrow">${e(m.eyebrow || t('hero.eyebrow'))}</p><h1>${e(m.title || t('hero.title'))}</h1><div class="script names-en">${e(c.people.english)}</div><h2 class="names">${e(c.people.male)}<span> & </span>${e(c.people.female)}</h2><div class="witness">${e(m.subtitle || t('hero.subtitle'))}<small>${e(t('hero.small'))}</small></div></section>`;
    case 'story': return `<section class="story">${(m.lines || [t('story.line1'), t('story.line2')]).map(x => `<p>${e(x)}</p>`).join('')}<p class="script">${e(m.motto || t('story.motto'))}</p>${pic(m.photo, 'portrait', 2 / 3)}</section>`;
    case 'date': return `<section class="date"><p>${e(m.title || t('date.title'))}</p><p>${e(c.date)}</p><div class="detail-pair">${pic(m.photo, 'detail-photo', 2 / 3)}<p>${e(m.note || t('date.note'))}<small>${e(t('date.small'))}</small></p></div></section>`;
    case 'photo': return `<section class="full-photo">${pic(m.photo, '', m.ratio || 1.5)}${m.caption ? `<p class="caption">${e(m.caption)}</p>` : ''}</section>`;
    case 'intro': return `<section class="pad intro"><p class="eyebrow">${e(m.eyebrow || t('intro.eyebrow'))}</p><h1>${e(m.title || t('intro.title'))}</h1><p class="muted">${e(m.subtitle || c.date)}</p></section>`;
    case 'timeline': return `<section class="pad"><h2>${e(m.title || t('timeline.title'))}</h2><div class="timeline">${(m.items || []).map(i => `<div class="event"><time>${e(i.time)}</time><div><p>${e(i.title)}</p><small>${e(i.note)}</small></div></div>`).join('')}</div></section>`;
    case 'links': return `<section class="pad links">${(m.items || []).map(i => { const tag = i.page ? 'a' : 'div'; return `<${tag} class="link"${i.page ? ` href="${pageFile(c, i.page)}"` : ''}><div><h3>${e(i.title)}</h3><p class="muted">${e(i.note)}</p></div><span class="arrow">↗</span></${tag}>`; }).join('')}</section>`;
    case 'splash': {
      const names = m.names || [c.people.male, c.people.female];
      return `<section class="splash">${pic(m.photo, 'splash-img', 390 / 844)}<span class="skip">${e(m.skip || t('splash.skip'))}</span><div class="splash-names">${names.map(n => `<span>${e(n)}</span>`).join('')}</div><div class="splash-bottom"><span>${e(m.date || c.date)}</span><div class="progress"><i></i></div></div></section>`;
    }
    case 'gate': {
      const login = (m.stage || 'login') === 'login', k = login ? 'gate.login' : 'gate.answer';
      return `<section class="gate"><p class="eyebrow">${e(m.eyebrow || t('gate.eyebrow'))}</p><h1>${br(m.title || t(k + '.title'))}</h1>${login ? `<p class="gate-copy">${br(m.copy || t('gate.login.copy'))}</p>` : `<p class="gate-q">${e(m.question || t('gate.answer.question'))}</p><div class="answer">${e(m.placeholder || t('gate.answer.placeholder'))}</div>`}<button class="primary gate-btn">${e(m.button || t(k + '.button'))}</button><p class="gate-hint">${e(m.hint || t(k + '.hint'))}</p><p class="gate-note">${e(m.note || t('gate.note'))}</p><span class="gate-link">${e(m.link || t('gate.link'))}</span></section>`;
    }
    case 'panel': return `<section class="pad"><div class="card panel"><h3>${e(m.title)}</h3><p class="pre">${e(m.text)}</p>${(m.actions || []).map(a => `<button class="secondary">${e(a)}</button>`).join('')}</div></section>`;
    case 'actions': return `<section class="pad actions ${m.inline ? 'inline' : ''}">${(m.items || []).map(i => act(c, i.page, i.primary ? 'primary' : 'secondary', e(i.label))).join('')}</section>`;
    case 'empty': return `<section class="empty-state"><h3>${e(m.title || t('empty.title'))}</h3><p class="muted">${e(m.text || t('empty.text'))}</p></section>`;
    case 'heart': return `<section class="pad heart-wrap"><div class="heart">♡</div><h2>${e(m.message || t('heart.message'))}</h2><div class="score">${e(m.score ?? t('heart.score'))}</div></section>`;
    case 'art': return `<section class="pad"><div class="art"><span class="orn">${e(m.ornament || '♡')}</span><small>${e(m.label || t('art.label'))}</small></div></section>`;
    case 'back': { const to = m.page || page.parent; return `<${to ? 'a' : 'div'} class="backbar"${to ? ` href="${pageFile(c, to)}"` : ''}><span>‹</span>${e(m.label || t('back.label'))}</${to ? 'a' : 'div'}>`; }
    case 'note': return `<section class="pad"><p class="note">${e(m.text)}</p></section>`;
    case 'button': return `<section class="pad">${act(c, m.page, m.secondary ? 'secondary' : 'primary', e(m.text || t('button.text')))}</section>`;
    case 'status': return `<section class="pad">${act(c, m.page, 'status', `<span>${e(m.title || t('status.title'))}</span><span class="pill">${e(m.value || t('status.value'))}</span>`, 'div')}</section>`;
    case 'gallery': {
      const items = m.items || [];
      const columns = [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 !== 0)];
      const filters = m.filters || [t('gallery.filter1'), t('gallery.filter2'), t('gallery.filter3')];
      const chip = (f, i) => { const label = typeof f === 'object' ? f.label : f; const span = `<span class="${i === (m.active ?? 1) ? 'selected' : ''}">${e(label)}</span>`; return f && f.page ? `<a class="contents" href="${pageFile(c, f.page)}">${span}</a>` : span; };
      return `<section class="pad">${filters.length ? `<div class="filters">${filters.map(chip).join('')}</div>` : ''}${m.title === '' ? '' : `<h2>${e(m.title || t('gallery.title'))}</h2>`}${items.length ? `<div class="gallery">${columns.map(col => `<div>${col.map(i => `<article>${photo(c, base, i.photo, '', i.ratio || 1)}<div class="photo-meta"><p>${e(i.signature || t('gallery.signature'))}</p>${i.caption ? `<small>${e(i.caption)}</small>` : ''}${i.action ? `<button class="soft photo-btn">${e(i.action)}</button>` : ''}</div></article>`).join('')}</div>`).join('')}</div>` : `<p class="empty">${e(t('gallery.empty'))}</p>`}</section>`;
    }
    case 'ticket': return `<section class="pad"><div class="ticket"><p class="eyebrow">${e(t('ticket.eyebrow'))}</p><div class="ticket-inner"><div class="script">with<br>love</div><div><p>${e(m.label || t('ticket.label'))}</p><strong>${e(m.number || t('ticket.number'))}</strong></div></div><p>${e(c.people.male)} & ${e(c.people.female)}</p><small>${e(c.date)}</small></div></section>`;
    case 'signature': return `<section class="pad"><div class="card"><h3>${e(m.title || t('signature.title'))}</h3><p class="muted">${e(m.hint || t('signature.hint'))}</p><div class="input">${e(m.value || t('signature.value'))}</div><div class="signature-foot"><small>${e(t('signature.current'))}${e(m.value || t('signature.value'))}</small><button class="soft">${e(m.button || t('signature.save'))}</button></div></div></section>`;
    case 'cards': return `<section class="pad cards">${(m.items || []).map(i => act(c, i.page, 'card', `<h3>${e(i.title)}</h3><p class="muted">${e(i.text)}</p>`, 'div')).join('')}</section>`;
    case 'form': {
      const fields = m.fields || [], one = f => `<label>${e(f.label)}<div class="${['input', f.multiline && 'multiline', f.select && 'select'].filter(Boolean).join(' ')}">${e(f.value || f.placeholder || t('form.empty'))}</div></label>`;
      let body = '';
      for (let k = 0; k < fields.length; k++) {
        if (fields[k].half && fields[k + 1] && fields[k + 1].half) { body += `<div class="two">${one(fields[k])}${one(fields[k + 1])}</div>`; k++; } else body += one(fields[k]);
      }
      return `<section class="pad"><div class="card">${m.title === '' ? '' : `<h2>${e(m.title || t('form.title'))}</h2>`}${body}${m.noButton ? '' : act(c, m.page, 'primary', e(m.button || t('form.button')))}</div></section>`;
    }
    case 'frame': return `<section class="pad"><div class="frame"><p class="eyebrow">${e(t('frame.eyebrow'))}</p>${pic(m.photo, '', m.orientation === 'landscape' ? 1.5 : 2 / 3)}<div class="script">with love</div><p>${e(m.signature || t('frame.signature'))}</p><small>${e(m.caption || c.date)}</small></div></section>`;
  }
}
function html(c, p, base) {
  const vars = Object.entries(c.theme).map(([k, v]) => `--${k}:${v}`).join(';');
  const font = asset(path.join(root, 'assets/fonts/GreatVibes-Regular.ttf'));
  const css = fs.readFileSync(path.join(root, 'assets/style.css'), 'utf8');
  const nav = c.navigation.map((n, i) => `<a class="${n.id === p.id || n.id === p.parent ? 'active' : ''}" href="${pageFile(c, n.id)}"><span>${esc(n.icon ?? DEFAULT_ICONS[i])}</span>${esc(n.label)}</a>`).join('');
  return `<!doctype html><html lang="${HTML_LANG[c.locale]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'"><title>${esc(p.title)}</title><style>@font-face{font-family:WeddingScript;src:url("${font}")} :root{${vars}}${css}${LOCALE_CSS[c.locale]}</style></head><body><main${p.nav === false ? ' class="bare"' : ''}>${p.modules.map(m => renderModule(m, c, base, p)).join('')}</main>${p.nav === false ? '' : `<nav>${nav}</nav>`}</body></html>`;
}

// ---------------------------------------------------------------------------
// Browser handling
// ---------------------------------------------------------------------------
function playwrightPackages() {
  const dirs = new Map();
  const add = dir => { try { dirs.set(fs.realpathSync(dir), dir); } catch {} };
  for (const name of ['playwright', 'playwright-core']) {
    try { add(path.dirname(require.resolve(name + '/package.json'))); } catch {}
  }
  return () => [...dirs.values()];
}
function globalPlaywrights(known) {
  try {
    const g = require('child_process').execSync('npm root -g', {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000}).trim();
    const seen = new Set(known.map(d => { try { return fs.realpathSync(d); } catch { return d; } }));
    return ['playwright', 'playwright-core'].map(n => path.join(g, n)).filter(d => fs.existsSync(path.join(d, 'package.json')) && !seen.has(fs.realpathSync(d)));
  } catch { return []; }
}
async function openBrowser(opts = {}) {
  const exe = opts.browserPath || process.env.CHROMIUM_PATH;
  const attempts = exe ? [{executablePath: exe}] : opts.browser ? [{channel: opts.browser}] : [{}, {channel: 'chrome'}, {channel: 'msedge'}];
  const errors = [];
  const tryPackages = async dirs => {
    for (const dir of dirs) {
      let chromium;
      try { ({chromium} = require(dir)); } catch (e) { errors.push(`${dir}: ${String(e.message).split('\n')[0]}`); continue; }
      for (const a of attempts) {
        try { return await chromium.launch({headless: true, ...a}); }
        catch (e) { errors.push(`${path.basename(dir)} ${JSON.stringify(a)}: ${String(e.message).split('\n')[0]}`); }
      }
    }
    return null;
  };
  const local = playwrightPackages()();
  let browser = await tryPackages(local);
  if (!browser) browser = await tryPackages(globalPlaywrights(local));
  if (browser) return browser;
  const none = !local.length;
  fail(
    `无法启动浏览器。${none ? '没有找到playwright，请先在技能目录运行 npm install。' : ''}\n可任选其一：\n  1) npx playwright install chromium\n  2) 使用本机浏览器：--browser chrome 或 --browser msedge\n  3) 指定可执行文件：--browser-path <路径>（或设置环境变量 CHROMIUM_PATH）\n详情：\n  ${errors.slice(0, 6).join('\n  ')}`,
    `Could not launch a browser.${none ? ' Playwright was not found: run "npm install" in the skill folder first.' : ''}\nPick one:\n  1) npx playwright install chromium\n  2) Use an installed browser: --browser chrome or --browser msedge\n  3) Point to an executable: --browser-path <path> (or set CHROMIUM_PATH)`
  );
}
// Downscale oversized photos in the browser so the HTML/PNG pipeline stays light.
async function shrinkPhotos(browser, c, base) {
  const map = new Map();
  const maxW = c.width * c.scale;
  const files = new Set(Object.values(c.photos).filter(v => !v.startsWith('demo:')).map(v => path.resolve(base, v)));
  if (!files.size) return map;
  const page = await browser.newPage();
  try {
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const outMime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      const src = `data:${MIME[ext]};base64,${fs.readFileSync(file).toString('base64')}`;
      const out = await page.evaluate(async ({src, maxW, outMime}) => {
        const img = new Image(); img.src = src; await img.decode();
        if (img.naturalWidth <= maxW) return null;
        const w = maxW, h = Math.round(img.naturalHeight * w / img.naturalWidth);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, w, h);
        return cv.toDataURL(outMime, 0.88);
      }, {src, maxW, outMime});
      if (out) map.set(file, out);
    }
  } finally { await page.close(); }
  return map;
}

async function buildOverview(browser, c, results, tmp) {
  const D = DOCS[c.locale];
  const navIds = c.navigation.map(n => n.id);
  const byId = new Map(results.map(r => [r.id, r]));
  const main = navIds.map(id => byId.get(id));
  const rest = results.filter(r => !navIds.includes(r.id));
  const from = new Map();
  for (const r of pageRefs(c)) {
    if (r.kind === 'back' || r.from.id === r.to) continue;
    if (!from.has(r.to)) from.set(r.to, []);
    const entry = `${r.from.title} · ${r.label}`;
    if (!from.get(r.to).includes(entry)) from.get(r.to).push(entry);
  }
  const card = r => `<figure><figcaption>${esc(r.title)}</figcaption><img src="${r.png}">${from.has(r.id) && !navIds.includes(r.id) ? `<small>${esc(D.ovFrom)}${from.get(r.id).slice(0, 4).map(esc).join('<br>')}${from.get(r.id).length > 4 ? '<br>…' : ''}</small>` : ''}</figure>`;
  const groups = new Map();
  for (const r of rest) {
    const name = String(c.pages.find(p => p.id === r.id).group ?? D.ovDetail);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(r);
  }
  const widest = Math.max(main.length, ...[...groups.values()].map(g => Math.min(g.length, 6)), 1), W = widest * 330 + 80;
  const src = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;width:${W}px;padding:40px;box-sizing:border-box;background:${c.theme.paper};color:${c.theme.ink};font-family:${c.locale === 'zh' ? '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif' : 'Georgia,"Times New Roman",serif'}}
h1{font-size:30px;font-weight:400;margin:0 0 4px}h2{font-size:15px;letter-spacing:.14em;font-weight:400;color:${c.theme.accent};margin:34px 0 14px;border-bottom:1px solid ${c.theme.line};padding-bottom:8px}
.row{display:flex;flex-wrap:wrap;gap:30px;align-items:flex-start}figure{margin:0;width:300px}
figcaption{font-size:16px;margin-bottom:8px}img{display:block;width:300px;box-shadow:0 8px 24px rgba(60,40,30,.16);border-radius:6px}
small{display:block;margin-top:8px;font-size:12px;line-height:1.6;color:${c.theme.muted}}</style>
<h1>${esc(c.project || T(c, 'default.project'))} · ${esc(D.ovTitle)}</h1>
<h2>${esc(D.ovMain)}</h2><div class="row">${main.map(card).join('')}</div>
${[...groups].map(([name, list]) => `<h2>${esc(name)}</h2><div class="row">${list.map(card).join('')}</div>`).join('')}`;
  const srcFile = path.join(tmp, '_overview-source.html');
  fs.writeFileSync(srcFile, src);
  const page = await browser.newPage({viewport: {width: W, height: 800}, deviceScaleFactor: 1.5});
  try {
    await page.goto(require('url').pathToFileURL(srcFile).href);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
    await page.screenshot({path: path.join(tmp, 'overview.jpg'), type: 'jpeg', quality: 90, fullPage: true});
  } finally { await page.close(); fs.rmSync(srcFile, {force: true}); }
}

async function run(configFile, out, opts = {}) {
  let raw;
  try { raw = JSON.parse(fs.readFileSync(configFile, 'utf8')); }
  catch (e) { fail(`无法读取配置文件 ${configFile}：${e.message}`, `Cannot read config file ${configFile}: ${e.message}`); }
  if (opts.locale) raw.locale = opts.locale;
  const c = validate(raw), base = path.dirname(configFile);
  c.strings_default_project = T(c, 'default.project');
  warnings.clear(); usedKeys.clear();
  c.pages.forEach(p => html(c, p, base)); // dry run: surface config/asset errors before any browser work
  for (const k of Object.keys(c.photos)) if (!usedKeys.has(k)) warn(`照片 "${k}" 已定义但没有被任何模块使用（检查拼写）`, `Photo "${k}" is defined but no module uses it (check spelling)`);

  fs.mkdirSync(path.dirname(out), {recursive: true});
  const tmp = fs.mkdtempSync(path.join(path.dirname(out), '.paper-wedding-'));
  const browser = await openBrowser(opts);
  const results = [];
  try {
    Object.defineProperty(c, '__resized', {value: await shrinkPhotos(browser, c, base), enumerable: false});
    const pages = c.pages.map((p, i) => ({p, file: `${String(i + 1).padStart(2, '0')}-${p.id}`, doc: html(c, p, base)}));
    for (const {p, file, doc} of pages) {
      const page = await browser.newPage({viewport: {width: c.width, height: 844}, deviceScaleFactor: c.scale});
      await page.setContent(doc);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
      const metrics = await page.evaluate(() => ({width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, broken: [...document.images].some(i => !i.naturalWidth)}));
      if (metrics.broken) fail(`页面 ${p.id} 有图片无法解码，请检查照片文件是否损坏。`, `Page ${p.id} has an image that cannot be decoded; the file may be corrupt.`);
      if (metrics.width > c.width + 1) fail(`页面 ${p.id} 出现横向溢出（${metrics.width}px > ${c.width}px），请检查超长且无空格的文字。`, `Page ${p.id} overflows horizontally (${metrics.width}px > ${c.width}px); check very long unbroken text.`);
      if (metrics.height * c.scale > 30000) fail(`页面 ${p.id} 导出高度 ${metrics.height * c.scale}px 超过30000px，请降低scale或把内容拆成多个页面。`, `Page ${p.id} would be ${metrics.height * c.scale}px tall (limit 30000px); lower "scale" or split it into several pages.`);
      await page.screenshot({path: path.join(tmp, file + '.png'), fullPage: true});
      fs.writeFileSync(path.join(tmp, file + '.html'), doc);
      results.push({id: p.id, title: p.title, png: file + '.png', html: file + '.html', width: c.width * c.scale, height: metrics.height * c.scale});
      await page.close();
    }
    await buildOverview(browser, c, results, tmp);
    const D = DOCS[c.locale];
    fs.writeFileSync(path.join(tmp, 'index.html'), `<!doctype html><html lang="${HTML_LANG[c.locale]}"><meta charset="utf-8"><title>${esc(D.indexTitle)}</title><h1>${esc(c.project || c.strings_default_project)}</h1><p>${esc(D.indexNote)}</p><p><a href="overview.jpg">${esc(D.ovTitle)} · PNG</a></p>${results.map(r => `<p><a href="${r.html}">${esc(r.title)} · HTML</a> / <a href="${r.png}">PNG ${r.width}×${r.height}</a></p>`).join('')}`);
    fs.writeFileSync(path.join(tmp, 'manifest.json'), JSON.stringify({previewOnly: true, overview: 'overview.jpg', usesAuthorPreviewPhotos: !!c.previewPhotos, pages: results}, null, 2));
    fs.writeFileSync(path.join(tmp, D.specFile), D.spec(c, results));
    // Only now touch the real output folder, so a failed run never leaves a half-written result.
    fs.mkdirSync(out, {recursive: true});
    for (const f of fs.readdirSync(tmp)) fs.copyFileSync(path.join(tmp, f), path.join(out, f));
  } finally {
    await browser.close();
    fs.rmSync(tmp, {recursive: true, force: true});
  }
  for (const w of warnings) console.error('⚠ ' + w);
  if (c.__resized.size) console.error(`ℹ ${c.__resized.size} photo(s) downscaled to ${c.width * c.scale}px wide / 已将 ${c.__resized.size} 张照片缩放到 ${c.width * c.scale}px 宽`);
  console.log(JSON.stringify(results, null, 2));
  return results;
}

if (require.main === module) {
  const args = process.argv.slice(2), get = (key, fallback) => { const n = args.indexOf(key); return n < 0 ? fallback : args[n + 1]; };
  const config = get('--config'), out = get('--out');
  if (args.includes('--help') || !config || !out) {
    console.error('node scripts/render.cjs --config path.json --out folder [--locale zh|en] [--browser chrome|msedge] [--browser-path <executable>]');
    process.exit(args.includes('--help') ? 0 : 1);
  }
  run(path.resolve(config), path.resolve(out), {browser: get('--browser'), browserPath: get('--browser-path'), locale: get('--locale')})
    .catch(e => { console.error(e.message); process.exitCode = 1; });
}
module.exports = {validate, html, run, STRINGS, warnings};
