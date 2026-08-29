// Step 1 of 2: screenshot every product's hero section.
//
// Deliberately does no text extraction — see scripts/extract.mjs for why the
// copy is read out of the image rather than the DOM. Splitting the two means
// the slow, flaky part (driving 87 real websites) is independently resumable
// from the part that needs an API key.
//
// A DOM-text fingerprint gates the work: if a page's text is unchanged since
// the last run, nothing is written. That keeps the weekly job's repo footprint
// proportional to actual copy churn.
//
//   node scripts/capture.mjs                 # everything
//   node scripts/capture.mjs wiz e2b         # specific products
//   node scripts/capture.mjs --missing       # only those with no history
//   node scripts/capture.mjs --force         # ignore fingerprints
import { chromium } from 'playwright';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = join(ROOT, 'data', 'products');
const SHOTS = join(ROOT, 'shots');
const MAX_HISTORY = 3;
const CONCURRENCY = 4;
const VIEWPORT = { width: 1440, height: 900 };
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const today = new Date().toISOString().slice(0, 10);

// Runs in-page. Used only to detect change, never as final copy.
function domFingerprint() {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return (
      r.width > 40 &&
      r.height > 8 &&
      s.visibility !== 'hidden' &&
      parseFloat(s.opacity) > 0.1 &&
      r.top < window.innerHeight &&
      r.bottom > 0
    );
  };
  const headings = [...document.querySelectorAll('h1, h2, h3, p')]
    .filter(vis)
    .map((el) => el.innerText.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' | ');
  // Some sites build their hero entirely out of divs and spans, so fall back
  // to the raw visible text rather than reporting the page as empty.
  return (headings || document.body.innerText.replace(/\s+/g, ' ').trim()).slice(0, 2000);
}

async function dismissBanners(page) {
  const known = [
    '#onetrust-accept-btn-handler',
    '.cky-btn-accept',
    '#hs-eu-confirmation-button',
    '[aria-label="Accept cookies"]',
    'button[data-testid="uc-accept-all-button"]',
  ];
  for (const sel of known) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false))
      return void (await el.click({ timeout: 2000 }).catch(() => {}));
  }
  const byText = page
    .getByRole('button', {
      name: /^(accept|accept all|accept cookies|allow all|i agree|got it|ok)$/i,
    })
    .first();
  if (await byText.isVisible().catch(() => false))
    await byText.click({ timeout: 2000 }).catch(() => {});
}

async function shoot(context, product) {
  const page = await context.newPage();
  try {
    // Some marketing sites keep long-polling connections open forever, so we
    // settle for "document committed" and then wait on real content instead.
    await page.goto(product.url, { waitUntil: 'commit', timeout: 45000 });
    await page
      .waitForSelector('h1, [class*="hero" i]', { timeout: 20000, state: 'attached' })
      .catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await dismissBanners(page);
    await page.waitForTimeout(2500);
    // Freeze animations so re-runs produce comparable images.
    await page
      .addStyleTag({
        content:
          '*,*::before,*::after{animation:none!important;transition:none!important}',
      })
      .catch(() => {});

    const fingerprint = await page.evaluate(domFingerprint).catch(() => '');
    if (!fingerprint) throw new Error('page rendered no readable text');
    // Busy pages can keep the compositor from ever going idle. Falling back to
    // a JPEG capture sidesteps the PNG encoder stalling on those.
    const png = await page
      .screenshot({ type: 'png', timeout: 30000 })
      .catch(() => page.screenshot({ type: 'jpeg', quality: 92, timeout: 60000 }));
    return { fingerprint, png };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const onlyMissing = args.includes('--missing');
  const names = args.filter((a) => !a.startsWith('--'));

  let products = readdirSync(PRODUCTS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(PRODUCTS, f), 'utf8')));
  if (names.length) products = products.filter((p) => names.includes(p.id));
  if (onlyMissing) products = products.filter((p) => p.history.length === 0);

  console.log(`capturing ${products.length} products`);

  const browser = await chromium
    .launch({ channel: 'chrome' })
    .catch(() => chromium.launch());
  let context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: UA,
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  });

  const shot = [];
  const unchanged = [];
  const failed = [];
  const queue = [...products];

  const worker = async () => {
    while (queue.length) {
      const p = queue.shift();
      try {
        const { fingerprint, png } = await shoot(context, p);
        const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);

        if (!force && p.fingerprint === hash && p.history.length) {
          unchanged.push(p.id);
          console.log(`  = ${p.id}`);
          continue;
        }

        const dir = join(SHOTS, p.id);
        mkdirSync(dir, { recursive: true });
        const rel = `shots/${p.id}/${today}.webp`;
        await sharp(png)
          .resize({ width: VIEWPORT.width })
          .webp({ quality: 78 })
          .toFile(join(ROOT, rel));

        p.fingerprint = hash;
        // Empty copy marks this entry as awaiting extract.mjs.
        p.history = [
          { date: today, headline: '', subheadline: '', screenshot: rel },
          ...p.history.filter((h) => h.date !== today),
        ].slice(0, MAX_HISTORY);

        const keep = new Set(p.history.map((h) => h.screenshot).filter(Boolean));
        for (const f of readdirSync(dir))
          if (!keep.has(`shots/${p.id}/${f}`)) rmSync(join(dir, f));

        writeFileSync(join(PRODUCTS, `${p.id}.json`), JSON.stringify(p, null, 2) + '\n');
        shot.push(p.id);
        console.log(`  + ${p.id}`);
      } catch (err) {
        const msg = err.message.split('\n')[0];
        failed.push({ id: p.id, url: p.url, error: msg });
        console.log(`  ! ${p.id} — ${msg}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Heavy pages that stalled at 2x often succeed at 1x, run one at a time.
  if (failed.length) {
    console.log(`\nretrying ${failed.length} at 1x`);
    const retry = failed.splice(0).map((f) => products.find((p) => p.id === f.id));
    context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      userAgent: UA,
      locale: 'en-US',
      timezoneId: 'America/Los_Angeles',
    });
    queue.push(...retry);
    await worker();
  }

  await browser.close();

  console.log(`\nshot ${shot.length}  unchanged ${unchanged.length}  failed ${failed.length}`);
  if (failed.length) console.log(failed.map((f) => `  ${f.id}: ${f.error}`).join('\n'));
  writeFileSync(
    join(ROOT, 'capture-report.json'),
    JSON.stringify({ date: today, shot, unchanged, failed }, null, 2)
  );
  if (shot.length) console.log(`\nnext: node scripts/extract.mjs`);
}

main();
