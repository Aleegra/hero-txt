// The library lives in Supabase: categories, hero_entries (one row per product)
// and hero_versions (its dated copy), with screenshots in a public Storage
// bucket. Every script reads and writes through here, so the row-to-record
// mapping and the rules about history exist in one place.
//
// Plain fetch against the REST and Storage APIs rather than supabase-js: the
// Pages build runs without `npm ci`, and this is the only thing it would install.
//
// Writes need SUPABASE_SERVICE_ROLE_KEY and fail at the first write without it,
// so a job given only SUPABASE_ANON_KEY cannot change anything by accident.
// Reads use the service key when there is one: RLS hides staged rows from anon,
// and a writer that cannot see them would re-create or lose track of them. What
// a job may do is therefore decided by which secrets its workflow passes.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Local runs read .env; on a runner the workflow sets these from secrets.
if (existsSync(join(ROOT, '.env'))) {
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(SUPABASE_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const URL_ = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const BUCKET = 'hero-screenshots';
// Every product keeps its three most recent copy versions.
export const MAX_HISTORY = 3;
// Products a reply has selected but nobody has approved yet. The build reads
// only 'published', so a staged product is in the database but not on the site.
// hero_entries_status_check allows draft / published / archived; a staged row
// is a draft. Withdrawing only ever deletes the rows its own batch lists, so a
// draft made by hand in the dashboard is never touched.
export const STAGED = 'draft';
export const PUBLISHED = 'published';

function key(write) {
  if (!URL_) throw new Error('SUPABASE_URL is not set — see .env.example');
  if (write) {
    if (!SERVICE) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — writes need it');
    return SERVICE;
  }
  const k = SERVICE || ANON;
  if (!k) throw new Error('SUPABASE_ANON_KEY is not set — see .env.example');
  return k;
}

// Supabase accepts an API key as the bearer token only when it equals apikey,
// which holds for both the legacy JWT keys and the newer sb_* ones.
const headers = (k, extra = {}) => ({ apikey: k, Authorization: `Bearer ${k}`, ...extra });

// A connection left idle while capture.mjs drives a browser for minutes can be
// closed under us, and the next request then dies with ECONNRESET. Network
// errors are retried for idempotent verbs; POST is not, since a retried insert
// whose first attempt did land would create the row twice.
async function send(method, url, init) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, { method, ...init });
    } catch (err) {
      if (method === 'POST' || attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function call(method, path, { body, write = method !== 'GET', prefer, type, extra = {} } = {}) {
  const k = key(write);
  const res = await send(method, `${URL_}${path}`, {
    headers: headers(k, {
      ...extra,
      ...(prefer ? { Prefer: prefer } : {}),
      ...(body === undefined ? {} : { 'Content-Type': type || 'application/json' }),
    }),
    // sharp hands back Buffers over a SharedArrayBuffer, which fetch does not
    // recognise as binary and sends as a string — a 43KB webp arrived as 78KB of
    // mojibake. Copying into a plain Uint8Array is what makes the bytes survive.
    body: body === undefined ? undefined : ArrayBuffer.isView(body) ? new Uint8Array(body) : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} failed (${res.status}): ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// PostgREST caps a response at max_rows (1000 by default) without saying so,
// so anything that reads a whole table pages through it.
async function selectAll(table, query, { write = false } = {}) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const rows = await call('GET', `/rest/v1/${table}?${query}&limit=1000&offset=${offset}`, { write });
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

const inList = (values) => `in.(${values.map((v) => `"${v}"`).join(',')})`;
const insert = (table, rows) => call('POST', `/rest/v1/${table}`, { body: rows, prefer: 'return=representation' });
const patch = (table, filter, values) =>
  call('PATCH', `/rest/v1/${table}?${filter}`, { body: values, prefer: 'return=representation' });
const remove = (table, filter) => call('DELETE', `/rest/v1/${table}?${filter}`);

// --- reading -----------------------------------------------------------------

export async function loadCategories() {
  const rows = await selectAll('categories', 'select=*&order=sort_order.asc');
  return rows.map((c) => ({
    uuid: c.id,
    id: c.slug,
    name: c.name,
    group: c.group,
    blurb: c.blurb || '',
    color: c.color || '#CCCCCC',
    short: c.short || c.name,
  }));
}

// Products in the same shape data/products/*.json always had, plus the row ids
// the writers need. `history` is newest first and includes versions still
// waiting for extract.mjs (headline ''), so callers that show copy filter on
// headline themselves.
//
//   statuses: which hero_entries to include; omit for all of them.
export async function loadLibrary({ statuses } = {}) {
  const categories = await loadCategories();
  const slugOf = Object.fromEntries(categories.map((c) => [c.uuid, c.id]));
  const [entries, versions] = await Promise.all([
    selectAll('hero_entries', `select=*${statuses ? `&status=${inList(statuses)}` : ''}&order=id.asc`),
    selectAll('hero_versions', 'select=*&order=version_date.desc,id.asc'),
  ]);

  const byEntry = new Map();
  for (const v of versions) {
    if (!byEntry.has(v.entry_id)) byEntry.set(v.entry_id, []);
    byEntry.get(v.entry_id).push({
      uuid: v.id,
      date: v.version_date,
      headline: v.headline || '',
      subheadline: v.subheadline || '',
      screenshot: v.screenshot_url || '',
    });
  }

  const products = entries
    .map((e) => ({
      uuid: e.id,
      id: e.slug,
      name: e.company_name,
      url: e.website_url,
      category: slugOf[e.category_id],
      status: e.status,
      fingerprint: e.fingerprint || '',
      history: byEntry.get(e.id) || [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  return { categories, products };
}

// Every category each product has been published under, as { slug: [cats] }.
// A trigger on hero_entries appends to it (supabase/migrations), so it also
// catches a category changed by hand in the dashboard.
export async function loadUrlHistory() {
  const rows = await selectAll('url_history', 'select=*&order=first_seen.asc,category_slug.asc');
  const out = {};
  for (const r of rows) (out[r.entry_slug] ||= []).push(r.category_slug);
  return out;
}

// --- screenshots -------------------------------------------------------------

// The object path is recoverable from the public URL, so no column records it.
// The ?v= suffix is a cache-buster (see uploadShot) and not part of the path.
export function storagePath(url) {
  const marker = `/object/public/${BUCKET}/`;
  const at = url.indexOf(marker);
  return at === -1 ? null : decodeURI(url.slice(at + marker.length).split('?')[0]);
}

// Returns the URL to store. Storage serves public objects with a long cache
// lifetime, so re-uploading to the same path (a same-day recapture, shot.mjs)
// would keep showing the old picture without a fresh query string.
export async function uploadShot(path, webp) {
  await call('POST', `/storage/v1/object/${BUCKET}/${path}`, {
    body: webp,
    type: 'image/webp',
    extra: { 'x-upsert': 'true' },
  });
  return `${URL_}/storage/v1/object/public/${BUCKET}/${path}?v=${Date.now().toString(36)}`;
}

export async function downloadShot(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not fetch ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function deleteShots(urls, keep = []) {
  const paths = [...new Set(urls.filter(Boolean).map(storagePath).filter(Boolean))].filter(
    (p) => !keep.includes(p)
  );
  if (paths.length) await call('DELETE', `/storage/v1/object/${BUCKET}`, { body: { prefixes: paths } });
}

// --- writing -----------------------------------------------------------------

export async function createEntry({ id, name, url, category, status }) {
  const categories = await loadCategories();
  const cat = categories.find((c) => c.id === category);
  // The build looks categories up without checking, so a bad slug would only
  // surface later as a TypeError. Fail here, where the cause is obvious.
  if (!cat) throw new Error(`unknown category "${category}"`);
  const [row] = await insert('hero_entries', {
    source_id: id,
    slug: id,
    company_name: name,
    website_url: url,
    category_id: cat.uuid,
    status,
  });
  return row.id;
}

export const setStatus = (uuid, status) => patch('hero_entries', `id=eq.${uuid}`, { status });
export const setFingerprint = (uuid, fingerprint) => patch('hero_entries', `id=eq.${uuid}`, { fingerprint });

// Removes a product outright: rows first, so the site can never point at a
// screenshot that is already gone, then the files.
export async function deleteEntry(product) {
  await remove('hero_versions', `entry_id=eq.${product.uuid}`);
  await remove('hero_entries', `id=eq.${product.uuid}`);
  await deleteShots(product.history.map((h) => h.screenshot));
}

// A fresh capture, still without copy. Any version from today, and any older one
// that never got its copy, is replaced rather than stacked: neither is a real
// data point. Pruning to MAX_HISTORY waits for extract.mjs, because until the
// copy is read we cannot tell whether this capture is a new version at all.
export async function addCapture(product, { date, webp, fingerprint }) {
  const path = `${product.id}/${date}.webp`;
  const stale = product.history.filter((h) => h.date === date || !h.headline);
  const url = await uploadShot(path, webp);
  if (stale.length) {
    await remove('hero_versions', `id=${inList(stale.map((h) => h.uuid))}`);
    await deleteShots(stale.map((h) => h.screenshot), [path]);
  }
  await insert('hero_versions', {
    entry_id: product.uuid,
    version_date: date,
    headline: null,
    subheadline: null,
    screenshot_url: url,
    fingerprint,
  });
  await setFingerprint(product.uuid, fingerprint);
}

export const setCopy = (versionUuid, { headline, subheadline }) =>
  patch('hero_versions', `id=eq.${versionUuid}`, { headline, subheadline });

export const setScreenshot = (versionUuid, url) => patch('hero_versions', `id=eq.${versionUuid}`, { screenshot_url: url });

export async function deleteVersions(versions) {
  if (!versions.length) return;
  await remove('hero_versions', `id=${inList(versions.map((h) => h.uuid))}`);
  await deleteShots(versions.map((h) => h.screenshot));
}

// Keeps the newest MAX_HISTORY versions that have copy, and mirrors the newest
// one onto hero_entries so the dashboard shows the current headline.
export async function settle(product) {
  const real = product.history.filter((h) => h.headline);
  await deleteVersions(real.slice(MAX_HISTORY));
  const [latest] = real;
  if (latest)
    await patch('hero_entries', `id=eq.${product.uuid}`, {
      headline: latest.headline,
      subheadline: latest.subheadline || null,
    });
}

// --- batches awaiting an emailed 发布 ---------------------------------------

// Service key required even to read: anon is shown an empty table, which would
// make every 发布 look like a fresh selection.
export const loadBatches = () => selectAll('staged_batches', 'select=*&order=created.asc', { write: true });
export const saveBatch = (batch) => insert('staged_batches', batch);
export const dropBatch = (conversation) => remove('staged_batches', `conversation=eq.${encodeURIComponent(conversation)}`);
