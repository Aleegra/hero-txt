// Serves dist/ the way GitHub Pages does, which python -m http.server does not:
// a bare /inference has to resolve to inference.html. Without that the preview
// 404s on every page the site actually publishes.
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.argv[2] || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const file = (p) => {
  try {
    return statSync(p).isFile() ? p : null;
  } catch {
    return null;
  }
};

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  // normalize() collapses any ../ before it is joined, so a crafted path cannot
  // reach outside dist/.
  const rel = normalize(url).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+|[/\\]+$/g, '');
  const base = rel ? join(DIST, rel) : DIST;
  const hit = file(base) || file(base + '.html') || file(join(base, 'index.html'));
  if (!hit) {
    // Not the homepage: a missing page has to look missing, or a broken link in
    // the build reads as a working one.
    res.writeHead(404, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' });
    res.end(`<!doctype html><meta charset="utf-8"><title>404</title><p>Not found: ${url}`);
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(hit)] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  res.end(readFileSync(hit));
}).listen(PORT, () => console.log(`serving dist/ on http://localhost:${PORT}`));
