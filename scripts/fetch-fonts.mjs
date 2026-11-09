#!/usr/bin/env node
/**
 * Puts the licensed GT Flexa WOFF2 files into src/assets/fonts/flexa/ (gitignored).
 *
 * Sources, in order:
 *   1. Files already in place: nothing to do.
 *   2. FONTS_DIR: a local folder (for development).
 *   3. FONTS_REPO_TOKEN: the private GitHub repo (for Vercel and CI).
 *
 * If none work, it warns and exits 0. The site then builds with the system fallback stack.
 * Never commit these files: the web license allows self-hosting only.
 */
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILES = ['GT-Flexa-Standard-Regular.woff2', 'GT-Flexa-Standard-Bold.woff2'];
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DEST = join(ROOT, 'src/assets/fonts/flexa');

const log = (msg) => console.log(`[fonts] ${msg}`);
const warn = (msg) => console.warn(`[fonts] ⚠ ${msg}`);

// Node 21+ can read .env without a dependency.
if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));

const isWoff2 = (buf) => buf.length > 4 && buf.subarray(0, 4).toString('latin1') === 'wOF2';
const missing = () => FILES.filter((f) => !existsSync(join(DEST, f)));

async function main() {
  if (missing().length === 0) return log('GT Flexa already in place.');
  mkdirSync(DEST, { recursive: true });

  const dir = process.env.FONTS_DIR?.replace(/^~(?=$|\/)/, homedir());
  if (dir) {
    for (const f of missing()) {
      const from = resolve(ROOT, dir, f);
      if (!existsSync(from)) { warn(`FONTS_DIR has no ${f}`); continue; }
      if (!isWoff2(readFileSync(from))) { warn(`${f} in FONTS_DIR is not a WOFF2 file`); continue; }
      copyFileSync(from, join(DEST, f));
      log(`Copied ${f} from FONTS_DIR.`);
    }
  }

  const token = process.env.FONTS_REPO_TOKEN;
  if (missing().length && token) {
    const repo = process.env.FONTS_REPO || 'aakintil/aderinsola-fonts';
    const ref = process.env.FONTS_REPO_REF || 'main';
    for (const f of missing()) {
      const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(f)}?ref=${encodeURIComponent(ref)}`;
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.raw+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'aderinsola-co-build',
          },
        });
        if (!res.ok) { warn(`GitHub returned ${res.status} for ${f} in ${repo}@${ref}`); continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        if (!isWoff2(buf)) { warn(`${f} from ${repo} is not a WOFF2 file`); continue; }
        writeFileSync(join(DEST, f), buf);
        log(`Fetched ${f} from ${repo}.`);
      } catch (err) {
        warn(`Could not fetch ${f}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  const left = missing();
  if (left.length) {
    warn(`Missing ${left.join(', ')}. Building with the system font fallback.`);
    if (!dir && !token) warn('Set FONTS_DIR (local) or FONTS_REPO_TOKEN (CI). See README.md.');
  }
}

main().catch((err) => {
  warn(`Unexpected error, continuing without GT Flexa: ${err?.message ?? err}`);
});
