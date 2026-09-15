// Reply to the weekly digest to add products to the library.
//
// The digest lists AI companies that raised this week. Naming some of them in a
// reply is enough: this script screenshots each one, reads its hero copy, and
// mails the result back for approval. Answering "发布" publishes it to
// herotxt.page; answering "取消" removes it again.
//
// Two runs, because approval happens between them:
//
//   inbound reply  -> capture, extract, build, commit to v2, mail a preview
//   inbound 发布   -> deploy the site
//   inbound 取消   -> delete the products, rebuild, commit
//
// Nothing here trusts the reply for anything but names. The set of products
// that can be created is fixed by the digest we ourselves sent — a reply that
// names something else, or supplies a URL of its own, selects nothing. So the
// worst a forged mail can do is re-add a company that was already on a list the
// user had read.
//
//   node scripts/inbox-poll.mjs             # act on unread mail
//   node scripts/inbox-poll.mjs --dry-run   # print decisions, touch nothing
import Anthropic from '@anthropic-ai/sdk';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveWebsite } from './weekly-scan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = join(ROOT, 'data', 'products');
const PENDING = join(ROOT, 'data', 'pending');
const SHOTS = join(ROOT, 'shots');
const CATEGORIES = join(ROOT, 'data', 'categories.json');

const MODEL = process.env.HERO_TEXT_MODEL || 'DeepSeek-V4-Flash';
const AGENT = process.env.E2A_AGENT || 'ling@agents.e2a.dev';
const SITE = 'https://www.herotxt.page/';

// An unconfirmed batch is already committed to v2 but absent from the site. Left
// alone it would sit there forever, so a batch nobody answers is withdrawn.
const PENDING_DAYS = 7;

const DRY = process.argv.includes('--dry-run');

// --- e2a --------------------------------------------------------------------

// Bodies and subjects carry third-party text — a headline scraped from someone
// else's landing page, a company name from a TechCrunch byline. argv goes to
// execve directly, so a name containing $(...) stays a name.
function e2a(args, { capture = true } = {}) {
  return execFileSync('e2a', args, {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    maxBuffer: 32 * 1024 * 1024,
  });
}

