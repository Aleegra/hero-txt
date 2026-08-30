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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
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
<meta name="description" content="${esc(products.length)} product websites, their hero headlines, and how that copy has changed over time.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FFD84D'/><rect x='14' y='38' width='72' height='10' fill='%23111'/><rect x='14' y='56' width='44' height='10' fill='%23111'/></svg>">
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
      <h1>The hero copy of<br><em>${products.length} products</em>,<br>in one place.</h1>
      <p>Your headline and sub-headline are the first thing anyone reads — they decide whether a visitor understands what you do, and whether they stay. This is a library of that copy, screenshotted from live product sites.</p>
      <p class="meta">Every entry keeps its <strong>three most recent</strong> versions, so you can watch positioning shift. Last updated <strong>${lastUpdated}</strong>.</p>
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

<script src="app.js"></script>
</body>
</html>
`;

const css = `:root{
  --cream:#FDF6E9;
  --ink:#111111;
  --muted:#6B6355;
  --line:#111111;
  --shadow:4px 4px 0 var(--line);
${categories.map((c, i) => `  --cat-${i}:${c.color};`).join('\n')}
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background:var(--cream);color:var(--ink);
  font-family:"DM Sans",system-ui,sans-serif;
  font-size:16px;line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit}

/* ---------- top bar ---------- */
.topbar{
  position:sticky;top:0;z-index:50;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:12px 24px;background:#FFD84D;border-bottom:3px solid var(--line);
}
.logo{
  display:flex;align-items:center;gap:10px;
  font-family:"Space Grotesk",sans-serif;font-weight:700;
  font-size:20px;letter-spacing:.02em;text-decoration:none;
}
.logo-mark{
  width:22px;height:22px;background:#FF9BC0;
  border:2px solid var(--line);transform:rotate(-8deg);display:inline-block;
}
.dot{color:#E4356E}
.topbar-right{display:flex;align-items:center;gap:12px}
#search{
  font:inherit;font-size:15px;padding:8px 14px;width:min(340px,45vw);
  background:#fff;border:2px solid var(--line);box-shadow:var(--shadow);
}
#search:focus{outline:none;transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--line)}
.gh{
  font-weight:700;font-size:14px;text-decoration:none;white-space:nowrap;
  padding:8px 14px;background:#fff;border:2px solid var(--line);box-shadow:var(--shadow);
}
.gh:hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--line)}

