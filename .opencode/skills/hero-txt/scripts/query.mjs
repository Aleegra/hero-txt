#!/usr/bin/env node
// Query the copy library bundled with the hero-txt skill. Zero dependencies.
//
//   node scripts/query.mjs --search "agent memory"
//   node scripts/query.mjs --category agent-memory
//   node scripts/query.mjs --group "Cloud & DevOps" --changed
//   node scripts/query.mjs --list-categories
//
// Output is Markdown by default, or the matching records as JSON with --json.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const bundle = JSON.parse(readFileSync(join(HERE, '..', 'data', 'products.json'), 'utf8'));

const help = `Usage: node scripts/query.mjs [options]

  --search <text>       Match product, headline, sub-headline, category, or group
  --category <id>       Only one category, e.g. agent-memory
  --group <name>        Only one group, e.g. "AI & Agents"
  --changed             Only products with more than one captured version
  --since <YYYY-MM-DD>  Only products last captured on or after this date
  --limit <n>           Maximum results (default 10, 0 = all)
  --json                Print records as JSON
  --list-categories     List category ids and counts
  -h, --help            Show this help
`;

const options = { limit: 10 };
const argv = process.argv.slice(2);
const fail = (message) => {
  console.error(`${message}\n\n${help}`);
  process.exit(1);
};

for (let i = 0; i < argv.length; i++) {
  const flag = argv[i];
  if (flag === '-h' || flag === '--help') {
    console.log(help);
    process.exit(0);
  }
  if (flag === '--json') options.json = true;
  else if (flag === '--changed') options.changed = true;
  else if (flag === '--list-categories') options.list = true;
  else if (['--search', '--category', '--group', '--since', '--limit'].includes(flag)) {
    const value = argv[++i];
    if (value === undefined) fail(`${flag} needs a value`);
    options[flag.slice(2)] = value;
  } else fail(`unknown option: ${flag}`);
}

const limit = Number(options.limit);
if (!Number.isInteger(limit) || limit < 0) fail('--limit must be a non-negative integer');

const counts = new Map();
for (const product of bundle.products) counts.set(product.category, (counts.get(product.category) || 0) + 1);

if (options.list) {
  console.log(`# hero-txt categories (${bundle.count} products, updated ${bundle.updated})\n`);
  let currentGroup = null;
  for (const category of bundle.categories) {
    if (category.group !== currentGroup) {
      currentGroup = category.group;
      console.log(`\n**${currentGroup}**`);
    }
    console.log(`- \`${category.id}\` — ${category.name} (${counts.get(category.id) || 0})`);
  }
  process.exit(0);
}

const query = (options.search || '').toLowerCase();
let matches = bundle.products.filter((product) => {
  if (options.category && product.category !== options.category) return false;
  if (options.group && product.group.toLowerCase() !== options.group.toLowerCase()) return false;
  if (options.changed && product.history.length < 2) return false;
  if (options.since && product.history[0].date < options.since) return false;
  if (!query) return true;
  return [
    product.name,
    product.category,
    product.categoryName,
    product.group,
    ...product.history.flatMap((version) => [version.headline, version.subheadline || '']),
  ]
    .join(' ')
    .toLowerCase()
    .includes(query);
});

matches = matches.sort(
  (a, b) => b.history[0].date.localeCompare(a.history[0].date) || a.name.localeCompare(b.name, 'en')
);
const total = matches.length;
if (limit) matches = matches.slice(0, limit);

if (options.json) {
  console.log(JSON.stringify({ updated: bundle.updated, total, count: matches.length, products: matches }, null, 2));
  process.exit(0);
}

if (!matches.length) {
  console.log('No matches. Try a broader `--search`, `--list-categories`, or drop `--since` / `--changed`.');
  process.exit(0);
}

console.log(
  `# hero-txt matches (${matches.length} of ${total}; library updated ${bundle.updated})\n`
);
for (const product of matches) {
  const [current, ...older] = product.history;
  console.log(`### ${product.name} — ${product.categoryName} (${current.date})`);
  console.log(`**Headline:** ${current.headline}`);
  if (current.subheadline) console.log(`**Sub-headline:** ${current.subheadline}`);
  console.log(`**Source:** ${product.url}`);
  if (older.length) {
    console.log('**Previous versions:**');
    for (const version of older) {
      console.log(
        `- ${version.date} — ${version.headline}${version.subheadline ? ` — ${version.subheadline}` : ''}`
      );
    }
  }
  console.log('');
}
console.log(`Read references/patterns.md for the playbook behind these examples.`);
