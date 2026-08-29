// Visits each product site, screenshots the hero section, and extracts the
// headline / sub-headline. Only records a new history entry when the copy
// actually changed — that keeps repo growth proportional to real churn
// rather than to how often the job runs.
//
//   node scripts/capture.mjs                 # everything
//   node scripts/capture.mjs wiz e2b         # specific products
//   node scripts/capture.mjs --missing       # only those with no history
import { chromium } from 'playwright';
import sharp from 'sharp';
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = join(ROOT, 'data', 'products');
const SHOTS = join(ROOT, 'shots');
const MAX_HISTORY = 3;
const CONCURRENCY = 5;
const VIEWPORT = { width: 1440, height: 900 };
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const today = new Date().toISOString().slice(0, 10);

// Runs inside the page. Finds the visually dominant text block above the fold
// and the supporting line beneath it.
function extractHero() {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return (
      r.width > 40 &&
      r.height > 8 &&
      s.visibility !== 'hidden' &&
      s.display !== 'none' &&
      parseFloat(s.opacity) > 0.1 &&
      r.top < window.innerHeight &&
      r.bottom > 0
    );
  };
  const inChrome = (el) =>
    el.closest('nav, header nav, footer, [role="navigation"], [class*="cookie" i], [id*="cookie" i], [class*="banner" i], [class*="announce" i]');

  const blocks = [...document.querySelectorAll('h1, h2, h3, p, span, div, li')]
    .filter((el) => vis(el) && !inChrome(el))
    // keep leaf-ish nodes so we don't grab a wrapper containing the whole page
    .filter((el) => clean(el.innerText).length && clean(el.innerText).length < 600)
    .filter((el) => ![...el.children].some((c) => clean(c.innerText) === clean(el.innerText)))
    .map((el) => ({
      el,
      text: clean(el.innerText),
      size: parseFloat(getComputedStyle(el).fontSize),
      top: el.getBoundingClientRect().top,
      tag: el.tagName,
    }));

  const headlineCand = blocks.filter((b) => b.text.length >= 5 && b.text.length <= 220);
  if (!headlineCand.length) return { headline: '', subheadline: '' };

  const h1 = headlineCand.find((b) => b.tag === 'H1');
  const biggest = headlineCand.reduce((a, b) =>
    b.size > a.size || (b.size === a.size && b.top < a.top) ? b : a
  );
  // Trust an <h1> unless something is dramatically larger (common on sites
  // that keep a visually-hidden h1 for SEO).
  const headline = h1 && biggest.size <= h1.size * 1.25 ? h1 : biggest;

  const sub = blocks.find(
    (b) =>
      b.top >= headline.top &&
      b.text !== headline.text &&
      b.size < headline.size &&
      b.text.length >= 25 &&
      !/^(get started|sign up|book a demo|contact|learn more|try |start )/i.test(b.text)
  );

  return { headline: headline.text, subheadline: sub ? sub.text : '' };
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
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 2000 }).catch(() => {});
      return;
    }
  }
  const byText = page
    .getByRole('button', { name: /accept all|accept cookies|allow all|i agree|got it/i })
    .first();
  if (await byText.isVisible().catch(() => false))
    await byText.click({ timeout: 2000 }).catch(() => {});
}

async function capture(context, product) {
  const page = await context.newPage();
  try {
    await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await dismissBanners(page);
    // Let entrance animations settle, then freeze them so the shot is stable.
    await page.waitForTimeout(2500);
    await page.addStyleTag({
      content: '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important}',
    });

    const hero = await page.evaluate(extractHero);
    const png = await page.screenshot({ type: 'png' });
    return { ...hero, png };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const args = process.argv.slice(2);
  const onlyMissing = args.includes('--missing');
  const names = args.filter((a) => !a.startsWith('--'));

  let products = readdirSync(PRODUCTS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(PRODUCTS, f), 'utf8')));
  if (names.length) products = products.filter((p) => names.includes(p.id));
  if (onlyMissing) products = products.filter((p) => p.history.length === 0);

  console.log(`capturing ${products.length} products`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: UA,
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  });

  const changed = [];
  const failed = [];
  const queue = [...products];

  const worker = async () => {
    while (queue.length) {
      const p = queue.shift();
      try {
        const { headline, subheadline, png } = await capture(context, p);
        if (!headline) throw new Error('no headline found');

        const prev = p.history[0];
        const same = prev && prev.headline === headline && prev.subheadline === subheadline;
        if (same) {
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

        p.history = [{ date: today, headline, subheadline, screenshot: rel }, ...p.history.filter((h) => h.date !== today)].slice(
          0,
          MAX_HISTORY
        );

        // Drop screenshots that fell off the end of the 3-entry window.
        const keep = new Set(p.history.map((h) => h.screenshot).filter(Boolean));
        for (const f of readdirSync(dir))
          if (!keep.has(`shots/${p.id}/${f}`)) rmSync(join(dir, f));

        writeFileSync(join(PRODUCTS, `${p.id}.json`), JSON.stringify(p, null, 2) + '\n');
        changed.push(p.id);
        console.log(`  + ${p.id} — ${headline.slice(0, 60)}`);
      } catch (err) {
        failed.push({ id: p.id, url: p.url, error: err.message.split('\n')[0] });
        console.log(`  ! ${p.id} — ${err.message.split('\n')[0]}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();

  console.log(`\nchanged: ${changed.length}  unchanged: ${products.length - changed.length - failed.length}  failed: ${failed.length}`);
  if (failed.length) {
    console.log(failed.map((f) => `  ${f.id}: ${f.error}`).join('\n'));
    writeFileSync(join(ROOT, 'capture-failures.json'), JSON.stringify(failed, null, 2));
  }
  writeFileSync(join(ROOT, 'capture-report.json'), JSON.stringify({ date: today, changed, failed }, null, 2));
}

main();
