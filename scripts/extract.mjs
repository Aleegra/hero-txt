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
// Requires ANTHROPIC_API_KEY. Any Anthropic-compatible endpoint works: the SDK
// reads ANTHROPIC_BASE_URL itself, so pointing HERO_MODEL at a vision model on
// another provider is the whole of the configuration.
//
// Reads and writes Supabase (scripts/lib/db.mjs), so it also needs
// SUPABASE_SERVICE_ROLE_KEY. This is the step that makes a capture visible:
// the site shows only versions with copy.
//
//   node scripts/extract.mjs                 # every blank entry
//   node scripts/extract.mjs wiz e2b         # specific products
//   node scripts/extract.mjs --published     # skip staged drafts (recheck.yml)
import Anthropic from '@anthropic-ai/sdk';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deleteVersions, downloadShot, loadLibrary, PUBLISHED, ROTATING, setCopy, settle } from './lib/db.mjs';

const MODEL = process.env.HERO_MODEL || 'claude-sonnet-4-6';
const CONCURRENCY = 4;

const PROMPT = `You are cataloguing the hero section of a product website for a copywriting reference library.

The image is the top of the page exactly as a visitor sees it. Identify:

- headline: the single largest, most prominent line (or stacked lines) of text — the main claim. If it wraps across lines, join them with one space and return the whole thing. Transcribe verbatim, keeping the site's own capitalisation and punctuation.
- subheadline: the supporting sentence directly beneath the headline that explains the product. Verbatim. Use "" if there genuinely isn't one.

Ignore navigation, buttons and CTAs, cookie banners, "trusted by" logo strips, announcement bars, and chat widgets. If the headline cycles through rotating words, transcribe the state shown.

Respond with only a JSON object: {"headline": "...", "subheadline": "..."}`;

const anthropic = new Anthropic();

async function readHero(webp) {
  const res = await anthropic.messages.create({
    model: MODEL,
    // Transcription, not writing. At the default temperature the same screenshot
    // came back with the sub-headline present on one run and empty on the next,
    // which would land in the history as a copy change the site never made.
    temperature: 0,
    // Reasoning models spend this budget on a thinking block before they emit any
    // text. 1000 was enough for Sonnet but a busy hero can exhaust it, and the
    // response then contains thinking and nothing else.
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/webp',
              data: webp.toString('base64'),
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });
  const block = res.content.find((c) => c.type === 'text');
  // Name the actual failure. Without this the caller sees "cannot read properties
  // of undefined", which points at this line rather than at the token budget.
  if (!block)
    throw new Error(
      `no text block (stop_reason=${res.stop_reason}, blocks=${res.content.map((c) => c.type).join()})`
    );
  const text = block.text;
  const { headline, subheadline } = JSON.parse(
    text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  );
  return { headline: (headline || '').trim(), subheadline: (subheadline || '').trim() };
}

