const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {validate, html, STRINGS, warnings} = require('./render.cjs');
const root = path.resolve(__dirname, '..');
const load = (f = 'template.json') => JSON.parse(fs.readFileSync(path.join(root, 'examples', f), 'utf8'));
const throwsMsg = (fn, re) => assert.throws(fn, e => re.test(e.message), `expected error matching ${re}`);
const body = doc => doc.replace(/<style>[\s\S]*?<\/style>/, '');

// --- defaults (zh) ---------------------------------------------------------
let c = validate(load());
assert.equal(c.pages.length, 19); assert.equal(c.navigation.length, 4);
assert.ok(html(c, c.pages[0], root).includes('姓名（男）'));
assert.ok(!html(c, c.pages[0], root).includes('data:image/jpeg'));
assert.ok(!html(c, c.pages[3], root).includes('抽奖'), 'no lottery wording in defaults');

// --- custom pages/modules, escaping ---------------------------------------
c = load(); c.people.male = '测试称呼<&>'; c.address = '自定义地址';
c.navigation = [{id: 'custom', label: '自定义'}];
c.pages = [{id: 'custom', title: '定制', modules: [{type: 'hero'}, {type: 'links', items: [{title: '地点', note: '{{address}}'}]}, {type: 'frame', orientation: 'landscape'}, {type: 'form', fields: [{label: '备注', value: '<script>alert(1)</script>'}]}]}];
c = validate(c); const doc = html(c, c.pages[0], root);
assert.ok(doc.includes('自定义地址')); assert.ok(doc.includes('测试称呼&lt;&amp;&gt;'));
assert.ok(!doc.includes('<script>')); assert.ok(doc.includes('aspect-ratio:1.5'));

// --- existing guards -------------------------------------------------------
c = load(); c.pages[1].id = c.pages[0].id; assert.throws(() => validate(c));
c = load(); c.photos = {portrait: 'demo:portrait'}; assert.throws(() => html(validate(c), c.pages[0], root), /previewPhotos/);
c = load(); c.pages[0].modules.push({type: 'unimplemented'}); assert.throws(() => validate(c));
c = load(); c.theme = {accent: 'red;display:none'}; assert.throws(() => validate(c));

// --- locale: English output contains no Chinese ----------------------------
c = validate(load('template.en.json'));
for (const p of c.pages) assert.ok(!/[\u4e00-\u9fff]/.test(body(html(c, p, root))), `CJK leaked into en page ${p.id}`);
assert.ok(html(c, c.pages[0], root).includes('lang="en"'));
// every default string exists in both locales
assert.deepEqual(Object.keys(STRINGS.zh).sort(), Object.keys(STRINGS.en).sort());
// English defaults with an almost-empty config (modules rely purely on built-in copy)
c = validate({locale: 'en', pages: [{id: 'a', title: 'A', modules: [{type: 'hero'}, {type: 'timeline'}, {type: 'gallery'}, {type: 'signature'}, {type: 'form'}, {type: 'status'}, {type: 'ticket'}]}]});
assert.ok(!/[\u4e00-\u9fff]/.test(body(html(c, c.pages[0], root))), 'English defaults leaked Chinese');
throwsMsg(() => validate({locale: 'fr', pages: [{id: 'a', modules: []}]}), /locale/);

// --- strings override ------------------------------------------------------
c = validate({strings: {'timeline.title': '流程表', 'gallery.empty': 'No photos yet'}, pages: [{id: 'a', title: 'A', modules: [{type: 'timeline'}, {type: 'gallery'}]}]});
const sd = html(c, c.pages[0], root); assert.ok(sd.includes('流程表')); assert.ok(sd.includes('No photos yet'));
throwsMsg(() => validate({strings: {'nope.key': 'x'}, pages: [{id: 'a', modules: []}]}), /nope\.key/);
throwsMsg(() => validate({strings: {'hero.title': 5}, pages: [{id: 'a', modules: []}]}), /字符串|string/);

// --- navigation icon and label --------------------------------------------
c = validate({navigation: [{id: 'a', icon: '★'}, {id: 'b', label: 'B', icon: '☆'}], pages: [{id: 'a', title: 'Home', modules: []}, {id: 'b', title: 'Bee', modules: []}]});
const nd = html(c, c.pages[0], root); assert.ok(nd.includes('★') && nd.includes('☆') && nd.includes('Home'));
c = validate({pages: [{id: 'a', title: 'A', modules: []}]}); assert.ok(html(c, c.pages[0], root).includes('✉'), 'default icon fallback');
throwsMsg(() => validate({navigation: [{id: 'a', icon: 'toolong'}], pages: [{id: 'a', modules: []}]}), /icon/);

