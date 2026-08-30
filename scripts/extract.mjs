// Step 2 of 2: read the headline / sub-headline out of each captured
// screenshot and fill in the history entries capture.mjs left blank.
//
// Why vision rather than DOM selectors: modern landing pages split headlines
// across spans, animate them in word-by-word, and keep visually-hidden <h1>s
// for SEO. Selector-based extraction silently returns fragments — an early
// pass here produced "Agents that use" for a page reading "Agents that use
// the browser." The screenshot is what a visitor actually sees, which is
// precisely what this library documents.
//
// Requires ANTHROPIC_API_KEY.
//
//   node scripts/extract.mjs                 # every blank entry
//   node scripts/extract.mjs wiz e2b         # specific products
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = join(ROOT, 'data', 'products');
const MODEL = 'claude-sonnet-4-6';
const CONCURRENCY = 4;

const PROMPT = `You are cataloguing the hero section of a product website for a copywriting reference library.

The image is the top of the page exactly as a visitor sees it. Identify:

- headline: the single largest, most prominent line (or stacked lines) of text — the main claim. If it wraps across lines, join them with one space and return the whole thing. Transcribe verbatim, keeping the site's own capitalisation and punctuation.
- subheadline: the supporting sentence directly beneath the headline that explains the product. Verbatim. Use "" if there genuinely isn't one.

Ignore navigation, buttons and CTAs, cookie banners, "trusted by" logo strips, announcement bars, and chat widgets. If the headline cycles through rotating words, transcribe the state shown.

Respond with only a JSON object: {"headline": "...", "subheadline": "..."}`;

const anthropic = new Anthropic();

async function readHero(file) {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/webp',
              data: readFileSync(file).toString('base64'),
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });
  const text = res.content.find((c) => c.type === 'text').text;
  const { headline, subheadline } = JSON.parse(
    text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  );
  return { headline: (headline || '').trim(), subheadline: (subheadline || '').trim() };
}

async function main() {
  const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));

  let products = readdirSync(PRODUCTS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(PRODUCTS, f), 'utf8')))
    .filter((p) => p.history.some((h) => h.screenshot && !h.headline));
  if (names.length) products = products.filter((p) => names.includes(p.id));

  console.log(`extracting ${products.length} products`);

  const done = [];
  const noChange = [];
  const failed = [];
  const queue = [...products];

  const worker = async () => {
    while (queue.length) {
      const p = queue.shift();
      try {
        for (const entry of p.history) {
          if (!entry.screenshot || entry.headline) continue;
          const file = join(ROOT, entry.screenshot);
          if (!existsSync(file)) throw new Error(`missing ${entry.screenshot}`);
          const { headline, subheadline } = await readHero(file);
          if (!headline) throw new Error('model returned no headline');
          entry.headline = headline;
          entry.subheadline = subheadline;
        }

        // If the fresh capture reads identically to the previous version, the
        // page was merely re-rendered — collapse it so history stays a log of
        // real copy changes rather than of scraper runs.
        const [latest, prev] = p.history;
        if (prev && latest.headline === prev.headline && latest.subheadline === prev.subheadline) {
          if (latest.screenshot && existsSync(join(ROOT, latest.screenshot)))
            rmSync(join(ROOT, latest.screenshot));
          p.history = p.history.slice(1);
          noChange.push(p.id);
          console.log(`  = ${p.id}`);
        } else {
          done.push(p.id);
          console.log(`  + ${p.id} — ${latest.headline.slice(0, 70)}`);
        }
        writeFileSync(join(PRODUCTS, `${p.id}.json`), JSON.stringify(p, null, 2) + '\n');
      } catch (err) {
        const msg = err.message.split('\n')[0];
        failed.push({ id: p.id, error: msg });
        console.log(`  ! ${p.id} — ${msg}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\nupdated ${done.length}  unchanged ${noChange.length}  failed ${failed.length}`);
  if (failed.length) console.log(failed.map((f) => `  ${f.id}: ${f.error}`).join('\n'));
}

main();
