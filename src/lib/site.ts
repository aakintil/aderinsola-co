export const site = {
  name: 'Ade Akintilo',
  role: 'Lead Product Designer',
  description: 'A lead product designer who turns complex systems into products people use.',
  // Leave empty until confirmed. Empty values render as drafts (hidden in production).
  email: 'aderinsola.akintilo@gmail.com',
  resume: '/Aderinsola-Akintilo-Resume.pdf',
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aderinsola/' },
    { label: 'X', href: 'https://x.com/The_Aderinsola' },
  ],
} as const;

export const tones = ['sio', 'hub', 'sor', 'sor2', 'nike', 'cigna', 'gok'] as const;
export type Tone = (typeof tones)[number];

/** Inline style that gives an element a project's colors (see the project colors in tokens.css).
 *  --project-field paints the header and the top of the hero: the project color, or a --p-x-field gradient if it has one. */
export const projectColors = (t: Tone) =>
  `--project:var(--p-${t});--on-project:var(--p-${t}-on);--project-text:var(--p-${t}-text);--project-field:var(--p-${t}-field, linear-gradient(var(--p-${t}), var(--p-${t})))`;

export const pad2 = (n: number) => String(n).padStart(2, '0');

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