// --- validation messages point at the exact location ----------------------
const mk = mod => ({pages: [{id: 'home', title: 'H', modules: [mod]}]});
throwsMsg(() => validate(mk({type: 'story', lines: 'one string'})), /pages\[0\]\(home\)\.modules\[0\]\.lines/);
throwsMsg(() => validate(mk({type: 'timeline', items: [{time: {x: 1}}]})), /items\[0\]\.time/);
throwsMsg(() => validate(mk({type: 'frame', orientation: 'square'})), /orientation/);
throwsMsg(() => validate(mk({type: 'photo', ratio: '1.5'})), /ratio/);
throwsMsg(() => validate(mk({type: 'button', text: ['x']})), /\.text/);
throwsMsg(() => validate({pages: [{id: 'a', modules: [], title: 'x'}], navigation: [{id: 'zz'}]}), /navigation\[0\]/);
throwsMsg(() => validate({pages: 'nope'}), /pages/);

// --- photo handling --------------------------------------------------------
c = validate({photos: {hero: 'definitely-missing.jpg'}, pages: [{id: 'a', title: 'A', modules: [{type: 'photo', photo: 'hero'}]}]});
throwsMsg(() => html(c, c.pages[0], root), /hero.*(不存在|does not exist)/s);
c = validate({photos: {hero: 'https://example.com/a.jpg'}, pages: [{id: 'a', title: 'A', modules: [{type: 'photo', photo: 'hero'}]}]});
throwsMsg(() => html(c, c.pages[0], root), /远程|remote/);
warnings.clear();
c = validate({previewPhotos: true, photos: {portrait: 'demo:portrait'}, pages: [{id: 'a', title: 'A', modules: [{type: 'photo', photo: 'protrait'}]}]});
html(c, c.pages[0], root);
assert.ok([...warnings].some(w => w.includes('protrait')), 'typo in photo key should warn');


// --- secondary pages: link targets, parent highlight, back bar ------------
c = validate({navigation: [{id: 'a', label: 'A'}], pages: [
  {id: 'a', title: 'A', modules: [{type: 'links', items: [{title: 'Go', page: 'b'}, {title: 'Static'}]}]},
  {id: 'b', title: 'B', parent: 'a', modules: [{type: 'back'}, {type: 'back', label: 'Home', page: 'a'}]}]});
const la = html(c, c.pages[0], root), lb = html(c, c.pages[1], root);
assert.ok(la.includes('<a class="link" href="02-b.html">'), 'link with page becomes an anchor');
assert.ok(la.includes('<div class="link">'), 'link without page stays static');
assert.ok(lb.includes('class="active" href="01-a.html"'), 'parent tab is highlighted on a secondary page');
assert.ok(lb.includes('class="backbar" href="01-a.html"') && lb.includes('Home'), 'back bar links to parent / explicit page');
c = validate({locale: 'en', pages: [{id: 'a', title: 'A', modules: []}, {id: 'b', title: 'B', parent: 'a', modules: [{type: 'back'}]}]});
assert.ok(html(c, c.pages[1], root).includes('>Back<') || html(c, c.pages[1], root).includes('</span>Back</a>'), 'English back label');
throwsMsg(() => validate({pages: [{id: 'a', title: 'A', modules: [{type: 'links', items: [{title: 'x', page: 'nope'}]}]}]}), /items\[0\]\.page/);
throwsMsg(() => validate({pages: [{id: 'a', title: 'A', parent: 'ghost', modules: []}]}), /parent/);
throwsMsg(() => validate({pages: [{id: 'a', title: 'A', parent: 'a', modules: []}]}), /parent/);
const targets = o => Array.isArray(o) ? o.flatMap(targets) : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => k === 'page' && typeof v === 'string' ? [v] : targets(v)) : [];
for (const f of ['template.json', 'template.en.json', 'preview.json', 'preview.en.json']) {
  const t = validate(load(f)); const ids = new Set(t.pages.map(p => p.id));
  assert.equal(t.pages.length, 19, f + ' has 4 main + 15 secondary pages');
  const reached = new Set(targets(t.pages));
  for (const r of reached) assert.ok(ids.has(r), `${f}: link target ${r} exists`);
  const navIds = new Set(t.navigation.map(n => n.id));
  for (const p of t.pages) if (!navIds.has(p.id) && p.nav !== false) assert.ok(reached.has(p.id), `${f}: secondary page ${p.id} is reachable from a link`);
  for (const p of t.pages) assert.ok(typeof p.group === 'string' || navIds.has(p.id), `${f}: ${p.id} has a group`);
}

