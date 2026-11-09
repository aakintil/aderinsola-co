// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { existsSync } from 'node:fs';

// GT Flexa is copied in by scripts/fetch-fonts.mjs (prebuild). It is never in git.
// When the files are missing, the site builds with the system fallback stack.
/** @param {'Regular' | 'Bold'} weight */
const flexa = (weight) => `./src/assets/fonts/flexa/GT-Flexa-Standard-${weight}.woff2`;
const hasFlexa = existsSync(flexa('Regular')) && existsSync(flexa('Bold'));

/** @typedef {NonNullable<import('astro').AstroUserConfig<never, never, [ReturnType<typeof fontProviders.local>]>['fonts']>[number]} LocalFontFamily */

const systemSans = ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'];

export default defineConfig({
  site: 'https://aderinsola.co',
  trailingSlash: 'never',
  build: {
    format: 'directory',
    // The whole stylesheet is small: inline it so first paint never waits on a CSS request.
    inlineStylesheets: 'always',
  },
  vite: {
    define: { 'import.meta.env.HAS_FLEXA': JSON.stringify(hasFlexa) },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Plus Jakarta Sans',
      cssVariable: '--font-body',
      fallbacks: systemSans,
      options: {
        variants: [{ src: ['./src/assets/fonts/jakarta/PlusJakartaSans-Variable-latin.woff2'], weight: '200 800' }],
      },
    },
    ...(hasFlexa
      ? [
          /** @type {LocalFontFamily} */ ({
            provider: fontProviders.local(),
            name: 'GT Flexa',
            cssVariable: '--font-display',
            fallbacks: systemSans,
            options: {
              variants: [
                { src: [flexa('Regular')], weight: 400 },
                { src: [flexa('Bold')], weight: 700 },
              ],
            },
          }),
        ]
      : []),
  ],
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/404') })],
  devToolbar: { enabled: false },
});
