// Builds the static site into dist/. No framework: the whole thing is a
// filterable gallery over one JSON file, so a bundler would be pure overhead.
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  rmSync,
  cpSync,
  existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
// Deploying through Actions replaces the whole site, and GitHub reads the
// custom domain back out of this file. Without it the domain setting gets
// cleared on a deploy and the site starts 404ing at its own address.
const DOMAIN = 'www.herotxt.page';
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const categories = read('data/categories.json');
const products = readdirSync(join(ROOT, 'data/products'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(`data/products/${f}`))
  .filter((p) => p.history.length && p.history[0].headline)
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
const lastUpdated = products
  .map((p) => p.history[0].date)
  .sort()
  .at(-1);

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
if (existsSync(join(ROOT, 'shots')))
  cpSync(join(ROOT, 'shots'), join(DIST, 'shots'), { recursive: true });

writeFileSync(join(DIST, 'CNAME'), DOMAIN + '\n');
writeFileSync(
  join(DIST, 'data.json'),
  JSON.stringify({ categories, products, lastUpdated })
);

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>hero-txt — a library of real hero-section copy</title>
<meta name="description" content="The headline earns the second line. The sub-headline earns the scroll. Here are both, from ${esc(products.length)} live product sites, screenshotted and refreshed weekly.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="__CSS__">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%232F5BFF'/><rect x='14' y='38' width='72' height='10' fill='%23FF2E88'/><rect x='14' y='56' width='44' height='10' fill='%23FFFFFF'/></svg>">
</head>
<body>

<header class="topbar">
  <a class="logo" href="./"><span class="logo-mark"></span>HERO<span class="dot">·</span>TXT</a>
  <div class="topbar-right">
    <input id="search" type="search" placeholder="Search headlines, products…" autocomplete="off" spellcheck="false">
    <a class="gh" href="https://github.com/Aleegra/hero-txt" target="_blank" rel="noopener">GitHub ↗</a>
  </div>
</header>

<main>
  <section class="intro">
    <div class="intro-text">
      <h1>How your <em>top competitors</em> attract<br>your target audience</h1>
      <p>The headline earns the second line. The sub-headline earns the scroll. Here are both, from ${products.length} live product sites, screenshotted and refreshed weekly, so every repositioning is on the record.</p>
      <p class="meta">${products.length} products · ${categories.length} categories · last updated ${lastUpdated}</p>
    </div>
    <div class="intro-deco" aria-hidden="true">
      <span class="chip c1"></span><span class="chip c2"></span><span class="chip c3"></span>
      <span class="chip c4"></span><span class="chip c5"></span><span class="chip c6"></span>
    </div>
  </section>

  <nav class="filters" id="filters"></nav>
  <p class="count" id="count"></p>
  <section class="grid" id="grid"></section>
  <p class="empty" id="empty" hidden>Nothing matches that search.</p>
  <nav class="pager" id="pager" aria-label="Pagination"></nav>
</main>

<footer>
  <p>Built from <a href="https://github.com/Aleegra/hero-txt">github.com/Aleegra/hero-txt</a>. Screenshots belong to their respective owners and are shown here for reference and commentary.</p>
</footer>

<div class="modal" id="modal" hidden>
  <div class="modal-card" role="dialog" aria-modal="true">
    <button class="modal-close" id="modal-close" aria-label="Close">✕</button>
    <div id="modal-body"></div>
  </div>
</div>

<script src="__JS__"></script>
</body>
</html>
`;

const css = `:root{
  --bg:#F3F6FF;
  --ink:#15152E;
  --muted:#6E7191;
  --line:#15152E;
  --blue:#2F5BFF;
  --blue-soft:#CFDBFF;
  --pink:#FF2E88;
  --pink-soft:#FFD3E4;
  --shadow:4px 4px 0 var(--line);
${categories.map((c, i) => `  --cat-${i}:${c.color};`).join('\n')}
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background:var(--bg);color:var(--ink);
  font-family:"DM Sans",system-ui,sans-serif;
  font-size:16px;line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit}

/* ---------- top bar ---------- */
.topbar{
  position:sticky;top:0;z-index:50;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:12px 24px;background:var(--blue);color:#fff;border-bottom:3px solid var(--line);
}
.logo{
  display:flex;align-items:center;gap:10px;
  font-family:"Space Grotesk",sans-serif;font-weight:700;
  font-size:20px;letter-spacing:.02em;text-decoration:none;
}
.logo-mark{
  width:22px;height:22px;background:var(--pink);
  border:2px solid var(--line);transform:rotate(-8deg);display:inline-block;
}
.dot{color:var(--pink-soft)}
.topbar-right{display:flex;align-items:center;gap:12px}
#search{
  font:inherit;font-size:15px;padding:8px 14px;width:min(340px,45vw);color:var(--ink);
  background:#fff;border:2px solid var(--line);box-shadow:var(--shadow);
}
#search:focus{outline:none;transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--line)}
.gh{
  /* Colour is set explicitly: the bar is white-on-blue, and these sit on white. */
  font-weight:700;font-size:14px;text-decoration:none;white-space:nowrap;color:var(--ink);
  padding:8px 14px;background:#fff;border:2px solid var(--line);box-shadow:var(--shadow);
}
.gh:hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--line)}