// --- secondary-page modules ------------------------------------------------
const pg = (modules, extra = {}) => validate({navigation: [{id: 'a', label: 'A'}], pages: [{id: 'a', title: 'A', modules}, {id: 'b', title: 'B', modules: [], ...extra}]});
c = pg([{type: 'panel', title: 'T', text: 'x\ny', actions: ['Go', 'Copy']}, {type: 'actions', inline: true, items: [{label: 'One'}, {label: 'Two', primary: true, page: 'b'}]}, {type: 'empty'}, {type: 'heart'}, {type: 'art', label: 'HOTEL'}]);
let md = html(c, c.pages[0], root);
assert.ok(md.includes('class="card panel"') && md.includes('class="pre">x\ny') && md.includes('>Copy</button>'), 'panel with action buttons');
assert.ok(md.includes('actions inline') && md.includes('<a class="primary" href="02-b.html">Two</a>'), 'inline actions with a link');
assert.ok(md.includes('empty-state') && md.includes('class="heart"') && md.includes('class="art"'), 'empty / heart / art');
c = pg([{type: 'form', title: '', page: 'b', fields: [{label: 'D', select: true, half: true}, {label: 'T', select: true, half: true}, {label: 'N', multiline: true}], button: 'Go'}, {type: 'button', text: 'B', page: 'b'}, {type: 'status', title: 'S', page: 'b'}, {type: 'cards', items: [{title: 'C', page: 'b'}]}, {type: 'gallery', title: '', filters: ['x', {label: 'y', page: 'b'}], items: [{photo: 'k', action: 'Save'}]}]);
md = html(c, c.pages[0], root);
assert.ok(md.includes('class="two"') && md.includes('input select') && !md.includes('<h2>'), 'form: half/select fields, no heading when title is empty');
assert.ok(md.includes('<a class="primary" href="02-b.html">Go</a>'), 'form submit links to a page');
assert.ok(md.includes('<a class="status" href="02-b.html">') && md.includes('<a class="card" href="02-b.html">') && md.includes('<a class="contents" href="02-b.html">'), 'status / cards / gallery filters can link');
assert.ok(md.includes('photo-btn') && !md.includes('<div class="filters"></div>'), 'gallery photo action');
c = pg([{type: 'gallery', filters: [], items: []}]); assert.ok(!html(c, c.pages[0], root).includes('class="filters"'), 'empty filters render no chip row');
c = pg([{type: 'splash'}], {nav: false});
assert.ok(html(c, c.pages[1], root).includes('<main class="bare">') && !html(c, c.pages[1], root).includes('<nav>'), 'nav:false removes the bottom navigation');
assert.ok(html(c, c.pages[0], root).includes('class="splash"') && html(c, c.pages[0], root).includes('<nav>'), 'pages keep navigation by default');
c = validate({locale: 'en', pages: [{id: 'a', title: 'A', modules: [{type: 'splash'}, {type: 'gate', stage: 'login'}, {type: 'gate', stage: 'answer'}, {type: 'empty'}, {type: 'heart'}, {type: 'art'}, {type: 'back'}]}]});
assert.ok(!/[\u4e00-\u9fff]/.test(body(html(c, c.pages[0], root))), 'English defaults of the new modules contain no Chinese');
c = validate({pages: [{id: 'a', title: 'A', modules: [{type: 'gate', stage: 'answer'}]}]});
assert.ok(html(c, c.pages[0], root).includes('gate-q') && html(c, c.pages[0], root).includes('class="answer"'), 'gate answer stage');
throwsMsg(() => pg([{type: 'gate', stage: 'maybe'}]), /stage/);
throwsMsg(() => validate({pages: [{id: 'a', title: 'A', modules: [{type: 'button', text: 'x', page: 'ghost'}]}]}), /modules\[0\]\.page/);
throwsMsg(() => validate({pages: [{id: 'a', title: 'A', modules: [{type: 'cards', items: [{title: 'x', page: 'ghost'}]}]}]}), /items\[0\]\.page/);
throwsMsg(() => validate({pages: [{id: 'a', title: 'A', modules: [{type: 'gallery', filters: [{label: 'x', page: 'ghost'}]}]}]}), /filters\[0\]\.page/);
throwsMsg(() => validate({pages: [{id: 'a', nav: 'no', modules: []}]}), /nav/);
throwsMsg(() => validate({pages: [{id: 'a', modules: [{type: 'form', fields: [{label: 'x', select: 'yes'}]}]}]}), /select/);

{ const pv = validate(load('preview.json')); const sp = pv.pages.find(p => p.id === 'opening').modules[0];
  assert.equal(sp.photo, 'opening'); assert.equal(pv.photos.opening, 'demo:opening');
  assert.ok(html(pv, pv.pages.find(p => p.id === 'opening'), root).includes('data:image/jpeg'), 'opening page embeds the bundled opening photo'); }
console.log('PASS: defaults, custom pages/modules, escaping, guards, locale (en has no CJK), strings override, nav icon/label, located validation errors, photo handling, secondary pages, link targets and the new detail/form/gate/splash modules.');