// The history records changes of wording, not of typography. Case is often a
// CSS text-transform, and the model is free to pick either quote or dash glyph
// for the same pixels, so none of those may count as a new version — with only
// three kept, each false one pushes a real one out for good.
function comparable(s) {
  return (s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export const sameCopy = (a, b) =>
  comparable(a.headline) === comparable(b.headline) &&
  comparable(a.subheadline) === comparable(b.subheadline);

// For a product capture.mjs saw cycling its headline ("Build for developers /
// designers / founders"). Each screenshot freezes a different word, so exact
// comparison would file a new version on every run. The words around the
// rotating one hold still, so two readings count as the same headline when at
// least half of the shorter one survives as a shared opening and ending. A real
// rewrite of such a page rarely leaves that much standing; one that swaps a
// single fixed word is the case this cannot see.
export function sameRotating(a, b) {
  if (comparable(a.subheadline) !== comparable(b.subheadline)) return false;
  const x = comparable(a.headline).split(' ');
  const y = comparable(b.headline).split(' ');
  const short = Math.min(x.length, y.length);
  let pre = 0;
  while (pre < short && x[pre] === y[pre]) pre++;
  let suf = 0;
  while (suf < short - pre && x[x.length - 1 - suf] === y[y.length - 1 - suf]) suf++;
  return pre + suf >= short / 2;
}

// What a bot check or an error page says where the hero should be. An
// unattended run that met one would otherwise file "Just a moment..." as the
// site's new positioning and delete its oldest real version to make room.
const NOT_A_HERO =
  /^(just a moment|checking your browser|verif(y|ying) (that )?you are (a )?human|are you a (robot|human)\b|attention required|access denied|403\b|404\b|50[0234]\b|(page|site) not found|please enable javascript|bad gateway|service unavailable|this site can.t be reached|sorry, you have been blocked)/i;

export const looksLikeHero = (headline) => !NOT_A_HERO.test(headline.trim());

async function main() {
  const args = process.argv.slice(2);
  const names = args.filter((a) => !a.startsWith('--'));

  let products = (await loadLibrary()).products.filter((p) =>
    p.history.some((h) => h.screenshot && !h.headline)
  );
  if (names.length) products = products.filter((p) => names.includes(p.id));
  // inbox-poll.mjs may be half way through staging a draft while the scheduled
  // re-check runs; those captures are its to read, not ours.
  if (args.includes('--published')) products = products.filter((p) => p.status === PUBLISHED);

  console.log(`extracting ${products.length} products`);

  const done = [];
  const noChange = [];
  const failed = [];
  const changes = [];
  const queue = [...products];

  const worker = async () => {
    while (queue.length) {
      const p = queue.shift();
      try {
        for (const entry of p.history) {
          if (!entry.screenshot || entry.headline) continue;
          const { headline, subheadline } = await readHero(await downloadShot(entry.screenshot));
          if (!headline) throw new Error('model returned no headline');
          if (!looksLikeHero(headline)) {
            // Drop the capture rather than leave it blank: left in place, every
            // later run would read the same screenshot and fail the same way.
            // The fingerprint stays that of the error page, so the next capture
            // sees a difference and shoots the real page again.
            await deleteVersions([entry]);
            throw new Error(`not a hero, capture discarded — "${headline.slice(0, 60)}"`);
          }
          entry.headline = headline;
          entry.subheadline = subheadline;
          await setCopy(entry.uuid, { headline, subheadline });
        }

        // If the fresh capture reads identically to the previous version, the
        // page was merely re-rendered — collapse it so history stays a log of
        // real copy changes rather than of scraper runs.
        const [latest, prev] = p.history;
        //
        // A rotating hero is checked against every kept version, not only the
        // last: a carousel of whole slides shares no words between them, but it
        // comes round again, so it settles at its slides instead of churning.
        const unchanged = p.fingerprint.endsWith(ROTATING)
          ? p.history.slice(1).some((v) => v.headline && sameRotating(latest, v))
          : prev && sameCopy(latest, prev);
        if (unchanged) {
          await deleteVersions([latest]);
          p.history = p.history.slice(1);
          noChange.push(p.id);
          console.log(`  = ${p.id}`);
        } else {
          done.push(p.id);
          changes.push({ name: p.name, date: latest.date, was: prev?.headline || '', now: latest.headline });
          console.log(`  + ${p.id} — ${latest.headline.slice(0, 70)}`);
        }
        // Only now is it known whether the capture was a new version, so this
        // is where history is cut back to three.
        await settle(p);
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

  // On Actions, leave the run's result on its summary page: a scheduled
  // re-check has nobody watching the log, and this is where to see what moved.
  if (process.env.GITHUB_STEP_SUMMARY) {
    const cell = (s) => s.replace(/\|/g, '\\|').replace(/\s+/g, ' ');
    const lines = [
      `### Hero copy: ${done.length} updated, ${noChange.length} unchanged, ${failed.length} failed`,
      '',
    ];
    if (changes.length) {
      lines.push('| Product | Collected | Was | Now |', '| --- | --- | --- | --- |');
      for (const c of changes.sort((a, b) => a.name.localeCompare(b.name)))
        lines.push(`| ${cell(c.name)} | ${c.date} | ${cell(c.was) || '—'} | ${cell(c.now)} |`);
      lines.push('');
    }
    for (const f of failed) lines.push(`- failed: ${f.id} — ${cell(f.error)}`);
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
  }
}

// Guarded so the helpers above can be imported without starting a run.
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
