// Exports the published library from Supabase back into data/, in the format the
// repo always kept, so git holds a dated, diffable copy of the copy. Supabase is
// the source of truth; nothing reads these files any more except a human, or a
// restore.
//
//   data/categories.json       the taxonomy, in display order
//   data/products/<id>.json    one per published product, newest version first
//   data/url-history.json      every category each product has lived under
//
// With --shots <dir> it also downloads every screenshot into <dir>, laid out as
// in the Storage bucket. The backup workflow uploads that folder as a build
// artifact rather than committing it, which is what keeps images out of git.
//
// A read-only job: the anon key is enough.
//
//   node scripts/export-backup.mjs
//   node scripts/export-backup.mjs --shots backup-shots
//   node scripts/export-backup.mjs --force    # allow a large drop in products
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { downloadShot, loadLibrary, loadUrlHistory, storagePath } from './lib/db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const PRODUCTS = join(DATA, 'products');

const args = process.argv.slice(2);
const force = args.includes('--force');
const shotsAt = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;

const json = (v) => `${JSON.stringify(v, null, 2)}\n`;

const { categories, products: all } = await loadLibrary({ statuses: ['published'] });
const urlHistory = await loadUrlHistory();
// Same rule as the site: a version extract.mjs has not read yet is not data.
const products = all
  .map((p) => ({ ...p, history: p.history.filter((h) => h.headline) }))
  .filter((p) => p.history.length);

// The point of a backup is that it survives the thing it backs up. A query that
// comes back nearly empty — a policy change, a bad key, a table emptied by
// mistake — must not overwrite a good copy with an empty one.
mkdirSync(PRODUCTS, { recursive: true });
const before = readdirSync(PRODUCTS).filter((f) => f.endsWith('.json'));
if (!force && products.length < before.length / 2) {
  console.error(
    `refusing to export: Supabase returned ${products.length} products, the backup holds ${before.length}. ` +
      'Check the database, then rerun with --force if the drop is real.'
  );
  process.exit(1);
}

writeFileSync(
  join(DATA, 'categories.json'),
  json(categories.map(({ id, name, group, blurb, color, short }) => ({ id, name, group, blurb, color, short })))
);

const keep = new Set();
for (const p of products) {
  // Field order matches the files the repo kept before Supabase, so the first
  // export diffs only where the data actually differs.
  const record = {
    id: p.id,
    name: p.name,
    url: p.url,
    category: p.category,
    history: p.history.map(({ date, headline, subheadline, screenshot }) => ({ date, headline, subheadline, screenshot: screenshot || null })),
    ...(p.fingerprint ? { fingerprint: p.fingerprint } : {}),
  };
  writeFileSync(join(PRODUCTS, `${p.id}.json`), json(record));
  keep.add(`${p.id}.json`);
}
const removed = before.filter((f) => !keep.has(f));
for (const f of removed) rmSync(join(PRODUCTS, f));

const history = {};
for (const id of Object.keys(urlHistory).sort()) history[id] = urlHistory[id];
writeFileSync(join(DATA, 'url-history.json'), json(history));

console.log(
  `exported ${categories.length} categories, ${products.length} products` +
    (removed.length ? `, removed ${removed.map((f) => f.slice(0, -5)).join(', ')}` : '')
);

if (shotsAt) {
  const urls = products.flatMap((p) => p.history.map((h) => h.screenshot)).filter(Boolean);
  let failed = 0;
  for (const url of urls) {
    const path = storagePath(url);
    try {
      const file = join(ROOT, shotsAt, path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, await downloadShot(url));
    } catch (err) {
      failed++;
      console.error(`  ! ${path}: ${err.message}`);
    }
  }
  console.log(`downloaded ${urls.length - failed}/${urls.length} screenshots to ${shotsAt}/`);
  if (failed) process.exitCode = 1;
}