function messages(args) {
  return e2a(['messages', 'list', '--agent', AGENT, '--json', ...args])
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

// Marks the message read, which is what stops the next run seeing it again.
function body(id) {
  return e2a(['messages', 'get', id, '--text', '--agent', AGENT]);
}

function reply(id, text) {
  if (DRY) {
    console.log(`\n--- would reply to ${id}\n${text}\n---`);
    return;
  }
  e2a(['reply', id, '--agent', AGENT, '--body', text], { capture: false });
}

// --- git --------------------------------------------------------------------

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

function commit(message) {
  if (DRY) {
    console.log(`would commit: ${message}`);
    return false;
  }
  git('add', 'data', 'shots', 'README.md');
  if (!git('status', '--porcelain', '--', 'data', 'shots', 'README.md').trim()) {
    console.log('nothing to commit');
    return false;
  }
  git('commit', '-m', message);

  // Only the runner pushes. The staging half of this script relies on a commit
  // to v2 not reaching the site, and that holds only for GITHUB_TOKEN — a push
  // with a personal credential does trigger pages.yml, so running this locally
  // published two products straight past the confirmation step. Locally the
  // commit is left for a human to push.
  if (!process.env.GITHUB_ACTIONS) {
    console.log('committed but not pushed — run outside CI. push v2 yourself to publish.');
    return false;
  }
  git('push', 'origin', 'v2');
  return true;
}

function run(script, args = []) {
  console.log(`  $ node scripts/${script} ${args.join(' ')}`);
  if (DRY) return;
  execFileSync('node', [join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

function build() {
  console.log('  $ npm run build');
  if (DRY) return;
  execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
}

// --- parsing the digest we sent ---------------------------------------------

function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Mirrors compose() in weekly-scan.mjs, which emits each company as
//
//     Name — Round · $Amount
//         one-liner
//         https://company.example        (only when one was resolved)
//         https://techcrunch.com/...
//
// The two functions are a matched pair: changing the layout there breaks the
// reading here, and the failure is silent — an unparsed digest just looks like
// a reply that selected nothing.
function digestCompanies(text) {
  const companies = [];
  const lines = text.split('\n');
  let current = null;

  for (const line of lines) {
    // Two-space indent and an em dash: the start of a company block. The
    // Product Hunt half of the digest indents its entries the same way but
    // separates fields with two spaces, so requiring the dash keeps them out.
    const head = line.match(/^ {2}(\S.*?) — (.+)$/);
    if (head) {
      current = { name: head[1].trim(), round: head[2].trim(), website: '', article: '', oneLiner: '' };
      companies.push(current);
      continue;
    }
    if (!current) continue;

    const detail = line.match(/^ {6}(\S.*)$/);
    if (!detail) {
      if (!line.trim()) current = null;
      continue;
    }
    const value = detail[1].trim();
    if (!/^https?:\/\//.test(value)) {
      if (!current.oneLiner) current.oneLiner = value;
    } else if (/(^|\.)techcrunch\.com/.test(new URL(value).hostname)) {
      current.article = value;
    } else {
      current.website = value;
    }
  }
  return companies.filter((c) => c.article);
}

// --- parsing the user's reply -----------------------------------------------

const PUBLISH = /^(发布|上线|publish|ship|ok|yes|go)$/i;
const CANCEL = /^(取消|撤回|不要|cancel|no|drop)$/i;

// e2a strips the quoted digest itself, but the attribution line above it
// survives, and Gmail wraps that line at 78 columns:
//
//     On Tue, Sep 8, 2026 at 12:32 AM ling@agents.e2a.dev via e2a <
//     agent@send.e2a.dev> wrote:
//
// so matching it whole ("On ... wrote:") misses. Anything from the "On <date>"
// opener onwards is quoting, whatever it wrapped into.
const QUOTE_START =
  /^(>|-{2,}|_{2,}|On\s.*\d{4}|.*\bvia e2a\b|From:|Sent:|hero-txt weekly scan)/;

function replyLines(text) {
  const out = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (QUOTE_START.test(line)) break;
    if (!line) continue;
    // "1. Wonderful", "- Wonderful", "* Wonderful"
    out.push(line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim());
  }
  return out.filter(Boolean);
}

function verdict(lines) {
  for (const line of lines) {
    if (PUBLISH.test(line)) return 'publish';
    if (CANCEL.test(line)) return 'cancel';
  }
  return null;
}

// --- categories -------------------------------------------------------------

const CATEGORY_PROMPT = `Pick the single best category for a developer-tools product.

Reply with the category id and nothing else. It must be exactly one of the ids listed.

`;

async function categorise(company, ids, listing) {
  const anthropic = new Anthropic();
  const res = await anthropic.messages.create({
    model: MODEL,
    temperature: 0,
    thinking: { type: 'disabled' },
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `${CATEGORY_PROMPT}${listing}\n\nProduct: ${company.name}\n${company.oneLiner}\n${company.website}\n\nCategory id:`,
      },
    ],
  });
  const block = res.content.find((c) => c.type === 'text');
  if (!block)
    throw new Error(
      `no text block (stop_reason=${res.stop_reason}, blocks=${res.content.map((c) => c.type).join()})`
    );
  const id = block.text.trim().replace(/[^a-z-]/g, '');
  // build-site.mjs looks the category up without checking, so an invented id
  // becomes a TypeError on c.color at build time. Catching it here names the
  // actual problem instead.
  if (!ids.includes(id)) throw new Error(`model returned category "${id}", which does not exist`);
  return id;
}

// --- phase one: a reply naming companies ------------------------------------

function slugFor(name) {
  const base = norm(name) || 'product';
  return base.slice(0, 40);
}

async function selection(message, picks) {
  const digest = digestCompanies(body(findDigest(message.conversationId)));
  console.log(`  digest lists ${digest.length} companies`);

  const categories = JSON.parse(readFileSync(CATEGORIES, 'utf8'));
  const ids = categories.map((c) => c.id);
  const listing = categories.map((c) => `${c.id} — ${c.name}`).join('\n');
  const existing = new Set(readdirSync(PRODUCTS).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));

  const added = [];
  const noWebsite = [];
  const unknown = [];
  const already = [];

  for (const pick of picks) {
    // The only thing the reply is allowed to do is name something already on
    // the list. No match, no action — this is what keeps an arbitrary URL in a
    // forged mail from ever reaching the screenshotter.
    const company = digest.find((c) => norm(c.name) === norm(pick) || norm(pick).startsWith(norm(c.name)));
    if (!company) {
      unknown.push(pick);
      continue;
    }
    // Digests sent before websites were resolved carry only the article link,
    // and those mails stay in the mailbox indefinitely — a reply to one is a
    // normal thing to receive, not an error. The article is still the evidence,
    // so read it now rather than refusing.
    if (!company.website) {
      console.log(`  ? ${company.name} — no website in the digest, reading the article`);
      company.website = await resolveWebsite(company);
    }
    if (!company.website) {
      noWebsite.push(company);
      continue;
    }
    const id = slugFor(company.name);
    if (existing.has(id)) {
      already.push(company);
      continue;
    }

    const category = await categorise(company, ids, listing);
    const record = { id, name: company.name, url: company.website, category, history: [] };
    console.log(`  + ${id} (${category}) ${company.website}`);
    if (!DRY) writeFileSync(join(PRODUCTS, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`);
    existing.add(id);
    added.push(record);
  }

  if (added.length) {
    const ids = added.map((p) => p.id);
    run('capture.mjs', ids);
    // Skipping this leaves headline empty, and build-site.mjs filters those
    // out — the product would vanish from the site with no error at all.
    run('extract.mjs', ids);
    build();

    if (!DRY) {
      mkdirSync(PENDING, { recursive: true });
      writeFileSync(
        join(PENDING, `${message.conversationId}.json`),
        `${JSON.stringify(
          {
            conversation: message.conversationId,
            created: new Date().toISOString().slice(0, 10),
            products: ids,
          },
          null,
          2
        )}\n`
      );
    }
    // Committing to v2 does not publish: GitHub does not run one workflow from
    // another workflow's push, so pages.yml stays asleep until the confirmation
    // run deploys explicitly.
    commit(`Stage ${ids.join(', ')} from an emailed selection`);
  }

  reply(message.id, composePreview(added, noWebsite, unknown, already));
}

function composePreview(added, noWebsite, unknown, already) {
  const lines = [];

  if (added.length) {
    lines.push(`Captured ${added.length} — reply 发布 to publish, 取消 to discard.`, '');
    for (const p of added) {
      const record = DRY ? p : JSON.parse(readFileSync(join(PRODUCTS, `${p.id}.json`), 'utf8'));
      const entry = record.history?.[0] || {};
      lines.push(`  ${record.name}  [${record.category}]`);
      lines.push(`      ${record.url}`);
      lines.push(`      headline:    ${entry.headline || '(not extracted)'}`);
      if (entry.subheadline) lines.push(`      subheadline: ${entry.subheadline}`);
      lines.push('');
    }
    lines.push('Nothing is live yet. The site updates only after you reply 发布.', '');
  } else {
    lines.push('Nothing was captured.', '');
  }

  if (noWebsite.length) {
    lines.push('No website found in the article, so these were skipped —', 'reply with the name and a URL on one line to add them:', '');
    for (const c of noWebsite) lines.push(`  ${c.name}`);
    lines.push('');
  }
  if (already.length) {
    lines.push('Already in the library:', '');
    for (const c of already) lines.push(`  ${c.name}`);
    lines.push('');
  }
  if (unknown.length) {
    lines.push('Not on the digest list, so ignored:', '');
    for (const name of unknown) lines.push(`  ${name}`);
    lines.push('');
  }
  return lines.join('\n');
}

// --- phase two: publish or withdraw ------------------------------------------

function withdraw(batch) {
  for (const id of batch.products) {
    const file = join(PRODUCTS, `${id}.json`);
    if (existsSync(file) && !DRY) rmSync(file);
    const shots = join(SHOTS, id);
    if (existsSync(shots) && !DRY) rmSync(shots, { recursive: true });
    console.log(`  - ${id}`);
  }
  if (!DRY) rmSync(join(PENDING, `${batch.conversation}.json`));
  build();
}

function confirm(message, batch, decision) {
  if (decision === 'cancel') {
    withdraw(batch);
    commit(`Withdraw ${batch.products.join(', ')}`);
    reply(message.id, `Removed ${batch.products.join(', ')}. The site is unchanged.`);
    return false;
  }

  if (!DRY) rmSync(join(PENDING, `${batch.conversation}.json`));
  commit(`Publish ${batch.products.join(', ')}`);
  reply(
    message.id,
    `Published ${batch.products.join(', ')}.\n\n${SITE}\n\nThe site rebuilds in a couple of minutes.`
  );
  return true;
}

// --- driver -----------------------------------------------------------------

function findDigest(conversationId) {
  const sent = messages(['--direction', 'outbound', '--conversation', conversationId]);
  const digest = sent.reverse().find((m) => /hero-txt weekly/.test(m.subject || ''));
  if (!digest) throw new Error(`no weekly digest in conversation ${conversationId}`);
  return digest.id;
}

function pendingBatches() {
  if (!existsSync(PENDING)) return [];
  return readdirSync(PENDING)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(PENDING, f), 'utf8')));
}

function expire() {
  const cutoff = Date.now() - PENDING_DAYS * 86400000;
  for (const batch of pendingBatches()) {
    if (Date.parse(batch.created) >= cutoff) continue;
    console.log(`expiring ${batch.conversation} (staged ${batch.created})`);
    withdraw(batch);
    commit(`Withdraw ${batch.products.join(', ')} — unconfirmed for ${PENDING_DAYS} days`);
  }
}

async function main() {
  expire();

  // Reading a message marks it read, so a message that has already been looked
  // at is invisible to the poll. --message replays one by id, which is the only
  // way to re-test against real mail.
  const replay = process.argv.indexOf('--message');
  const unread =
    replay === -1
      ? messages(['--direction', 'inbound', '--read-status', 'unread'])
      : messages(['--direction', 'inbound']).filter((m) => m.id === process.argv[replay + 1]);
  console.log(`${unread.length} to process`);
  let deploy = false;

  for (const message of unread) {
    console.log(`\n${message.id} from ${message.headerFrom}`);
    const lines = replyLines(body(message.id));
    const batch = pendingBatches().find((b) => b.conversation === message.conversationId);

    if (batch) {
      const decision = verdict(lines);
      if (!decision) {
        reply(message.id, `Staged: ${batch.products.join(', ')}.\n\nReply 发布 to publish or 取消 to discard.`);
        continue;
      }
      console.log(`  ${decision} ${batch.products.join(', ')}`);
      if (confirm(message, batch, decision)) deploy = true;
      continue;
    }

    if (!lines.length) {
      console.log('  nothing selected');
      continue;
    }
    await selection(message, lines);
  }

  // The workflow reads this to decide whether to run the Pages steps.
  if (process.env.GITHUB_OUTPUT && !DRY)
    execFileSync('sh', ['-c', `echo "deploy=${deploy}" >> "$GITHUB_OUTPUT"`]);
}

main();
