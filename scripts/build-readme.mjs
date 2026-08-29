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
lines.push('# hero-txt');
lines.push('');
lines.push(
  "The headline and sub-headline in a hero section are the first thing a visitor reads — they decide whether someone understands what you do, and whether they stay. **This is a library of real hero-section copy, collected from live product websites,** kept as a reference for anyone writing or redesigning one."
);
lines.push('');
lines.push(
  `**${products.length} products** across **${categories.length} categories**. Each entry keeps its **three most recent** versions, so you can see how positioning shifts over time. Last updated **${latestDate}**.`
);
lines.push('');
lines.push(
  '> Browse with screenshots at **[the site](https://aleegra.github.io/hero-txt/)**. Data lives in [`data/products/`](data/products/) — this README is generated from it, so edit the JSON, not the Markdown.'
);
lines.push('');
lines.push('Spotted a site we are missing? Open an issue.');
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
