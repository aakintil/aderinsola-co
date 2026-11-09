#!/usr/bin/env node
/**
 * Lists every draft placeholder in the site: [bracketed] copy, <Draft> blocks,
 * `draft: true` entries, tone placeholders without an image, and empty values in site.ts.
 * Run: npm run drafts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIRS = ['src/content', 'src/pages', 'src/lib/site.ts'];

const walk = (p) =>
  statSync(p).isDirectory() ? readdirSync(p).flatMap((f) => walk(join(p, f))) : /\.(mdx?|astro|ts)$/.test(p) ? [p] : [];

const checks = [
  // Prose in brackets: starts with a letter, no code characters, not a markdown link
  { label: 'placeholder', re: /\[[A-Za-z][^\]\n'"{}=^]*\](?!\()/g },
  { label: 'draft block', re: /<Draft\b/g },
  { label: 'draft entry', re: /^draft:\s*true/gm },
  { label: 'image to come', re: /<Media\b(?![^>]*\bsrc=)[^>]*\btag="([^"]+)"/g },
  { label: 'empty setting', re: /^\s*(email|resume):\s*''/gm },
];

let total = 0;
for (const file of DIRS.flatMap((d) => walk(join(ROOT, d)))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const { label, re } of checks) {
      for (const m of line.matchAll(re)) {
        // YAML tag lists and TypeScript types only look like placeholders
        if (label === 'placeholder' && (/^\s*tags:/.test(line) || file.endsWith('.ts'))) continue;
        total++;
        console.log(`${relative(ROOT, file)}:${i + 1}  ${label.padEnd(13)} ${(m[1] ?? m[0]).trim()}`);
      }
    }
  });
}
console.log(`\n${total} draft item${total === 1 ? '' : 's'}. Drafts show in dev and previews, and are removed from production.`);
