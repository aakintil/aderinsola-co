# aderinsola.co

Portfolio of Ade Akintilo, Lead Product Designer. Built with Astro, TypeScript and plain CSS.
The site is part of the work, so the code aims for the same care as the design: fast, accessible,
and easy to read.

- Lighthouse (mobile): 99 to 100 Performance, 100 Accessibility, Best Practices and SEO on every page
- Zero layout shift
- About 2 KB of JavaScript per page (gzipped), and every page works with JavaScript off

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type check, then static build to dist/
npm run preview    # serve dist/
npm run drafts     # list every placeholder still in the content
```

Node 22.23 or newer (see `engines` in package.json).

## Architecture

```
src/
  content/
    projects/*.mdx       one file per case study or project page
    archive/*.md         one file per archive entry
  content.config.ts      schemas for both collections
  pages/
    index.astro          home: project index, intro, quotes
    work/[slug].astro    case and project pages, generated from content/projects
    archive.astro        archive grid, filters and dialogs
    404.astro
  layouts/Base.astro     <head>, fonts, meta, motion gate, analytics
  components/            Media, Chapter, Facts, Expander, Decision, Trio, Quote, ...
  scripts/               small vanilla TS islands (motion, expander, video, home, archive)
  styles/                tokens.css, global.css, motion.css
  lib/                   image lookup, drafts, site settings, project helpers
  assets/img/            source images (WebP), optimized at build
public/media/            videos (WebM + MP4)
scripts/                 fetch-fonts.mjs, list-drafts.mjs
```

**Pages are static HTML.** No UI framework. Each page ships one small module: the shared motion
layer plus that page's behavior.

**Images** live in `src/assets/img` and are referenced by path, for example `sio/field-1.webp`.
`Img.astro` turns each one into a responsive AVIF and WebP `<picture>` with explicit width and height,
so nothing shifts while loading. Images that only show on one side of the 720px breakpoint use a
`<source media>` trick so phones never download desktop-only images, and the reverse.

**Media frames** (`Media.astro`) come in three fits:

| fit | Use |
|---|---|
| `contain` (default) | Screenshot floated on a project-tone panel with a soft shadow |
| `cover` | Photo that fills the frame |
| `flat` | Transparent PNG export, no panel or frame |

**Motion** follows the spec in one place (`src/scripts/motion.ts` and `src/styles/motion.css`):
speed multiplier 1.2, easing `cubic-bezier(.65,0,.35,1)`, 60ms stagger.

- Above the fold, entrances are CSS animations, gated by a class an inline script sets in `<head>`.
  Nothing flashes before JS loads, and back/forward visits skip them.
- Below the fold, elements are revealed with IntersectionObserver and the Web Animations API.
  Content that is skipped by a fast jump is shown at once, never left invisible.
- Heroes fade in from a blur without animating `filter`: a 32px inline preview sits underneath,
  blurred once, and the sharp image fades in over it. Only opacity animates, so it stays on the GPU.
- Internal links fade the page out (360ms) before navigating. Back and forward stay instant.
- `prefers-reduced-motion`: no motion, everything visible, videos do not autoplay.
- The case-page reading bar is a CSS scroll-driven animation. No JS.

**Progressive enhancement.** Expanders are native `<details>`. Archive dialogs open with the native
`commandfor` Invoker Commands API and close with `closedby="any"`. Videos show native controls until
the script takes over. The home index is a list of links.

## Fonts

| Font | License | Where |
|---|---|---|
| Plus Jakarta Sans (variable, Latin) | SIL OFL | Committed in `src/assets/fonts/jakarta/` |
| GT Flexa Standard Regular and Bold | Grilli Type web license | **Never committed.** Fetched at build time |

Both are served through Astro's Fonts API, which self-hosts them with hashed file names, preloads the
weights we need and generates metric-matched fallbacks to avoid layout shift.

GT Flexa is licensed for web self-hosting only, so the files must never enter this public repo.
`src/assets/fonts/flexa/` is gitignored. Before `dev` and `build`, `scripts/fetch-fonts.mjs` puts them
there from one of:

1. **`FONTS_DIR`**, for local development: a folder holding `GT-Flexa-Standard-Regular.woff2` and
   `GT-Flexa-Standard-Bold.woff2`. Put it in `.env` (see `.env.example`).
2. **`FONTS_REPO_TOKEN`**, for Vercel: a fine-grained, read-only GitHub token for the private
   `aderinsola-fonts` repo. Set `FONTS_REPO` (`owner/name`) if the repo is not `aakintil/aderinsola-fonts`.

If neither is available, the script warns and the site builds with the system font stack. It never fails the build.

License rules: embed through CSS `@font-face` only, subsetting allowed, no other modification.
Keep analytics on, since the license is priced by monthly unique visitors. Social preview images
use photos only, never text set in Flexa (that needs a separate desktop license).

## Add a project

1. Add images to `src/assets/img/<project>/`, and any videos to `public/media/<project>/`.
2. Create `src/content/projects/<slug>.mdx`. Copy an existing file for the frontmatter. The schema in
   `src/content.config.ts` checks it at build time:

   ```yaml
   slug: my-project
   title: My Project            # eyebrow part 1, home index, next link
   client: Client or sector     # eyebrow part 2 (optional)
   years: 2024–2026             # eyebrow part 3 (optional)
   order: 6                     # home order; "Next" links follow it and loop
   type: case                   # case (full study) or project (shorter page)
   tone: hub                    # sio, hub, sor, sor2, nike, cigna, gok
   headline: The H1.
   lead: The lead line.
   hero: { src: my-project/hero.webp, alt: ..., fit: cover }
   feature: { src: ..., alt: ..., ratio: 16/8 }   # optional wide image above the facts
   stats: [{ value: 61%, caption: Leads answered, up from 18% }]   # one to three
   meta: [{ label: Role, value: ... }, { label: Team, value: ... }, { label: Scope, value: ... }]
   footnote: Optional small print under the facts.
   card: { result: Short result for the home index, src: my-project/hero.webp, fit: cover }
   ```

3. Write chapters in the body. These components are available without imports:

   ```mdx
   <Chapter eyebrow="01 · The problem" title="A short, sharp H2.">
     <Media slot="media" src="my-project/screen.webp" alt="..." tone="hub" ratio="16/9" large />

   The sub text, as a plain paragraph.

   <Expander summary="More detail">

   Hidden until opened. Numbered lists render as 01, 02, 03.

   </Expander>

     <Decision slot="after" items={[{ label: 'Chose', value: '...' }, { label: 'Why', value: '...' }]} />
   </Chapter>
   ```

   Also: `MediaGrid` (`min` or `cols`), `Video` (`src`, `poster`, `label`), `Trio`, `Quote`, `Quotes`,
   `Closing` (a ruled end section with an eyebrow), and `Draft`.

## Drafts

Placeholder content is written in square brackets, for example `years: '[Year]'` or
`Research, visual design, [design lead]`. Wrap larger blocks in `<Draft>`. A `<Media>` with a `tag`
and no `src` is an image still to come.

Drafts are highlighted in dev and on Vercel preview deploys, and removed from production HTML
(the separator before a bracket goes too, so "A, [B]" becomes "A"). Set `SHOW_DRAFTS=true` to keep them
in a production build. `npm run drafts` lists every one with its file and line.

## Deploy

Vercel, from this repo. Every pull request gets a preview deploy (with drafts visible).
Set `FONTS_REPO_TOKEN` (and `FONTS_REPO` if needed) in the Vercel project settings.
Vercel Analytics loads only on production deploys.
