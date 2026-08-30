// Regenerates README.md from data/. Run after any data change.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const categories = read('data/categories.json');
const products = readdirSync(join(ROOT, 'data/products'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(`data/products/${f}`))
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

const tracked = products.filter((p) => p.history.length > 0);
const latestDate = tracked
  .map((p) => p.history[0].date)
  .sort()
  .at(-1);

const lines = [];
lines.push('# hero-txt: How your top competitors attract their target audience');
lines.push('');
lines.push('A library of hero section copy collected from live product websites.');
lines.push('');
lines.push(
  "Each entry records the headline and sub-headline shown on a product's homepage, together with a screenshot of the page at the time of capture. When a site changes its copy, the earlier version is retained. Every entry holds its three most recent versions, which makes it possible to see when and how a product changed its positioning."
);
lines.push('');
lines.push(
  `Currently ${products.length} products across ${categories.length} categories. Last updated ${latestDate}.`
);
lines.push('');
lines.push('## Browsing');
lines.push(
  'The rendered library, with screenshots, is at [herotxt.page](https://www.herotxt.page/). This `README` lists the same entries as plain text.'
);
lines.push('');
lines.push('## Data');
lines.push(
  'Entries live in data/products/ as JSON, one file per product. Each record holds the product name, homepage URL, category, current headline and sub-headline, capture date, screenshot path, and previous versions.'
);
lines.push('');
lines.push('This `README` is generated from that data. Edit the JSON, not the Markdown.');
lines.push('');
lines.push('## Contributing');
lines.push(
  'To suggest a product that is missing, open an issue with the product name and its homepage URL.'
);
lines.push('');
lines.push('## Attribution');
lines.push(
  'Screenshots belong to their respective owners and are included here for reference and commentary.'
);
lines.push('');
lines.push('<!-- The generated category sections and product entries follow below. -->');
lines.push('');

lines.push('## Contents');
lines.push('');
let currentGroup = null;
for (const c of categories) {
  if (c.group !== currentGroup) {
    if (currentGroup !== null) lines.push('');
    currentGroup = c.group;
    lines.push(`**${currentGroup}**  `);
  }
  const n = products.filter((p) => p.category === c.id).length;
  const anchor = c.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ /g, '-');
  lines.push(`- [${c.name}](#${anchor}) (${n})`);
}
lines.push('');

for (const c of categories) {
  const items = products.filter((p) => p.category === c.id);
  if (!items.length) continue;
  lines.push(`## ${c.name}`);
  lines.push('');
  lines.push(`_${c.blurb}_`);
  lines.push('');
  for (const p of items) {
    lines.push(`### [${p.name}](${p.url})`);
    if (!p.history.length) {
      lines.push('- _Not captured yet._');
      lines.push('');
      continue;
    }
    const [latest, ...older] = p.history;
    lines.push(`- **Headline:** ${latest.headline || '/'}`);
    lines.push(`- **Sub-headline:** ${latest.subheadline || '/'}`);
    lines.push(`- **Updated:** ${latest.date}`);
    if (older.length) {
      lines.push('');
      lines.push('<details><summary>Previous versions</summary>');
      lines.push('');
      for (const h of older) {
        lines.push(`- **${h.date}** — ${h.headline || '/'}`);
        if (h.subheadline) lines.push(`  ${h.subheadline}`);
      }
      lines.push('');
      lines.push('</details>');
    }
    lines.push('');
  }
}

writeFileSync(join(ROOT, 'README.md'), lines.join('\n'));
console.log(`README.md: ${products.length} products, ${categories.length} categories`);
