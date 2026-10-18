// Swap in your own screenshot for a product, when the automatic capture caught
// the page badly — mid-animation, behind a modal, or scrolled to the wrong spot.
//
//   node scripts/shot.mjs wiz ~/Desktop/wiz.png
//
// Overwrites the image the current entry already points at rather than adding a
// dated one, because replacing a picture is not a copy change and history is
// meant to read as a log of copy changes. Writes to Supabase, so it needs
// SUPABASE_SERVICE_ROLE_KEY; the site picks it up on the next deploy.
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { loadLibrary, setScreenshot, storagePath, uploadShot } from './lib/db.mjs';

// Matches capture.mjs so hand-supplied images sit at the same size and weight
// as automatic ones.
const WIDTH = 1440;
const QUALITY = 78;

const [id, image] = process.argv.slice(2);
if (!id || !image) {
  console.error('usage: node scripts/shot.mjs <product-id> <image-file>');
  process.exit(1);
}
if (!existsSync(image)) {
  console.error(`no such image: ${image}`);
  process.exit(1);
}

const product = (await loadLibrary()).products.find((p) => p.id === id);
if (!product) {
  console.error(`no product called "${id}" — check hero_entries.slug`);
  process.exit(1);
}
const entry = product.history[0];
if (!entry) {
  console.error(`${id} has no entry yet — run: node scripts/capture.mjs ${id}`);
  process.exit(1);
}

// Reuse the recorded path where there is one, so the old object is replaced
// rather than orphaned.
const path = (entry.screenshot && storagePath(entry.screenshot)) || `${id}/${entry.date}.webp`;
const webp = await sharp(image).resize({ width: WIDTH }).webp({ quality: QUALITY }).toBuffer();
await setScreenshot(entry.uuid, await uploadShot(path, webp));

console.log(`${id}: replaced ${path}\nnext: redeploy the site (Actions → Deploy site → Run workflow)`);