/* ---------- intro ---------- */
main{max-width:1280px;margin:0 auto;padding:0 24px 64px}
.intro{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:32px;
  align-items:start;padding:56px 0 40px;
}
.intro h1{
  font-family:"Space Grotesk",sans-serif;font-weight:700;
  font-size:clamp(34px,5.2vw,60px);line-height:1.03;letter-spacing:-.02em;
}
.intro h1 em{font-style:normal;background:#FFD84D;box-shadow:0 0 0 5px #FFD84D;border-radius:2px}
.intro p{max-width:60ch;margin-top:22px;font-size:17px;color:#33302B}
.intro .meta{font-size:15px;color:var(--muted)}
.intro-deco{display:grid;grid-template-columns:repeat(3,30px);gap:12px;padding-top:14px}
.chip{width:30px;height:30px;border:2px solid var(--line);box-shadow:3px 3px 0 var(--line)}
.c1{background:#FFD84D;transform:rotate(-6deg)}
.c2{background:#4DD8F5;transform:rotate(4deg)}
.c3{background:#FF9BC0;transform:rotate(-3deg)}
.c4{background:#A8D178;transform:rotate(5deg)}
.c5{background:#F5A06B;transform:rotate(-5deg)}
.c6{background:#B79BFF;transform:rotate(3deg)}

/* ---------- filters ---------- */
.filters{display:flex;flex-wrap:wrap;gap:10px;padding:8px 0 20px}
.filters button{
  font:inherit;font-weight:500;font-size:14px;cursor:pointer;
  display:flex;align-items:center;gap:8px;
  padding:7px 13px;background:#fff;color:var(--ink);
  border:2px solid var(--line);box-shadow:var(--shadow);
}
.filters button:hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--line)}
.filters button[aria-pressed=true]{background:var(--ink);color:var(--cream);box-shadow:none;transform:translate(2px,2px)}
.filters .swatch{width:12px;height:12px;border:1.5px solid var(--line);flex:none}
.filters button[aria-pressed=true] .swatch{border-color:var(--cream)}
.filters .n{opacity:.55;font-variant-numeric:tabular-nums}
.count{font-size:14px;color:var(--muted);padding-bottom:18px}

/* ---------- grid ---------- */
.grid{
  display:grid;gap:26px;
  grid-template-columns:repeat(auto-fill,minmax(330px,1fr));
}
.card{
  display:flex;flex-direction:column;cursor:pointer;
  background:#fff;border:2.5px solid var(--line);box-shadow:6px 6px 0 var(--line);
  transition:transform .12s,box-shadow .12s;
}
.card:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--line)}
.shot{
  position:relative;aspect-ratio:16/10;overflow:hidden;
  border-bottom:2.5px solid var(--line);background:#EEE;
}
.shot img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.badge{
  position:absolute;top:10px;left:10px;
  font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  padding:4px 8px;border:2px solid var(--line);box-shadow:2px 2px 0 var(--line);
}
.versions{
  position:absolute;top:10px;right:10px;background:#fff;
  font-size:11px;font-weight:700;padding:4px 8px;
  border:2px solid var(--line);box-shadow:2px 2px 0 var(--line);
}
.body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:9px;flex:1}
.name{
  font-family:"Space Grotesk",sans-serif;font-weight:700;font-size:14px;
  letter-spacing:.03em;text-transform:uppercase;color:var(--muted);
}
.headline{
  font-family:"Space Grotesk",sans-serif;font-weight:700;
  font-size:20px;line-height:1.2;letter-spacing:-.01em;
}
.sub{font-size:14.5px;color:#4A453D;line-height:1.5}
.card-foot{
  margin-top:auto;padding-top:12px;display:flex;justify-content:space-between;gap:10px;
  font-size:12.5px;color:var(--muted);border-top:1.5px dashed #D6CDB9;
}
.card-foot a{font-weight:700;text-decoration:none}
.card-foot a:hover{text-decoration:underline}
.empty{padding:48px 0;font-size:17px;color:var(--muted)}

/* ---------- modal ---------- */
.modal{
  position:fixed;inset:0;z-index:100;display:grid;place-items:center;
  padding:24px;background:rgba(17,17,17,.55);overflow:auto;
}
/* display:grid outranks the hidden attribute's own display:none. */
.modal[hidden]{display:none}
.modal-card{
  position:relative;width:min(880px,100%);max-height:90vh;overflow:auto;
  background:var(--cream);border:3px solid var(--line);box-shadow:10px 10px 0 var(--line);
  padding:30px;
}
.modal-close{
  position:absolute;top:14px;right:14px;cursor:pointer;font:inherit;font-weight:700;
  width:34px;height:34px;background:#FF9BC0;border:2px solid var(--line);box-shadow:3px 3px 0 var(--line);
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
.version p{font-size:15px;color:#4A453D;max-width:62ch}
.version img{
  width:100%;margin-top:16px;display:block;
  border:2.5px solid var(--line);box-shadow:5px 5px 0 var(--line);
}
.current{font-size:12px;font-weight:700;color:#1F7A4D;margin-left:8px}

footer{
  border-top:3px solid var(--line);background:#FFD84D;
  padding:26px 24px;font-size:14px;
}
footer p{max-width:1280px;margin:0 auto}

@media (max-width:720px){
  .intro{grid-template-columns:1fr}
  .intro-deco{grid-template-columns:repeat(6,26px)}
  .topbar{flex-wrap:wrap}
  .grid{grid-template-columns:1fr}
}
`;

const js = `let DATA, active = 'all', query = '';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

fetch('data.json').then((r) => r.json()).then((d) => { DATA = d; renderFilters(); render(); });

function catOf(id) { return DATA.categories.find((c) => c.id === id) || { name: id, color: '#ddd' }; }

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
    renderFilters();
    render();
  };
}

function render() {
  const list = DATA.products.filter(matches);
  const cat = active === 'all' ? null : catOf(active);
  $('#count').textContent = cat
    ? \`\${list.length} product\${list.length === 1 ? '' : 's'} — \${cat.blurb}\`
    : \`\${list.length} product\${list.length === 1 ? '' : 's'}\`;
  $('#empty').hidden = list.length > 0;

  $('#grid').innerHTML = list.map((p) => {
    const h = p.history[0];
    const c = catOf(p.category);
    return \`<article class="card" data-id="\${p.id}">
      <div class="shot">
        \${h.screenshot ? \`<img src="\${h.screenshot}" alt="\${esc(p.name)} hero section" loading="lazy" width="1440" height="900">\` : ''}
        <span class="badge" style="background:\${c.color}">\${esc(c.name)}</span>
        \${p.history.length > 1 ? \`<span class="versions">\${p.history.length} versions</span>\` : ''}
      </div>
      <div class="body">
        <div class="name">\${esc(p.name)}</div>
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
}

function openModal(id) {
  const p = DATA.products.find((x) => x.id === id);
  const c = catOf(p.category);
  $('#modal-body').innerHTML =
    \`<h2>\${esc(p.name)}</h2>
     <p class="url"><a href="\${esc(p.url)}" target="_blank" rel="noopener">\${esc(p.url)}</a> · \${esc(c.name)}</p>\` +
    p.history.map((h, i) => \`<div class="version">
        <span class="version-date" style="background:\${c.color}">\${esc(h.date)}</span>\${i === 0 ? '<span class="current">CURRENT</span>' : ''}
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

$('#search').oninput = (e) => { query = e.target.value.trim().toLowerCase(); render(); };
`;

writeFileSync(join(DIST, 'index.html'), html);
writeFileSync(join(DIST, 'styles.css'), css);
writeFileSync(join(DIST, 'app.js'), js);

console.log(`dist/: ${products.length} products, ${categories.length} categories, updated ${lastUpdated}`);
