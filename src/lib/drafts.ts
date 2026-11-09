/**
 * Draft content.
 *
 * Placeholder copy is written in square brackets, for example "Nike Sport Research Lab · [Year]".
 * Wrap whole blocks in <Draft>. Drafts show (highlighted) in dev and on Vercel preview deploys,
 * and are removed from production HTML. Run `npm run drafts` to list them all.
 */
export const SHOW_DRAFTS =
  import.meta.env.DEV || process.env.SHOW_DRAFTS === 'true' || process.env.VERCEL_ENV === 'preview';

/** A bracketed placeholder, plus the separator before it, so "A, [B]" drops cleanly to "A". */
const DRAFT = /(\s*[,·]\s*)?\[([^\]]+)\]/g;

export type Part = { text: string; draft: boolean };

export function splitDrafts(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const m of text.matchAll(DRAFT)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), draft: false });
    parts.push({ text: m[0], draft: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), draft: false });
  return parts;
}

/** Plain text for attributes and meta tags: drafts are always removed. */
export function stripDrafts(text: string): string {
  return text.replace(DRAFT, '').replace(/\s{2,}/g, ' ').trim();
}

export function hasDraft(text: string | undefined): boolean {
  return !!text && /\[[^\]]+\]/.test(text);
}
