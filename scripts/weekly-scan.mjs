// Weekly reading list, emailed. Two sources, one message, nothing written to
// the repo — the user picks what is worth acting on.
//
//   1. Product Hunt: the #1 product of each of the last 7 daily leaderboards.
//   2. TechCrunch: AI software companies that raised Series A or later.
//
// The TechCrunch half needs a model. The Anthropic SDK reads ANTHROPIC_BASE_URL
// itself, so pointing it at DeepSeek is purely environment, as in extract.mjs.
//
//   node scripts/weekly-scan.mjs             # scan and send
//   node scripts/weekly-scan.mjs --dry-run   # print the email instead
import Anthropic from '@anthropic-ai/sdk';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = join(ROOT, 'data', 'products');
const MODEL = process.env.HERO_TEXT_MODEL || 'DeepSeek-V4-Flash';
const TO = process.env.DIGEST_TO || 'xinxialing@gmail.com';
const AGENT = process.env.E2A_AGENT || 'ling@agents.e2a.dev';
const WINDOW_DAYS = 7;

// The AI category carries most of the rounds we care about; venture and
// fundraising catch the ones filed elsewhere. /tag/funding/ looks like the
// obvious third source and is a trap — it still answers 200 but has not been
// updated in over a week and trails off into 2025, so it contributes nothing
// to a seven-day window.
const FEEDS = [
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'https://techcrunch.com/category/venture/feed/',
  'https://techcrunch.com/category/fundraising/feed/',
];

// A feed page holds about 20 items. The AI category alone publishes that in
// three days, so a single page cannot cover the week — hence ?paged=.
const MAX_PAGES = 8;

// Identify honestly — and not only for etiquette. Product Hunt's bot
// protection challenges clients that claim to be Chrome and then fail the JS
// challenge, so a spoofed browser agent is answered with 403 where this one is
// served normally.
const UA = 'hero-txt-scanner/1.0 (+https://github.com/Aleegra/hero-txt)';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

// TechCrunch drops the occasional connection mid-run (observed: ECONNRESET on
// the third feed). Without a retry that silently truncates a feed to whatever
// arrived before the blip, and the digest quietly loses a day of articles.
async function fetchText(url, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (!res.ok) throw new Error(`${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === attempts) throw new Error(`${err.message} ${url}`);
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    }
  }
}

// --- Product Hunt -----------------------------------------------------------

function ymd(date) {
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
}

// Appending .md to a leaderboard URL returns a text/markdown rendering: 9 KB
// instead of 540 KB, and it carries the score and the product's own homepage,
// neither of which appears in the server-rendered HTML. It also sidesteps the
// hashed CSS class names that change on every Product Hunt deploy.
async function productHuntTop(date) {
  const [y, m, d] = ymd(date);
  const md = await fetchText(`https://www.producthunt.com/leaderboard/daily/${y}/${m}/${d}.md`);

  // "1. Kilo Code for JetBrains - Fully native, open-source coding agent"
  const head = md.match(/^1\.\s+(.+?)(?:\s+-\s+(.*))?$/m);
  if (!head) throw new Error('no rank-1 entry in leaderboard markdown');

  // The indented detail lines belong to this entry until rank 2 begins.
  const rest = md.slice(head.index + head[0].length);
  const body = rest.slice(0, rest.search(/^2\.\s/m) + 1 || rest.length);
  const field = (name) => (body.match(new RegExp(`^\\s*-\\s*${name}:\\s*(.+)$`, 'm')) || [])[1]?.trim();

  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    name: decode(head[1]),
    tagline: decode(head[2] || ''),
    score: field('Score') || '',
    url: field('Product Hunt page') || `https://www.producthunt.com/leaderboard/daily/${y}/${m}/${d}`,
    site: field('External URL') || '',
  };
}

async function productHuntWeek() {
  const picks = [];
  // Yesterday backwards. Today's board is still being voted on and its top
  // slot shuffles through the day, so including it would report a non-result.
  for (let back = WINDOW_DAYS; back >= 1; back--) {
    const date = new Date(Date.now() - back * 86400000);
    try {
      picks.push(await productHuntTop(date));
    } catch (err) {
      const [y, m, d] = ymd(date);
      console.log(`  ! product hunt ${y}-${m}-${d} — ${err.message}`);
    }
  }
  return picks;
}

