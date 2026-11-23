#!/usr/bin/env node
/**
 * Fails the build if a page links to a page or file on this site that doesn't exist.
 * Reads the built HTML in dist/, checks every href, src, srcset and poster that starts
 * with "/", plus "#id" links on the same page. Redirects in vercel.json count as pages.
 * Runs after `npm run build`, or on its own: node scripts/check-links.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((f) => walk(join(p, f))) : [p]);
const pages = walk(DIST).filter((p) => p.endsWith('.html'));
const redirects = new Set(
  (JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).redirects ?? []).map((r) => r.source),
);

const exists = (path) => {
  if (redirects.has(path) || redirects.has(path.replace(/\/$/, ''))) return true;
  const p = join(DIST, decodeURIComponent(path));
  return [p, join(p, 'index.html'), `${p}.html`].some((f) => existsSync(f) && statSync(f).isFile());
};

const attr = /\s(href|src|srcset|poster)="([^"]*)"/g;
const broken = [];

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const page = '/' + relative(DIST, file).replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');

  for (const [, name, value] of html.matchAll(attr)) {
    const urls = name === 'srcset' ? value.split(',').map((s) => s.trim().split(/\s+/)[0]) : [value];
    for (const url of urls) {
      if (url.startsWith('#')) {
        if (url.length > 1 && !ids.has(decodeURIComponent(url.slice(1)))) broken.push([page, url]);
      } else if (url.startsWith('/') && !url.startsWith('//')) {
        const path = url.split(/[?#]/)[0];
        if (!exists(path)) broken.push([page, url]);
      }
    }
  }
}

if (broken.length) {
  console.error(`\nBroken links (${broken.length}):`);
  for (const [page, url] of broken) console.error(`  ${page} → ${url}`);
  process.exit(1);
}
console.log(`Links OK: ${pages.length} pages checked.`);