/* ---------- intro ---------- */
main{max-width:1400px;margin:0 auto;padding:0 24px 64px}
.intro{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:32px;
  align-items:start;padding:56px 0 40px;
}
.intro h1{
  font-family:"Space Grotesk",sans-serif;font-weight:700;
  /* The highlight behind <em> is a 5px box-shadow spread, so a tight
     line-height makes it collide with the line below. */
  font-size:clamp(34px,4.6vw,56px);line-height:1.24;letter-spacing:-.02em;
}
.intro h1 em{font-style:normal;background:var(--pink-soft);box-shadow:0 0 0 5px var(--pink-soft);border-radius:2px}
.intro p{max-width:60ch;margin-top:22px;font-size:17px;color:#2B2B45}
.intro .meta{font-size:15px;color:var(--muted)}
.intro-deco{display:grid;grid-template-columns:repeat(3,30px);gap:12px;padding-top:14px}
.chip{width:30px;height:30px;border:2px solid var(--line);box-shadow:3px 3px 0 var(--line)}
.c1{background:var(--pink);transform:rotate(-6deg)}
.c2{background:var(--blue-soft);transform:rotate(4deg)}
.c3{background:var(--pink-soft);transform:rotate(-3deg)}
.c4{background:var(--blue);transform:rotate(5deg)}
.c5{background:#B388FF;transform:rotate(-5deg)}
.c6{background:#5BD1F0;transform:rotate(3deg)}

/* ---------- filters ---------- */
.filters{display:flex;flex-wrap:wrap;gap:10px;padding:8px 0 20px}
.filters button{
  font:inherit;font-weight:500;font-size:14px;cursor:pointer;
  display:flex;align-items:center;gap:8px;
  padding:7px 13px;background:#fff;color:var(--ink);
  border:2px solid var(--line);box-shadow:var(--shadow);
}
.filters button:hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--line)}
.filters button[aria-pressed=true]{background:var(--ink);color:#fff;box-shadow:none;transform:translate(2px,2px)}
.filters .swatch{width:12px;height:12px;border:1.5px solid var(--line);flex:none}
.filters button[aria-pressed=true] .swatch{border-color:#fff}
.filters .n{opacity:.55;font-variant-numeric:tabular-nums}
.count{font-size:14px;color:var(--muted);padding-bottom:18px}

/* ---------- grid ---------- */
/* Fixed 4 columns so a page is always a tidy 4x3 block of 12. */
.grid{
  display:grid;gap:24px;
  grid-template-columns:repeat(4,minmax(0,1fr));
}
.card{
  display:flex;flex-direction:column;cursor:pointer;
  background:#fff;border:2.5px solid var(--line);box-shadow:6px 6px 0 var(--line);
  transition:transform .12s,box-shadow .12s;
}
.card:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--line)}
.shot{
  position:relative;aspect-ratio:16/10;overflow:hidden;
  border-bottom:2.5px solid var(--line);background:var(--blue-soft);
}
.shot img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.badge{
  font-size:10.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;
  padding:3px 7px;border:2px solid var(--line);
  /* Category names run long; shrink and ellipsise rather than push the row wide. */
  min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.versions{
  position:absolute;top:10px;right:10px;background:#fff;
  font-size:11px;font-weight:700;padding:4px 8px;
  border:2px solid var(--line);box-shadow:2px 2px 0 var(--line);
}
.body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:9px;flex:1}
.name-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.name{
  font-family:"Space Grotesk",sans-serif;font-weight:700;font-size:14px;
  letter-spacing:.03em;text-transform:uppercase;color:var(--muted);flex:none;
}
.headline{
  font-family:"Space Grotesk",sans-serif;font-weight:700;
  font-size:19px;line-height:1.2;letter-spacing:-.01em;
}
.sub{font-size:14px;color:#454565;line-height:1.5}
.card-foot{
  margin-top:auto;padding-top:12px;display:flex;justify-content:space-between;gap:10px;
  font-size:12.5px;color:var(--muted);border-top:1.5px dashed #C9D3F0;
}
.card-foot a{font-weight:700;text-decoration:none}
.card-foot a:hover{text-decoration:underline}
.empty{padding:48px 0;font-size:17px;color:var(--muted)}

/* ---------- pager ---------- */
.pager{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:36px 0 0}
.pager button{
  font:inherit;font-weight:700;font-size:14px;cursor:pointer;
  min-width:40px;padding:7px 12px;background:#fff;color:var(--ink);
  border:2px solid var(--line);box-shadow:var(--shadow);
}
.pager button:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--line)}
.pager button[aria-current=page]{background:var(--pink);color:#fff;box-shadow:none;transform:translate(2px,2px)}
.pager button:disabled{opacity:.35;cursor:default;box-shadow:none;transform:translate(2px,2px)}

/* ---------- modal ---------- */
.modal{
  position:fixed;inset:0;z-index:100;display:grid;place-items:center;
  padding:24px;background:rgba(17,17,17,.55);overflow:auto;
}
/* display:grid outranks the hidden attribute's own display:none. */
.modal[hidden]{display:none}
.modal-card{
  position:relative;width:min(880px,100%);max-height:90vh;overflow:auto;
  background:var(--bg);border:3px solid var(--line);box-shadow:10px 10px 0 var(--line);
  padding:30px;
}
.modal-close{
  position:absolute;top:14px;right:14px;cursor:pointer;font:inherit;font-weight:700;
  width:34px;height:34px;background:var(--pink-soft);border:2px solid var(--line);box-shadow:3px 3px 0 var(--line);
}
.modal-close:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--line)}
.modal h2{font-family:"Space Grotesk",sans-serif;font-size:28px;letter-spacing:-.01em}
.modal .url{font-size:14px;color:var(--muted);word-break:break-all}
.version{margin-top:26px;padding-top:22px;border-top:2px solid var(--line)}
.version:first-of-type{border-top:none}
.version-date{
  display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;
  letter-spacing:.04em;padding:3px 9px;margin-bottom:12px;
  border:2px solid var(--line);box-shadow:2px 2px 0 var(--line);
}
.version h3{font-family:"Space Grotesk",sans-serif;font-size:22px;line-height:1.22;margin-bottom:8px}
.version p{font-size:15px;color:#454565;max-width:62ch}
.version img{
  width:100%;margin-top:16px;display:block;
  border:2.5px solid var(--line);box-shadow:5px 5px 0 var(--line);
}
.current{font-size:12px;font-weight:700;color:var(--pink);margin-left:8px}

footer{
  border-top:3px solid var(--line);background:var(--pink-soft);
  padding:26px 24px;font-size:14px;
}
footer p{max-width:1400px;margin:0 auto}

@media (max-width:1180px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:720px){
  .intro{grid-template-columns:1fr}
  .intro-deco{grid-template-columns:repeat(6,26px)}
  .topbar{flex-wrap:wrap}
}
@media (max-width:620px){.grid{grid-template-columns:1fr}}
`;

const js = `const PAGE_SIZE = 12;
let DATA, active = 'all', query = '', page = 1;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

fetch('data.json').then((r) => r.json()).then((d) => { DATA = d; renderFilters(); render(); });

function catOf(id) { return DATA.categories.find((c) => c.id === id) || { name: id, color: '#ddd' }; }

// Category colours span pale pink to navy, so a fixed ink-on-colour label is
// unreadable at the dark end. Pick the text colour from the swatch instead.
function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#15152E' : '#FFFFFF';
}

