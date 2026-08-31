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
if (existsSync(join(ROOT, 'assets')))
  cpSync(join(ROOT, 'assets'), join(DIST, 'assets'), { recursive: true });

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
<title>Track Your Competitors Reposition | Hero Section Library</title>
<meta name="description" content="The headline earns the second line. The sub-headline earns the scroll. Here are both, from ${esc(products.length)} live product sites, screenshotted and refreshed weekly.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="__CSS__">
<link rel="icon" type="image/png" sizes="32x32" href="./assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="512x512" href="./assets/favicon-512.png">
<link rel="apple-touch-icon" href="./assets/favicon-180.png">
</head>
<body>

<header class="topbar">
  <a class="logo" href="./"><img class="logo-mark" src="./assets/favicon-512.png" alt="">Hero Section Library</a>
  <div class="topbar-right">
    <input id="search" type="search" placeholder="Search headlines, products…" autocomplete="off" spellcheck="false">
    <a class="gh" href="https://github.com/Aleegra/hero-txt" target="_blank" rel="noopener">GitHub ↗</a>
  </div>
</header>

<main>
  <section class="intro">
    <div class="intro-text">
      <h1>How your <em>top competitors</em> attract<br>your target audience</h1>
      <p>The headline earns the second line. The sub-headline earns the scroll.<br>Here are both, from ${products.length} live product sites, screenshotted and refreshed weekly,<br>so every repositioning is on the record.</p>
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
  /* Tinted blue rather than near-white, so the white cards read as objects
     sitting on the page instead of dissolving into it. */
  --bg:#EFF4FD;
  --surface:#FFFFFF;
  --ink:#16161D;
  --muted:#6B7085;
  /* Hairlines instead of the old 2px black outlines. At twelve cards a page the
     heavy borders and hard offset shadows stacked into a very loud grid. */
  --line:#E9E9F0;
  --line-strong:#DCDCE6;
  --blue:#4C6FFF;
  --blue-soft:#EEF2FF;
  --pink:#FF4D8D;
  --pink-soft:#FFE6F0;
  --r:12px;
  --r-sm:8px;
  --r-pill:999px;
  --shadow-sm:0 1px 2px rgba(22,22,45,.05),0 1px 3px rgba(22,22,45,.04);
  --shadow-md:0 4px 14px rgba(22,22,45,.07),0 1px 3px rgba(22,22,45,.05);
  --shadow-lg:0 16px 40px rgba(22,22,45,.14),0 3px 10px rgba(22,22,45,.07);
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
  padding:12px 24px;color:var(--ink);
  /* Translucent rather than a solid blue slab: the bar stays legible while the
     grid scrolls under it, and it stops competing with the cards for attention. */
  background:rgba(239,244,253,.82);backdrop-filter:blur(12px);
  border-bottom:1px solid var(--line);
}
.logo{
  display:flex;align-items:center;gap:10px;
  font-family:"Space Grotesk",sans-serif;font-weight:700;
  font-size:20px;letter-spacing:-.01em;text-decoration:none;
}
.logo-mark{
  /* The 512 source rather than the 32: this renders at 44 device pixels on a
     retina screen, and the small file's bars come out visibly soft. */
  width:22px;height:22px;border-radius:6px;display:block;
}
.topbar-right{display:flex;align-items:center;gap:10px}
#search{
  font:inherit;font-size:14.5px;padding:8px 14px;width:min(340px,45vw);color:var(--ink);
  background:var(--surface);border:1px solid var(--line-strong);
  border-radius:var(--r-pill);box-shadow:var(--shadow-sm);
  transition:border-color .15s,box-shadow .15s;
}
#search::placeholder{color:#A2A5B8}
#search:focus{
  outline:none;border-color:var(--blue);
  box-shadow:0 0 0 3px rgba(76,111,255,.14);
}
.gh{
  font-weight:600;font-size:14px;text-decoration:none;white-space:nowrap;color:var(--ink);
  padding:8px 14px;background:var(--surface);border:1px solid var(--line-strong);
  border-radius:var(--r-pill);box-shadow:var(--shadow-sm);
  transition:border-color .15s,box-shadow .15s;
}
.gh:hover{border-color:#C4C4D2;box-shadow:var(--shadow-md)}

/* ---------- intro ---------- */
main{max-width:1400px;margin:0 auto;padding:0 24px 64px}
.intro{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:32px;
  align-items:start;padding:56px 0 40px;
}
.intro h1{
  font-family:"Space Grotesk",sans-serif;font-weight:700;
  font-size:clamp(34px,4.6vw,56px);line-height:1.14;letter-spacing:-.025em;
}
/* An underline band rather than a padded block, so the highlight can never
   overlap the line beneath it however tight the leading is. */
.intro h1 em{font-style:normal;background:linear-gradient(transparent 62%,#FF8DA1 62%)}
.intro p{max-width:60ch;margin-top:22px;font-size:17px;color:#3A3A52}
.intro .meta{font-size:15px;color:var(--muted)}
.intro-deco{display:grid;grid-template-columns:repeat(3,30px);gap:10px;padding-top:14px}
.chip{width:30px;height:30px;border-radius:9px;box-shadow:var(--shadow-sm)}
.c1{background:var(--pink)}
/* Not --blue-soft: on the tinted blue page it is the same colour as the
   background and the chip disappears. */
.c2{background:#C3D4FF}
.c3{background:var(--pink-soft)}
.c4{background:var(--blue)}
.c5{background:#B388FF}
.c6{background:#5BD1F0}

/* ---------- filters ---------- */
/* One flat wrap of sixteen pills read as noise. The categories already carry a
   "group" field, so each group gets its own labelled row and the eye has
   somewhere to rest between them. */
.filters{display:flex;flex-direction:column;gap:14px;padding:4px 0 24px}
.filter-group{display:flex;align-items:flex-start;gap:16px}
.filter-label{
  /* Wide enough that the longest group name ("Cloud & DevOps") stays on one line. */
  flex:none;width:124px;padding-top:7px;
  font-size:11px;font-weight:600;letter-spacing:.08em;
  text-transform:uppercase;color:#9A9DB0;
}
.filter-row{display:flex;flex-wrap:wrap;gap:8px;flex:1;min-width:0}
.filters button{
  font:inherit;font-weight:500;font-size:13.5px;cursor:pointer;
  display:flex;align-items:center;gap:7px;
  padding:6px 13px;background:var(--surface);color:var(--ink);
  border:1px solid var(--line-strong);border-radius:var(--r-pill);
  transition:background .15s,border-color .15s,color .15s;
}
.filters button:hover{background:#F4F4F8;border-color:#C9C9D8}
.filters button[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}
.filters .swatch{width:9px;height:9px;border-radius:50%;flex:none}
.filters .n{opacity:.5;font-size:12.5px;font-variant-numeric:tabular-nums}
.count{font-size:14px;color:var(--muted);padding-bottom:18px}

/* ---------- grid ---------- */
/* Fixed 4 columns so a page is always a tidy 4x3 block of 12. */
.grid{
  display:grid;gap:24px;
  grid-template-columns:repeat(4,minmax(0,1fr));
}
.card{
  display:flex;flex-direction:column;cursor:pointer;overflow:hidden;
  background:var(--surface);border:1px solid var(--line);
  border-radius:var(--r);box-shadow:var(--shadow-sm);
  transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
}
.card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:var(--line-strong)}
/* Presses in under the cursor, so the click that opens the modal is acknowledged
   before the modal itself arrives. */
.card:active{transform:translateY(-1px) scale(.994);box-shadow:var(--shadow-md);transition-duration:.06s}
.shot{
  position:relative;aspect-ratio:16/10;overflow:hidden;
  border-bottom:1px solid var(--line);background:var(--blue-soft);
}
.shot img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.badge{
  font-size:10.5px;font-weight:600;letter-spacing:.02em;
  padding:3px 9px;border-radius:var(--r-pill);
  /* Category names run long; shrink and ellipsise rather than push the row wide. */
  min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.versions{
  position:absolute;top:10px;right:10px;
  background:rgba(255,255,255,.9);backdrop-filter:blur(6px);color:var(--muted);
  font-size:11px;font-weight:600;padding:3px 9px;
  border-radius:var(--r-pill);box-shadow:var(--shadow-sm);
}
.body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:9px;flex:1}
.name-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.name{
  font-family:"Space Grotesk",sans-serif;font-weight:600;font-size:13px;
  letter-spacing:.06em;text-transform:uppercase;color:var(--muted);flex:none;
}
.headline{
  font-family:"Space Grotesk",sans-serif;font-weight:700;
  font-size:19px;line-height:1.22;letter-spacing:-.015em;
}
.sub{font-size:14px;color:#5A5A74;line-height:1.5}
.card-foot{
  margin-top:auto;padding-top:12px;display:flex;justify-content:space-between;gap:10px;
  font-size:12.5px;color:var(--muted);border-top:1px solid var(--line);
}
.card-foot a{font-weight:600;text-decoration:none;color:var(--blue)}
.card-foot a:hover{text-decoration:underline}
.empty{padding:48px 0;font-size:17px;color:var(--muted)}

/* ---------- pager ---------- */
.pager{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:36px 0 0}
.pager button{
  font:inherit;font-weight:600;font-size:14px;cursor:pointer;
  min-width:38px;padding:7px 12px;background:var(--surface);color:var(--ink);
  border:1px solid var(--line-strong);border-radius:var(--r-sm);
  transition:background .15s,border-color .15s;
}
.pager button:hover:not(:disabled){background:#F4F4F8;border-color:#C9C9D8}
.pager button[aria-current=page]{background:var(--ink);color:#fff;border-color:var(--ink)}
.pager button:disabled{opacity:.4;cursor:default}

/* ---------- modal ---------- */
.modal{
  position:fixed;inset:0;z-index:100;display:grid;place-items:center;
  padding:24px;background:rgba(22,22,45,.4);backdrop-filter:blur(4px);overflow:auto;
  opacity:0;transition:opacity .14s ease-in;
}
/* display:grid outranks the hidden attribute's own display:none. */
.modal[hidden]{display:none}
.modal.open{opacity:1;transition:opacity .2s ease-out}
.modal-card{
  position:relative;width:min(880px,100%);max-height:90vh;overflow:auto;
  background:var(--surface);border:1px solid var(--line);
  border-radius:16px;box-shadow:var(--shadow-lg);padding:32px;
  /* Resting state doubles as the exit state: short, ease-in, no overshoot, so
     dismissing feels immediate rather than like the entrance played backwards. */
  /* Mostly scale, barely any travel: the card should look like it pops toward you,
     not like it slides up from below. */
  transform:translateY(6px) scale(.92);opacity:0;
  transition:transform .14s ease-in,opacity .14s ease-in;
}
.modal.open .modal-card{
  transform:none;opacity:1;
  /* Back-out curve — shoots past full size and springs back. Short duration and a
     faster opacity ramp so the card is already visible while it is still expanding;
     fading in over the whole motion is what made it read as a gentle ease. */
  transition:transform .28s cubic-bezier(.34,1.56,.64,1),opacity .12s ease-out;
}
@media (prefers-reduced-motion:reduce){
  .modal,.modal.open,.modal-card,.modal.open .modal-card{transition:none}
}
.modal-close{
  position:absolute;top:16px;right:16px;cursor:pointer;font:inherit;font-weight:600;
  width:32px;height:32px;color:var(--muted);
  background:var(--surface);border:1px solid var(--line-strong);border-radius:50%;
  transition:background .15s,color .15s;
}
.modal-close:hover{background:#F4F4F8;color:var(--ink)}
.modal h2{font-family:"Space Grotesk",sans-serif;font-size:28px;letter-spacing:-.02em}
.modal .url{font-size:14px;color:var(--muted);word-break:break-all}
.version{margin-top:28px;padding-top:24px;border-top:1px solid var(--line)}
.version:first-of-type{border-top:none}
.version-date{
  display:inline-block;font-size:11.5px;font-weight:600;
  letter-spacing:.04em;padding:3px 10px;margin-bottom:12px;
  border-radius:var(--r-pill);
}
.version h3{font-family:"Space Grotesk",sans-serif;font-size:22px;line-height:1.24;margin-bottom:8px}
.version p{font-size:15px;color:#5A5A74;max-width:62ch}
.version img{
  width:100%;margin-top:16px;display:block;
  border:1px solid var(--line);border-radius:var(--r-sm);box-shadow:var(--shadow-md);
}
.current{font-size:12px;font-weight:600;color:var(--pink);margin-left:8px}

footer{
  border-top:1px solid var(--line);background:var(--surface);
  padding:26px 24px;font-size:14px;color:var(--muted);
}
footer p{max-width:1400px;margin:0 auto}

@media (max-width:1180px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:720px){
  .intro{grid-template-columns:1fr}
  .intro-deco{grid-template-columns:repeat(6,26px)}
  .topbar{flex-wrap:wrap}
  /* The label gutter costs too much of a narrow screen: stack instead. */
  .filter-group{flex-direction:column;gap:8px}
  .filter-label{width:auto;padding-top:0}
}
@media (max-width:620px){.grid{grid-template-columns:1fr}}
`;

const js = `const PAGE_SIZE = 12;
let DATA, active = 'all', query = '', page = 1;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

fetch('data.json').then((r) => r.json()).then((d) => { DATA = d; renderFilters(); render(); });

function catOf(id) { return DATA.categories.find((c) => c.id === id) || { name: id, color: '#ddd' }; }

// Category colours span pale pink to navy. Filling a label with the raw colour
// meant some badges came out white-on-dark and others black-on-pale, which made
// a grid of twelve look scattered. Every label now gets the same treatment: a
// heavily lightened tint behind text of the same hue, darkened until it reads.
function tag(hex) {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [n >> 16, (n >> 8) & 255, n & 255];
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  // Darken by however much this particular hue needs, not a fixed amount: the
  // navy is already dark enough, the pale pink needs halving.
  // 0.30 rather than a rounder number: it is the point at which the lightest
  // category (K8s & FinOps) clears WCAG AA against its own tint.
  const k = Math.min(1, 0.3 / lum);
  const tint = rgb.map((v) => Math.round(v + (255 - v) * 0.87)).join(',');
  const text = rgb.map((v) => Math.round(v * k)).join(',');
  return \`background:rgb(\${tint});color:rgb(\${text})\`;
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
  const btn = (id, label, title, color, n) =>
    \`<button data-cat="\${id}" title="\${esc(title)}" aria-pressed="\${active === id}">\` +
    (color ? \`<span class="swatch" style="background:\${color}"></span>\` : '') +
    \`\${esc(label)} <span class="n">\${n}</span></button>\`;

  const row = (label, buttons) =>
    \`<div class="filter-group"><span class="filter-label">\${esc(label)}</span>\` +
    \`<div class="filter-row">\${buttons}</div></div>\`;

  // Group in the order the groups first appear in categories.json rather than
  // alphabetically, so the file stays the single place that decides the order.
  const shown = DATA.categories.filter((c) => counts[c.id]);
  const groups = [];
  for (const c of shown) {
    let g = groups.find((x) => x.name === c.group);
    if (!g) groups.push((g = { name: c.group, cats: [] }));
    g.cats.push(c);
  }

  $('#filters').innerHTML =
    row('Browse', btn('all', 'All products', 'Every product in the library', '', DATA.products.length)) +
    groups.map((g) =>
      // short labels keep the pills to a scannable width; the full name is the tooltip
      row(g.name, g.cats.map((c) => btn(c.id, c.short || c.name, c.name, c.color, counts[c.id])).join(''))
    ).join('');

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
          <span class="badge" style="\${tag(c.color)}" title="\${esc(c.name)}">\${esc(c.short || c.name)}</span>
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
        <span class="version-date" style="\${tag(c.color)}">\${esc(h.date)}</span>\${i === 0 ? '<span class="current">CURRENT</span>' : ''}
        <h3>\${esc(h.headline)}</h3>
        \${h.subheadline ? \`<p>\${esc(h.subheadline)}</p>\` : ''}
        \${h.screenshot ? \`<img src="\${h.screenshot}" alt="\${esc(p.name)} hero on \${esc(h.date)}" loading="lazy">\` : ''}
      </div>\`).join('');
  const m = $('#modal');
  m.scrollTop = 0;
  clearTimeout(closeTimer);
  m.hidden = false;
  // Read a layout property to flush the un-hidden state to the browser. Without it
  // the .open class lands in the same frame and there is nothing to animate from.
  void m.offsetWidth;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}

let closeTimer;
function closeModal() {
  const m = $('#modal');
  if (m.hidden) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
  // Matches the .14s exit transition; hiding immediately would cut it off.
  closeTimer = setTimeout(() => { m.hidden = true; }, 150);
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
