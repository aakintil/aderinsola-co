import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_DRAFTS } from './drafts';

export type Project = CollectionEntry<'projects'>;

export const projectHref = (p: Project) => `/work/${p.id}`;

/** Published projects in homepage order. */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', ({ data }) => SHOW_DRAFTS || !data.draft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** The project's position and the one its "Next" link points to (loops back to the first). */
export function position(list: Project[], p: Project) {
  const i = list.findIndex((x) => x.id === p.id);
  const next = (p.data.next && list.find((x) => x.id === p.data.next)) || list[(i + 1) % list.length];
  return { index: i, total: list.length, next, nextIndex: list.indexOf(next) };
}
