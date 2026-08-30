// Swap in your own screenshot for a product, when the automatic capture caught
// the page badly — mid-animation, behind a modal, or scrolled to the wrong spot.
//
//   node scripts/shot.mjs wiz ~/Desktop/wiz.png
//
// Overwrites the image the current entry already points at rather than adding a
// dated one, because replacing a picture is not a copy change and history is
// meant to read as a log of copy changes.
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Matches capture.mjs so hand-supplied images sit at the same size and weight
// as automatic ones.
const WIDTH = 1440;
const QUALITY = 78;

const [id, image] = process.argv.slice(2);
if (!id || !image) {
  console.error('usage: node scripts/shot.mjs <product-id> <image-file>');
  process.exit(1);
}

const file = join(ROOT, 'data', 'products', `${id}.json`);
if (!existsSync(file)) {
  console.error(`no product called "${id}" — check data/products/`);
  process.exit(1);
}
if (!existsSync(image)) {
  console.error(`no such image: ${image}`);
  process.exit(1);
}

const product = JSON.parse(readFileSync(file, 'utf8'));
const entry = product.history[0];
if (!entry) {
  console.error(`${id} has no entry yet — run: node scripts/capture.mjs ${id}`);
  process.exit(1);
}

// Reuse the recorded path where there is one. capture.mjs deletes every file in
// a product's folder that no entry points at, so a freshly invented name would
// be swept away the next time that product is re-shot.
const rel = entry.screenshot ?? `shots/${id}/${entry.date}.webp`;
mkdirSync(join(ROOT, dirname(rel)), { recursive: true });
await sharp(image).resize({ width: WIDTH }).webp({ quality: QUALITY }).toFile(join(ROOT, rel));

entry.screenshot = rel;
writeFileSync(file, JSON.stringify(product, null, 2) + '\n');

console.log(`${id}: wrote ${rel}\nnext: npm run build`);