// --- TechCrunch -------------------------------------------------------------

function tag(item, name) {
  const m = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  if (!m) return '';
  return decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' '));
}

// Cheap gate before the model: an article that names no money and no round is
// a conference plug or an opinion piece, and there are a lot of those.
const MONEY = /\$\s?\d|series\s+[a-h]\b|\braise[sd]?\b|\braising\b|\bfunding\b|\bround\b/i;

async function techcrunchCandidates() {
  const cutoff = Date.now() - WINDOW_DAYS * 86400000;
  const seen = new Set();
  const out = [];

  for (const feed of FEEDS) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      let xml;
      try {
        xml = await fetchText(page === 1 ? feed : `${feed}?paged=${page}`);
      } catch (err) {
        console.log(`  ! ${feed} page ${page} — ${err.message}`);
        break;
      }

      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      if (!items.length) break;
      let reachedCutoff = false;

      for (const [, item] of items) {
        const published = Date.parse(tag(item, 'pubDate'));
        if (!Number.isNaN(published) && published < cutoff) {
          // Feeds run newest first, so the first old item ends this feed.
          reachedCutoff = true;
          continue;
        }
        const link = tag(item, 'link');
        if (!link || seen.has(link)) continue;
        const title = tag(item, 'title');
        const summary = tag(item, 'description');
        if (!MONEY.test(`${title} ${summary}`)) continue;
        seen.add(link);
        out.push({ title, summary, link });
      }

      if (reachedCutoff) break;
    }
  }
  return out;
}

// Asked to return only the articles that qualify, the model returns an empty
// array for a week that plainly contains qualifying rounds — a shortlist is
// easy to decline to produce. Asked for a verdict on every article it judges
// them accurately, so it rules on all of them and the filtering happens below,
// where the reasoning is also auditable.
const CLASSIFY_PROMPT = `You are screening TechCrunch articles for a weekly funding digest about AI software companies.

Judge EVERY article below and return one object for each, in the same order. Do not omit any.

For each article decide:

- "isRound": does it report a funding round raised by an operating company for ITSELF? False for acquisitions and takeovers — "Nvidia will buy Hugging Face" is an exit. False for venture funds, accelerators and government programmes announcing a fund of their own — "a16z closes $1.1B fund" is a fund, not a company. A company in talks for a round still counts as true.
- "stage": the round stage the article names. If it names none, infer from the size and write it as "undisclosed (~$100M)".
- "seriesAOrLater": true for Series A, B, C, D, E, growth, late-stage and pre-IPO. False for pre-seed, seed, pre-A, angel, grants and debt-only facilities. When the stage is unstated, a round of roughly $30M or more counts as true.
- "isAISoftware": does the company sell AI software, AI infrastructure or AI developer tools? False for hardware-first, robotics, biotech and pharma, and where AI is incidental to a non-AI product.

Reply with only a JSON array, one object per article, in the same order:

[{"index": 0, "name": "Acme", "isRound": true, "stage": "Series B", "seriesAOrLater": true, "isAISoftware": true, "amount": "$50M", "oneLiner": "what the company does, at most 20 words", "website": "https://acme.com"}]

Set "website" to "" unless you are confident of the company's own domain — a wrong URL is worse than none.

Articles:
`;

