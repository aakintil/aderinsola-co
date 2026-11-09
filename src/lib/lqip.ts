import sharp from 'sharp';
import { join } from 'node:path';

const cache = new Map<string, Promise<string>>();

/**
 * A tiny inline preview of an image (about 0.5KB), used under heroes so they can
 * fade in "from a blur" while only animating opacity, which stays on the GPU.
 */
export function lqip(key: string): Promise<string> {
  let hit = cache.get(key);
  if (!hit) {
    hit = sharp(join(process.cwd(), 'src/assets/img', key))
      .resize(32)
      .webp({ quality: 50 })
      .toBuffer()
      .then((buf) => `data:image/webp;base64,${buf.toString('base64')}`);
    cache.set(key, hit);
  }
  return hit;
}
