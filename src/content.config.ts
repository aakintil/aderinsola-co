import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { tones } from './lib/site';

const tone = z.enum(tones);

/** An image from src/assets/img, referenced by its path from there: "sio/field-1.webp". */
const media = z.object({
  src: z.string(),
  alt: z.string(),
  /** contain: framed screenshot on a tone panel. cover: fills the frame. flat: transparent PNG, no frame. */
  fit: z.enum(['contain', 'cover', 'flat']).default('contain'),
  tone: tone.optional(),
  /** CSS aspect-ratio, e.g. "16/8". Defaults to the image's own ratio. */
  ratio: z.string().optional(),
  /** Background behind a cover image while it loads, e.g. "#111". */
  bg: z.string().optional(),
  /** CSS object-position for a cover image, e.g. "top" to keep the top edge in frame. */
  focus: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    /** Second part of the eyebrow: client or sector. */
    client: z.string().optional(),
    years: z.string().optional(),
    order: z.number().int().positive(),
    type: z.enum(['case', 'project']),
    tone,
    headline: z.string(),
    lead: z.string(),
    /** Meta description. Defaults to the lead. */
    description: z.string().optional(),
    hero: media,
    /** Wide image between the title block and the facts. */
    feature: media.optional(),
    stats: z.array(z.object({ value: z.string(), caption: z.string() })).min(1).max(4),
    meta: z.array(z.object({ label: z.string(), value: z.string() })).length(3),
    footnote: z.string().optional(),
    /** How the project appears on the home index and in "Next" links. */
    card: z.object({
      result: z.string(),
      src: z.string(),
      fit: z.enum(['contain', 'cover', 'flat']).default('contain'),
      /** Portrait-friendly image for the mobile swipe strip. */
      tall: z.string().optional(),
      bg: z.string().optional(),
      /** Looping video for the desktop home stage, in place of the image. */
      video: z
        .object({
          /** MP4 in public/media, without extension, e.g. "sio/site-walkthrough-hd" */
          src: z.string(),
          /** Poster image key in src/assets/img */
          poster: z.string(),
          /** Lighter version cropped for the mobile swipe strip's tall cards. */
          mobile: z.object({ src: z.string(), poster: z.string() }).optional(),
        })
        .optional(),
    }),
    /** Slug of the next project. Defaults to the next one in `order`, looping. */
    next: z.string().optional(),
    /** Hide the whole page in production. */
    draft: z.boolean().default(false),
  }),
});

const archive = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/archive' }),
  schema: z.object({
    name: z.string(),
    group: z.enum(['product', 'studio']),
    tags: z.array(z.enum(['product', 'brand', 'ai'])).min(1),
    order: z.number().int(),
    meta: z.string(),
    line: z.string(),
    text: z.string(),
    /** Live site or write-up. The whole tile links here. */
    url: z.string().url().optional(),
    images: z.array(z.object({ src: z.string(), alt: z.string() })).default([]),
    tone,
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, archive };