async function classify(candidates) {
  if (!candidates.length) return [];
  const anthropic = new Anthropic();
  const listing = candidates
    .map((c, i) => `${i}. ${c.title}\n   ${c.summary.slice(0, 400)}`)
    .join('\n\n');

  const res = await anthropic.messages.create({
    model: MODEL,
    // Screening against fixed rules, not writing. Same reasoning as extract.mjs:
    // at the default temperature the same feed yields a different shortlist.
    temperature: 0,
    // The thinking block and the answer share one budget, and on a batch of
    // twenty articles the reasoning does not merely overrun it — at 4000 and
    // again at 16000 the reply came back as thinking and nothing else. Asking
    // for a budget_tokens of 8000 did not help either; it still spent 15,998.
    // The rules here are explicit enough to apply without deliberation.
    thinking: { type: 'disabled' },
    // A verdict per article runs about 70 tokens, so this covers a week far
    // busier than any observed so far.
    max_tokens: 8000,
    messages: [{ role: 'user', content: CLASSIFY_PROMPT + listing }],
  });

  const block = res.content.find((c) => c.type === 'text');
  if (!block)
    throw new Error(
      `no text block (stop_reason=${res.stop_reason}, blocks=${res.content.map((c) => c.type).join()})`
    );
  const text = block.text;
  const verdicts = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));

  return verdicts
    .filter((v) => candidates[v.index] && v.isRound && v.seriesAOrLater && v.isAISoftware)
    .map((v) => ({ ...v, round: v.stage, article: candidates[v.index].link }));
}

// --- de-duplication against the library ------------------------------------

function known() {
  const hosts = new Set();
  const names = new Set();
  for (const file of readdirSync(PRODUCTS).filter((f) => f.endsWith('.json'))) {
    const p = JSON.parse(readFileSync(join(PRODUCTS, file), 'utf8'));
    try {
      hosts.add(new URL(p.url).hostname.replace(/^www\./, ''));
    } catch {}
    names.add(p.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  }
  return { hosts, names };
}

function isNew({ hosts, names }, company) {
  if (company.website) {
    try {
      if (hosts.has(new URL(company.website).hostname.replace(/^www\./, ''))) return false;
    } catch {}
  }
  // Names catch the ones the model declined to guess a domain for.
  return !names.has((company.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
}

// --- output -----------------------------------------------------------------

function compose(picks, companies, from, to) {
  const lines = [`hero-txt weekly scan — ${from} to ${to}`, ''];

  lines.push(`PRODUCT HUNT — #1 of each day (${picks.length})`, '');
  if (!picks.length) lines.push('  nothing retrieved this week', '');
  for (const p of picks) {
    lines.push(`  ${p.date}  ${p.name}${p.score ? `  (score ${p.score})` : ''}`);
    if (p.tagline) lines.push(`      ${p.tagline}`);
    if (p.site) lines.push(`      ${p.site}`);
    lines.push(`      ${p.url}`, '');
  }

  lines.push(`TECHCRUNCH — AI software, Series A and later (${companies.length})`, '');
  if (!companies.length) lines.push('  no qualifying rounds this week', '');
  for (const c of companies) {
    lines.push(`  ${c.name} — ${c.round}${c.amount ? ` · ${c.amount}` : ''}`);
    if (c.oneLiner) lines.push(`      ${c.oneLiner}`);
    if (c.website) lines.push(`      ${c.website}`);
    lines.push(`      ${c.article}`, '');
  }

  lines.push('Companies already in the hero-txt library are left out of the TechCrunch list.');
  return lines.join('\n');
}

function send(subject, body) {
  // Every line of this body is third-party text. Passing argv directly means it
  // is never parsed by a shell, so a headline containing $(...) stays a headline.
  execFileSync('e2a', ['send', '--agent', AGENT, '--to', TO, '--subject', subject, '--body', body], {
    stdio: 'inherit',
  });
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const to = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const from = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString().slice(0, 10);

  console.log(`scanning ${from} to ${to}`);

  const picks = await productHuntWeek();
  console.log(`product hunt: ${picks.length} daily winners`);

  const candidates = await techcrunchCandidates();
  console.log(`techcrunch: ${candidates.length} funding candidates`);

  const classified = await classify(candidates);
  const library = known();
  const companies = classified.filter((c) => isNew(library, c));
  console.log(
    `techcrunch: ${classified.length} match the brief, ${companies.length} not already in the library`
  );

  const subject = `hero-txt weekly — ${picks.length} Product Hunt winners, ${companies.length} funded AI companies (${from} to ${to})`;
  const body = compose(picks, companies, from, to);

  if (dryRun) {
    console.log(`\n--- ${subject}\n\n${body}`);
    return;
  }
  send(subject, body);
  console.log(`\nsent to ${TO}`);
}

main();
