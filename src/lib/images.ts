import type { ImageMetadata } from 'astro';

/**
 * Every image under src/assets/img, keyed by its path from there: "sio/field-1.webp".
 * Content refers to images by that key, so MDX files never need import lines.
 */
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/img/**/*.{webp,png,jpg,jpeg,avif}', {
  eager: true,
});

export function image(key: string): ImageMetadata {
  const hit = files[`/src/assets/img/${key}`];
  if (!hit) throw new Error(`Image not found: src/assets/img/${key}`);
  return hit.default;
}

export function hasImage(key: string): boolean {
  return `/src/assets/img/${key}` in files;
}