function matches(p) {
  if (active !== 'all' && p.category !== active) return false;
  if (!query) return true;
  const h = p.history[0];
  return (p.name + ' ' + h.headline + ' ' + h.subheadline + ' ' + catOf(p.category).name)
    .toLowerCase().includes(query);
}

function renderFilters() {
  const counts = {};
  for (const p of DATA.products) counts[p.category] = (counts[p.category] || 0) + 1;
  const btn = (id, label, color, n) =>
    \`<button data-cat="\${id}" aria-pressed="\${active === id}">\` +
    (color ? \`<span class="swatch" style="background:\${color}"></span>\` : '') +
    \`\${esc(label)} <span class="n">\${n}</span></button>\`;

  $('#filters').innerHTML =
    btn('all', 'All', '', DATA.products.length) +
    DATA.categories.filter((c) => counts[c.id])
      .map((c) => btn(c.id, c.name, c.color, counts[c.id])).join('');

  $('#filters').onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    active = b.dataset.cat;
    page = 1;
    renderFilters();
    render();
  };
}

function render() {
  const all = DATA.products.filter(matches);
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  if (page > pages) page = pages;
  const list = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cat = active === 'all' ? null : catOf(active);
  const total = \`\${all.length} product\${all.length === 1 ? '' : 's'}\`;
  $('#count').textContent =
    (cat ? \`\${total} — \${cat.blurb}\` : total) + (pages > 1 ? \`  ·  page \${page} of \${pages}\` : '');
  $('#empty').hidden = all.length > 0;

  $('#grid').innerHTML = list.map((p) => {
    const h = p.history[0];
    const c = catOf(p.category);
    return \`<article class="card" data-id="\${p.id}">
      <div class="shot">
        \${h.screenshot ? \`<img src="\${h.screenshot}" alt="\${esc(p.name)} hero section" loading="lazy" width="1440" height="900">\` : ''}
        \${p.history.length > 1 ? \`<span class="versions">\${p.history.length} versions</span>\` : ''}
      </div>
      <div class="body">
        <div class="name-row">
          <div class="name">\${esc(p.name)}</div>
          <span class="badge" style="background:\${c.color};color:\${textOn(c.color)}" title="\${esc(c.name)}">\${esc(c.short || c.name)}</span>
        </div>
        <div class="headline">\${esc(h.headline)}</div>
        \${h.subheadline ? \`<div class="sub">\${esc(h.subheadline)}</div>\` : ''}
        <div class="card-foot">
          <span>Updated \${esc(h.date)}</span>
          <a href="\${esc(p.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Visit ↗</a>
        </div>
      </div>
    </article>\`;
  }).join('');

  $('#grid').onclick = (e) => {
    const card = e.target.closest('.card');
    if (card) openModal(card.dataset.id);
  };

  renderPager(pages);
}

function renderPager(pages) {
  const el = $('#pager');
  // 87 products at 12 a page tops out around 8 buttons, so no ellipsis logic.
  el.innerHTML = pages < 2 ? '' :
    \`<button data-go="\${page - 1}" \${page === 1 ? 'disabled' : ''}>← Prev</button>\` +
    Array.from({ length: pages }, (_, i) =>
      \`<button data-go="\${i + 1}" \${page === i + 1 ? 'aria-current="page"' : ''}>\${i + 1}</button>\`).join('') +
    \`<button data-go="\${page + 1}" \${page === pages ? 'disabled' : ''}>Next →</button>\`;

  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    page = Number(b.dataset.go);
    render();
    // Land on the first card rather than wherever the old page was scrolled to.
    $('#grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

function openModal(id) {
  const p = DATA.products.find((x) => x.id === id);
  const c = catOf(p.category);
  $('#modal-body').innerHTML =
    \`<h2>\${esc(p.name)}</h2>
     <p class="url"><a href="\${esc(p.url)}" target="_blank" rel="noopener">\${esc(p.url)}</a> · \${esc(c.name)}</p>\` +
    p.history.map((h, i) => \`<div class="version">
        <span class="version-date" style="background:\${c.color};color:\${textOn(c.color)}">\${esc(h.date)}</span>\${i === 0 ? '<span class="current">CURRENT</span>' : ''}
        <h3>\${esc(h.headline)}</h3>
        \${h.subheadline ? \`<p>\${esc(h.subheadline)}</p>\` : ''}
        \${h.screenshot ? \`<img src="\${h.screenshot}" alt="\${esc(p.name)} hero on \${esc(h.date)}" loading="lazy">\` : ''}
      </div>\`).join('');
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal').hidden = true;
  document.body.style.overflow = '';
}
$('#modal-close').onclick = closeModal;
$('#modal').onclick = (e) => { if (e.target.id === 'modal') closeModal(); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

$('#search').oninput = (e) => { query = e.target.value.trim().toLowerCase(); page = 1; render(); };
`;

// index.html is served uncached but the CDN in front of the site holds CSS and
// JS for four hours, so a deploy hands visitors new markup with stale styles.
// Naming these by content hash means an edit produces a new URL and there is
// never a same-named old copy to serve.
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);
const cssFile = `styles.${hash(css)}.css`;
const jsFile = `app.${hash(js)}.js`;

writeFileSync(join(DIST, cssFile), css);
writeFileSync(join(DIST, jsFile), js);
writeFileSync(
  join(DIST, 'index.html'),
  html.replace('__CSS__', cssFile).replace('__JS__', jsFile)
);

console.log(
  `dist/: ${products.length} products, ${categories.length} categories, updated ${lastUpdated} (${cssFile}, ${jsFile})`
);
