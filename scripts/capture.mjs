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
// A 1440px-wide webp of a real hero runs 25-150KB; a blank frame lands near 2KB.
const MIN_BYTES = 8000;
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

// Reveal-on-scroll wrappers occasionally never fire their observer, leaving a
// hero at opacity:0 with the copy sitting in the DOM — it reads fine and
// screenshots blank. Force only the chain around the hero text rather than
// every element on the page, so genuinely hidden UI stays hidden.
async function forceHeroVisible(page) {
  await page
    .evaluate(() => {
      const big = [...document.querySelectorAll('h1,h2,p,span,div')].filter((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.top < window.innerHeight &&
          r.bottom > 0 &&
          parseFloat(getComputedStyle(el).fontSize) >= 28 &&
          el.innerText?.trim().length > 3
        );
      });
      for (const el of big)
        for (let n = el; n && n !== document.body; n = n.parentElement)
          if (parseFloat(getComputedStyle(n).opacity) < 1)
            n.style.setProperty('opacity', '1', 'important');
    })
    .catch(() => {});
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

// Last resort. Playwright's screenshot waits for the compositor to report a
// stable frame; a handful of pages animate forever and never get there. CDP
// grabs whatever is on screen right now with no such guarantee.
async function cdpShot(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      captureBeyondViewport: false,
    });
    return Buffer.from(data, 'base64');
  } finally {
    await cdp.detach().catch(() => {});
  }
}

async function shoot(context, product) {
  const page = await context.newPage();
  try {
    // Prefer waiting for 'load': a number of sites gate their reveal on the
    // load event and paint a blank page until it fires. Some marketing sites
    // keep long-polling connections open forever and never get there, so fall
    // back to "document committed" and wait on real content instead.
    await page
      .goto(product.url, { waitUntil: 'load', timeout: 30000 })
      .catch(() => page.goto(product.url, { waitUntil: 'commit', timeout: 45000 }));
    await page
      .waitForSelector('h1, [class*="hero" i]', { timeout: 20000, state: 'attached' })
      .catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await dismissBanners(page);

    // Fast-forward animations rather than disabling them. Killing them outright
    // reverts elements to their pre-animation styles, and heroes that fade in
    // from opacity:0 then screenshot as blank.
    await page
      .addStyleTag({
        content:
          '*,*::before,*::after{animation-duration:.01s!important;animation-delay:0s!important;transition-duration:.01s!important;transition-delay:0s!important}',
      })
      .catch(() => {});

    // Nudge the page so scroll-triggered reveals fire, then return to the top.
    await page.evaluate(() => window.scrollTo(0, 600)).catch(() => {});
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});

    // Wait for the hero to actually paint text rather than trusting a fixed delay.
    await page
      .waitForFunction(
        () => {
          const big = [...document.querySelectorAll('h1,h2,div,span,p')].filter((el) => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return (
              r.top < window.innerHeight &&
              r.bottom > 0 &&
              parseFloat(s.fontSize) >= 28 &&
              parseFloat(s.opacity) > 0.5 &&
              s.visibility !== 'hidden' &&
              el.innerText.trim().length > 3
            );
          });
          return big.length > 0;
        },
        { timeout: 15000 }
      )
      .catch(() => {});
    // Some heroes type their headline in character by character with JS, which
    // the CSS fast-forward above cannot touch. Wait for the visible hero text
    // to stop changing rather than guessing at a fixed delay, or we capture a
    // half-typed line. Rotating word carousels never settle, so this is capped.
    await page
      .waitForFunction(
        () => {
          const text = [...document.querySelectorAll('h1,h2,div,span,p')]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return (
                r.top < window.innerHeight &&
                r.bottom > 0 &&
                parseFloat(getComputedStyle(el).fontSize) >= 28
              );
            })
            .map((el) => el.innerText?.trim() ?? '')
            .join('|');
          const prev = window.__heroPrev;
          window.__heroPrev = text;
          window.__heroStable = prev === text ? (window.__heroStable ?? 0) + 1 : 0;
          return window.__heroStable >= 3;
        },
        { timeout: 12000, polling: 400 }
      )
      .catch(() => {});
    await page.waitForTimeout(1200);

    // Because we navigate on 'commit' rather than 'load', webfonts may still be
    // in flight. Text in a font-display:block face paints as nothing at all —
    // the DOM reads fine and the screenshot comes out blank.
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    // Consent modals often mount late, after the hero has settled.
    await dismissBanners(page);
    await forceHeroVisible(page);
    await page.waitForTimeout(400);

    const fingerprint = await page.evaluate(domFingerprint).catch(() => '');
    if (!fingerprint) throw new Error('page rendered no readable text');
    // Busy pages can keep the compositor from ever going idle. Falling back to
    // a JPEG capture sidesteps the PNG encoder stalling on those, and a raw CDP
    // capture sidesteps Playwright's stability waiting entirely.
    const png = await page
      .screenshot({ type: 'png', timeout: 30000 })
      .catch(() => page.screenshot({ type: 'jpeg', quality: 92, timeout: 60000 }))
      .catch(() => cdpShot(page));
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
  const newContext = (deviceScaleFactor) =>
    browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor,
      userAgent: UA,
      locale: 'en-US',
      timezoneId: 'America/Los_Angeles',
    });

  const shot = [];
  const unchanged = [];
  const failed = [];
  const queue = [...products];

  // One context per worker. Sharing a single context across parallel pages
  // starves the compositor and it hands back blank frames under load.
  const worker = async (context) => {
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

        const webp = await sharp(png)
          .resize({ width: VIEWPORT.width })
          .webp({ quality: 78 })
          .toBuffer();
        // A page that painted nothing still screenshots successfully — it just
        // encodes to almost nothing. Reject it here so it lands in the serial
        // retry below rather than being stored as a valid capture.
        if (webp.length < MIN_BYTES) throw new Error(`blank render (${webp.length}b)`);

        const dir = join(SHOTS, p.id);
        mkdirSync(dir, { recursive: true });
        const rel = `shots/${p.id}/${today}.webp`;
        writeFileSync(join(ROOT, rel), webp);

        p.fingerprint = hash;
        // Empty copy marks this entry as awaiting extract.mjs. Entries still
        // awaiting it are not real data points, so replace rather than stack.
        p.history = [
          { date: today, headline: '', subheadline: '', screenshot: rel },
          ...p.history.filter((h) => h.date !== today && h.headline),
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

  const contexts = await Promise.all(
    Array.from({ length: CONCURRENCY }, () => newContext(2))
  );
  await Promise.all(contexts.map((c) => worker(c)));
  for (const c of contexts) await c.close().catch(() => {});

  // Heavy pages that stalled at 2x often succeed at 1x, run one at a time.
  if (failed.length) {
    console.log(`\nretrying ${failed.length} at 1x`);
    const retry = failed.splice(0).map((f) => products.find((p) => p.id === f.id));
    queue.push(...retry);
    await worker(await newContext(1));
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
